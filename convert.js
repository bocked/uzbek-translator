/* ============================================================================
   convert.js — .docx / .xlsx fayllarini o'girish quvuri
   ----------------------------------------------------------------------------
   ZIP ichidagi XML qismlarini topadi, matnni o'giradi va qayta qadoqlaydi.
   Fayl hech qayerga yuborilmaydi — hammasi brauzer xotirasida bajariladi.

   Convert.convertBlob(file, { to: 'yangi' | 'eski' | 'kirill' })
     -> { blob, kind, from, to, mode, detected, changedParts, textChars }
   ========================================================================== */
(function (global) {
    'use strict';

    var DOCX_PARTS = /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/i;
    var XLSX_SHARED = /^xl\/sharedStrings\.xml$/i;
    var XLSX_SHEET = /^xl\/worksheets\/[^\/]+\.xml$/i;

    var TARGETS = { yangi: 1, eski: 1, kirill: 1 };

    /* maqsad alifbo -> manba alifbo -> core rejimi.
       null = o'zgartirish yo'q (fayl faqat yangi nom bilan qadoqlanadi). */
    var MODE_FOR = {
        yangi: { eski: 'lotin', kirill: 'kirill', yangi: null },
        eski: { yangi: 'orqaga', kirill: 'eski', eski: null },
        kirill: { yangi: 'kirillga', eski: 'kirillga', kirill: null }
    };

    function detectKind(entries) {
        var has = function (n) {
            for (var i = 0; i < entries.length; i++) if (entries[i].name === n) return true;
            return false;
        };
        if (has('word/document.xml')) return 'docx';
        if (has('xl/workbook.xml')) return 'xlsx';
        return null;
    }

    function isTextPart(kind, name) {
        if (kind === 'docx') return DOCX_PARTS.test(name);
        return XLSX_SHARED.test(name) || XLSX_SHEET.test(name);
    }

    function modeFor(from, to) {
        if (!TARGETS[to] || !MODE_FOR[to]) return null;
        return MODE_FOR[to][from] === undefined ? null : MODE_FOR[to][from];
    }

    async function readFile(blob) {
        var buf = await blob.arrayBuffer();
        var entries;
        try {
            entries = await global.ZipLite.unzip(buf);
        } catch (e) {
            throw new Error('Faylni ochib bo\u02BClmadi. Faqat .docx va .xlsx qabul qilinadi.');
        }
        return entries;
    }

    function badFile() {
        return new Error('Bu fayl .docx yoki .xlsx emas (yoki eski .doc / .xls formatida).');
    }

    /* Faqat ko'rinadigan matn: tag atributlari, URL va style'lar hisobga
       olinmaydi. detection shu matn asosida bajariladi. */
    async function collectText(entries, kind) {
        var C = global.AlifboCore;
        var Z = global.ZipLite;
        var chunks = [];
        var total = 0;

        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (!isTextPart(kind, e.name)) continue;

            var xml = await Z.getText(e);
            var piece = C.extractText(xml, kind);
            if (!piece) continue;

            chunks.push(piece);
            total += piece.length;
            if (total >= 200000) break;
        }
        return chunks.join(' ');
    }

    async function detectBlob(blob) {
        var C = global.AlifboCore;
        var entries = await readFile(blob);
        var kind = detectKind(entries);
        if (!kind) throw badFile();

        var text = await collectText(entries, kind);
        return {
            kind: kind,
            alphabet: C.detectAlphabet(text),
            textChars: text.length
        };
    }

    async function convertBlob(blob, opts) {
        opts = opts || {};
        var C = global.AlifboCore;
        var Z = global.ZipLite;

        var to = TARGETS[opts.to] ? opts.to : 'yangi';
        var entries = await readFile(blob);
        var kind = detectKind(entries);
        if (!kind) throw badFile();

        var text = await collectText(entries, kind);
        var detected = C.detectAlphabet(text);

        var from = detected.code === 'unknown' ? 'eski' : detected.code;
        if (opts.from === 'kirill' || opts.from === 'eski' || opts.from === 'yangi') from = opts.from;

        var mode = modeFor(from, to);
        var convert = mode
            ? function (s) { return C.convertWithMap(s, mode); }
            : null;

        var changedParts = 0;

        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (!isTextPart(kind, e.name)) continue;

            var xml = await Z.getText(e);
            var out;

            if (kind === 'docx') {
                out = convert ? C.convertDocxXml(xml, convert) : xml;
            } else if (XLSX_SHARED.test(e.name)) {
                out = convert ? C.convertSharedStringsXml(xml, convert) : xml;
            } else {
                out = convert ? C.convertSheetXml(xml, convert) : xml;
            }

            if (out !== xml) { Z.setText(e, out); changedParts++; }
        }

        var outBuf = await Z.zipWrite(entries);
        var mime = kind === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        return {
            blob: new Blob([outBuf], { type: mime }),
            kind: kind,
            from: from,
            to: to,
            mode: mode,
            detected: detected,
            changedParts: changedParts,
            textChars: text.length
        };
    }

    /* Eski chaqiruvlar (mode: 'lotin' | 'orqaga' | 'kirill') ham ishlaydi. */
    function outputName(originalName, opts) {
        var to;
        if (typeof opts === 'string') {
            to = opts === 'orqaga' ? 'eski' : 'yangi';
        } else {
            to = opts && TARGETS[opts.to] ? opts.to : 'yangi';
        }
        var dot = originalName.lastIndexOf('.');
        var base = dot > 0 ? originalName.slice(0, dot) : originalName;
        var ext = dot > 0 ? originalName.slice(dot) : '';
        var suffix = to === 'kirill' ? '_kirill' : to === 'eski' ? '_eski' : '_yangi';
        return base + suffix + ext;
    }

    var api = {
        TARGETS: TARGETS,
        MODE_FOR: MODE_FOR,
        detectKind: detectKind,
        modeFor: modeFor,
        detectBlob: detectBlob,
        convertBlob: convertBlob,
        outputName: outputName
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.Convert = api;

})(typeof globalThis !== 'undefined' ? globalThis : this);
