/* ============================================================================
   zip-lite.js — ZIP o'qish/yozish (tashqi kutubxonasiz)
   ----------------------------------------------------------------------------
   Brauzerning o'rnatilgan DecompressionStream / CompressionStream API'sidan
   foydalanadi. .docx va .xlsx aslida ZIP arxivdir — shu modul ularni ochib,
   ichidagi XML'ni o'zgartirib, yana qayta qadoqlaydi.

   Qo'llab-quvvatlanadi: method 0 (stored), method 8 (deflate).
   Qo'llab-quvvatlanmaydi: shifrlangan arxiv, ZIP64.
   ========================================================================== */
(function (global) {
    'use strict';

    var SIG_EOCD = 0x06054b50;
    var SIG_CEN = 0x02014b50;
    var SIG_LOC = 0x04034b50;

    var CRC_TABLE = null;

    function crc32(buf) {
        if (!CRC_TABLE) {
            CRC_TABLE = new Uint32Array(256);
            for (var n = 0; n < 256; n++) {
                var c = n;
                for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                CRC_TABLE[n] = c >>> 0;
            }
        }
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function hasStreams() {
        return typeof DecompressionStream !== 'undefined' && typeof CompressionStream !== 'undefined';
    }

    async function inflateRaw(data) {
        if (!data || data.length === 0) return new Uint8Array(0);
        if (!hasStreams()) throw new Error('Brauzer siqilgan ZIP fayllarni ocholmaydi (DecompressionStream yo\u02BCq).');
        var ds = new DecompressionStream('deflate-raw');
        var stream = new Blob([data]).stream().pipeThrough(ds);
        var ab = await new Response(stream).arrayBuffer();
        return new Uint8Array(ab);
    }

    async function deflateRaw(data) {
        if (!data || data.length === 0) return new Uint8Array(0);
        if (!hasStreams()) return null;
        var cs = new CompressionStream('deflate-raw');
        var stream = new Blob([data]).stream().pipeThrough(cs);
        var ab = await new Response(stream).arrayBuffer();
        return new Uint8Array(ab);
    }

    async function unzip(arrayBuffer) {
        var buf = arrayBuffer;
        var dv = new DataView(buf);
        var len = buf.byteLength;

        var eocd = -1;
        var min = Math.max(0, len - 22 - 65535);
        for (var i = len - 22; i >= min; i--) {
            if (dv.getUint32(i, true) === SIG_EOCD) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error('Fayl ZIP arxivi emas yoki buzilgan.');

        var count = dv.getUint16(eocd + 10, true);
        var cdOffset = dv.getUint32(eocd + 16, true);
        if (count === 0xFFFF || cdOffset === 0xFFFFFFFF) {
            throw new Error('ZIP64 formatdagi arxiv qo\u02BBllab-quvvatlanmaydi.');
        }

        var entries = [];
        var p = cdOffset;

        for (var idx = 0; idx < count; idx++) {
            if (dv.getUint32(p, true) !== SIG_CEN) throw new Error('ZIP markaziy katalogi buzilgan.');
            var flags = dv.getUint16(p + 8, true);
            var method = dv.getUint16(p + 10, true);
            var crc = dv.getUint32(p + 16, true);
            var csize = dv.getUint32(p + 20, true);
            var usize = dv.getUint32(p + 24, true);
            var nlen = dv.getUint16(p + 28, true);
            var xlen = dv.getUint16(p + 30, true);
            var clen = dv.getUint16(p + 32, true);
            var extAttr = dv.getUint32(p + 38, true);
            var lho = dv.getUint32(p + 42, true);
            var nameBytes = new Uint8Array(buf, p + 46, nlen);
            var name = new TextDecoder('utf-8').decode(nameBytes);

            if (flags & 0x0001) throw new Error('Shifrlangan arxiv qo\u02BBllab-quvvatlanmaydi: ' + name);
            if (csize === 0xFFFFFFFF || lho === 0xFFFFFFFF) throw new Error('ZIP64 arxiv qo\u02BBllab-quvvatlanmaydi.');

            if (dv.getUint32(lho, true) !== SIG_LOC) throw new Error('ZIP lokal sarlavhasi buzilgan: ' + name);
            var lnlen = dv.getUint16(lho + 26, true);
            var lxlen = dv.getUint16(lho + 28, true);
            var dataStart = lho + 30 + lnlen + lxlen;

            entries.push({
                name: name,
                method: method,
                crc: crc,
                size: usize,
                extAttr: extAttr,
                _raw: new Uint8Array(buf, dataStart, csize),
                _data: null
            });

            p += 46 + nlen + xlen + clen;
        }

        return entries;
    }

    async function entryData(entry) {
        if (entry._data) return entry._data;
        var data;
        if (entry.method === 0) data = entry._raw.slice();
        else if (entry.method === 8) data = await inflateRaw(entry._raw);
        else throw new Error('Noma\u02BClum siqish usuli (' + entry.method + '): ' + entry.name);
        entry._data = data;
        return data;
    }

    function setText(entry, text) {
        entry._data = new TextEncoder().encode(text);
        entry._raw = null;
    }

    function getText(entry) {
        return entryData(entry).then(function (data) {
            return new TextDecoder('utf-8').decode(data);
        });
    }

    async function zipWrite(entries) {
        var encoder = new TextEncoder();
        var locals = [];
        var centrals = [];
        var offset = 0;

        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            var data = await entryData(e);
            var nameBytes = encoder.encode(e.name);
            var isDir = e.name.charAt(e.name.length - 1) === '/';
            var utf8 = /[^\x00-\x7F]/.test(e.name);

            var payload = null;
            var method = 0;

            if (!isDir && data.length > 0) {
                var deflated = await deflateRaw(data);
                if (deflated && deflated.length < data.length) {
                    payload = deflated;
                    method = 8;
                } else {
                    payload = data;
                    method = 0;
                }
            } else {
                payload = new Uint8Array(0);
                method = 0;
            }

            var crc = isDir ? 0 : crc32(data);
            var flags = utf8 ? 0x0800 : 0;

            var lh = new Uint8Array(30);
            var ldv = new DataView(lh.buffer);
            ldv.setUint32(0, SIG_LOC, true);
            ldv.setUint16(4, 20, true);
            ldv.setUint16(6, flags, true);
            ldv.setUint16(8, method, true);
            ldv.setUint16(10, 0, true);
            ldv.setUint16(12, 0x21, true);
            ldv.setUint32(14, crc, true);
            ldv.setUint32(18, payload.length, true);
            ldv.setUint32(22, data.length, true);
            ldv.setUint16(26, nameBytes.length, true);
            ldv.setUint16(28, 0, true);

            locals.push(lh, nameBytes, payload);

            var ch = new Uint8Array(46);
            var cdv = new DataView(ch.buffer);
            cdv.setUint32(0, SIG_CEN, true);
            cdv.setUint16(4, 20, true);
            cdv.setUint16(6, 20, true);
            cdv.setUint16(8, flags, true);
            cdv.setUint16(10, method, true);
            cdv.setUint16(12, 0, true);
            cdv.setUint16(14, 0x21, true);
            cdv.setUint32(16, crc, true);
            cdv.setUint32(20, payload.length, true);
            cdv.setUint32(24, data.length, true);
            cdv.setUint16(28, nameBytes.length, true);
            cdv.setUint32(38, isDir ? 0x10 : (e.extAttr || 0), true);
            cdv.setUint32(42, offset, true);

            centrals.push(ch, nameBytes);

            offset += 30 + nameBytes.length + payload.length;
        }

        var cdStart = offset;
        var cdSize = 0;
        for (var c = 0; c < centrals.length; c++) cdSize += centrals[c].length;

        var end = new Uint8Array(22);
        var edv = new DataView(end.buffer);
        edv.setUint32(0, SIG_EOCD, true);
        edv.setUint16(8, entries.length, true);
        edv.setUint16(10, entries.length, true);
        edv.setUint32(12, cdSize, true);
        edv.setUint32(16, cdStart, true);

        var all = locals.concat(centrals).concat([end]);
        var total = 0;
        for (var a = 0; a < all.length; a++) total += all[a].length;

        var out = new Uint8Array(total);
        var q = 0;
        for (var b = 0; b < all.length; b++) { out.set(all[b], q); q += all[b].length; }
        return out;
    }

    var api = {
        crc32: crc32,
        unzip: unzip,
        zipWrite: zipWrite,
        entryData: entryData,
        setText: setText,
        getText: getText,
        hasStreams: hasStreams
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.ZipLite = api;

})(typeof globalThis !== 'undefined' ? globalThis : this);
