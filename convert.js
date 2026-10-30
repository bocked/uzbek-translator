/* ============================================================================
   convert.js — .docx / .xlsx fayllarini o'girish quvuri
   ----------------------------------------------------------------------------
   ZIP ichidagi XML qismlarini topadi, matnni o'giradi va qayta qadoqlaydi.
   Fayl hech qayerga yuborilmaydi — hammasi brauzer xotirasida bajariladi.
   ========================================================================== */
(function (global) {
    'use strict';

    var DOCX_PARTS = /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/i;
    var XLSX_SHARED = /^xl\/sharedStrings\.xml$/i;
    var XLSX_SHEET = /^xl\/worksheets\/[^\/]+\.xml$/i;

    function detectKind(entries) {
        var has = function (n) {
            for (var i = 0; i < entries.length; i++) if (entries[i].name === n) return true;
            return false;
        };
        if (has('word/document.xml')) return 'docx';
        if (has('xl/workbook.xml')) return 'xlsx';
        return null;
    }

    async function convertBlob(blob, opts) {
        opts = opts || {};
        var C = global.AlifboCore;
        var Z = global.ZipLite;

        var buf = await blob.arrayBuffer();
        var entries;
        try {
            entries = await Z.unzip(buf);
        } catch (e) {
            throw new Error('Faylni ochib bo\u02BClmadi. Faqat .docx va .xlsx qabul qilinadi.');
        }
        var kind = detectKind(entries);

        if (!kind) {
            throw new Error('Bu fayl .docx yoki .xlsx emas (yoki eski .doc / .xls formatida).');
        }

        var ng = opts.ng !== false;
        var mode = opts.mode || 'lotin';
        var convert = function (s) { return C.convertWithMap(s, mode, { ng: ng }); };

        var changedParts = 0;

        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (e.name.charAt(e.name.length - 1) === '/') continue;

            var changedHere = false;

            if (kind === 'docx' && DOCX_PARTS.test(e.name)) {
                var xml = await Z.getText(e);
                var out = C.convertDocxXml(xml, convert);
                if (out !== xml) { Z.setText(e, out); changedParts++; }
                changedHere = true;
            }

            if (!changedHere && kind === 'xlsx') {
                if (XLSX_SHARED.test(e.name)) {
                    var s1 = await Z.getText(e);
                    var r1 = C.convertSharedStringsXml(s1, convert);
                    if (r1 !== s1) { Z.setText(e, r1); changedParts++; }
                    changedHere = true;
                } else if (XLSX_SHEET.test(e.name)) {
                    var s2 = await Z.getText(e);
                    var r2 = C.convertSheetXml(s2, convert);
                    if (r2 !== s2) { Z.setText(e, r2); changedParts++; }
                    changedHere = true;
                }
            }
        }

        var outBuf = await Z.zipWrite(entries);
        var mime = kind === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        return {
            blob: new Blob([outBuf], { type: mime }),
            kind: kind,
            changedParts: changedParts
        };
    }

    function outputName(originalName, mode) {
        var dot = originalName.lastIndexOf('.');
        var base = dot > 0 ? originalName.slice(0, dot) : originalName;
        var ext = dot > 0 ? originalName.slice(dot) : '';
        var suffix = mode === 'orqaga' ? '_eski' : '_yangi';
        return base + suffix + ext;
    }

    var api = {
        detectKind: detectKind,
        convertBlob: convertBlob,
        outputName: outputName
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.Convert = api;

})(typeof globalThis !== 'undefined' ? globalThis : this);
