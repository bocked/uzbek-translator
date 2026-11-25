/* ============================================================================
   alifbo-core.js — Yangi o'zbek alifbosi konvertori (sof mantiq)
   ----------------------------------------------------------------------------
   Tashqi kutubxonalarsiz ishlaydi. Brauzerda ham, Node'da ham yuklanadi.

   Qoidalar:
     Oʻ / oʻ  ->  Ö / ö
     Gʻ / gʻ  ->  Ğ / ğ
     Sh / sh  ->  Ş / ş
     Ch / ch  ->  Ç / ç

   Rejimlar:
     'lotin'   — eski lotin  -> yangi lotin
     'orqaga'  — yangi lotin -> eski lotin
     'kirill'  — kirill      -> yangi lotin
     'eski'    — kirill      -> eski lotin
     'kirillga'— lotin       -> kirill

   Alifbo aniqlash:
     detectAlphabet(text) -> { code, confident, counts }
     code: 'kirill' | 'eski' | 'yangi' | 'unknown'
   ========================================================================== */
(function (global) {
    'use strict';

    /* --- apostrof variantlari: ' ’ ‘ ʻ ʼ ` ´ ′ --------------------------- */
    var APOS = "['\\u2018\\u2019\\u02BB\\u02BC\\u0060\\u00B4\\u2032]";
    var APOS_ONE = /['\u2018\u2019\u02BB\u02BC\u0060\u00B4\u2032]/;

    /* ng -> ñ qoidasi ataylab qo'shilmagan: foydalanuvchi talabiga ko'ra
       "ng" harf birikmasi o'zgartirilmaydi (tong -> tong). */
    var LOTIN_RE = new RegExp([
        '(?<oa>[oO])' + APOS,
        '(?<ga>[gG])' + APOS,
        '(?<sh>[sS])(?<h>[hH])',
        '(?<ch>[cC])(?<h2>[hH])'
    ].join('|'), 'g');

    function lotinReplace(groups) {
        if (groups.oa !== undefined) return groups.oa === 'O' ? '\u00D6' : '\u00F6'; // Ö ö
        if (groups.ga !== undefined) return groups.ga === 'G' ? '\u011E' : '\u011F'; // Ğ ğ
        if (groups.sh !== undefined) return groups.sh === 'S' ? '\u015E' : '\u015F'; // Ş ş
        if (groups.ch !== undefined) return groups.ch === 'C' ? '\u00C7' : '\u00E7'; // Ç ç
        return '';
    }

    /* --- eski lotin -> yangi lotin ---------------------------------------- */
    function lotinPass(text) {
        var re = LOTIN_RE;
        re.lastIndex = 0;

        var out = '';
        var map = [];
        var last = 0;
        var m;

        while ((m = re.exec(text)) !== null) {
            if (m[0].length === 0) { re.lastIndex++; continue; }
            for (var k = last; k < m.index; k++) { out += text[k]; map.push(k); }
            var rep = lotinReplace(m.groups || {});
            for (var j = 0; j < rep.length; j++) { out += rep[j]; map.push(m.index); }
            last = m.index + m[0].length;
        }
        for (var p = last; p < text.length; p++) { out += text[p]; map.push(p); }
        return { out: out, map: map };
    }

    /* --- yangi lotin -> eski lotin ---------------------------------------- */
    var REV_MAP = {
        '\u015F': 'sh', '\u015E': 'Sh',
        '\u00E7': 'ch', '\u00C7': 'Ch',
        '\u00F1': 'ng', '\u00D1': 'Ng',
        '\u00F6': 'o\u02BB', '\u00D6': 'O\u02BB',
        '\u011F': 'g\u02BB', '\u011E': 'G\u02BB'
    };
    var REV_RE = /[\u015F\u015E\u00E7\u00C7\u00F1\u00D1\u00F6\u00D6\u011F\u011E]/g;

    function revPass(text) {
        var out = '';
        var map = [];
        var last = 0;
        var m;
        REV_RE.lastIndex = 0;

        while ((m = REV_RE.exec(text)) !== null) {
            for (var k = last; k < m.index; k++) { out += text[k]; map.push(k); }
            var rep = REV_MAP[m[0]];
            for (var j = 0; j < rep.length; j++) { out += rep[j]; map.push(m.index); }
            last = m.index + m[0].length;
        }
        for (var p = last; p < text.length; p++) { out += text[p]; map.push(p); }
        return { out: out, map: map };
    }

    /* --- kirill -> eski lotin --------------------------------------------- */
    var CYR = {
        '\u0430': 'a', '\u0431': 'b', '\u0432': 'v', '\u0433': 'g',
        '\u0434': 'd', '\u0436': 'j', '\u0437': 'z', '\u0438': 'i',
        '\u0439': 'y', '\u043A': 'k', '\u043B': 'l', '\u043C': 'm',
        '\u043D': 'n', '\u043E': 'o', '\u043F': 'p', '\u0440': 'r',
        '\u0441': 's', '\u0442': 't', '\u0443': 'u', '\u0444': 'f',
        '\u0445': 'x', '\u0446': 'ts', '\u0447': 'ch', '\u0448': 'sh',
        '\u0449': 'shch', '\u044A': '\u02BC', '\u044B': 'i', '\u044C': '',
        '\u044D': 'e', '\u045E': 'o\u02BB', '\u049B': 'q',
        '\u0493': 'g\u02BB', '\u04B3': 'h'
    };

    var IOTATED = {
        '\u0435': { plain: 'e', iot: 'ye' },
        '\u0451': { plain: 'o', iot: 'yo' },
        '\u044E': { plain: 'u', iot: 'yu' },
        '\u044F': { plain: 'a', iot: 'ya' }
    };

    function capFirst(s) {
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function cyrPass(text) {
        var out = '';
        var map = [];

        for (var i = 0; i < text.length; i++) {
            var ch = text.charAt(i);
            var low = ch.toLowerCase();
            var upper = ch !== low;
            var rep = null;

            if (IOTATED[low]) {
                var prev = out.slice(-1).toLowerCase();
                var prevIsLetter = /[a-z\u015F\u00E7\u011F\u00F1\u00F6]/.test(prev);
                var prevIsVowel = 'aeiou\u00F6'.indexOf(prev) !== -1;
                var iotated = !prevIsLetter || prevIsVowel;
                rep = iotated ? IOTATED[low].iot : IOTATED[low].plain;
                if (upper) rep = capFirst(rep);
            } else if (CYR[low] !== undefined) {
                rep = CYR[low];
                if (upper && rep) rep = capFirst(rep);
            }

            if (rep === null) {
                out += ch;
                map.push(i);
            } else {
                for (var j = 0; j < rep.length; j++) { out += rep[j]; map.push(i); }
            }
        }
        return { out: out, map: map };
    }

    /* --- lotin -> kirill (yangi va eski lotin uchun) -----------------------
       cyrPass ning teskari ko'rinishi. Oldin lotinPass qo'llaniladi, shuning
       uchun ham eski (`sh`, `ch`, `oʻ`), ham yangi (`ş`, `ç`, `ö`) belgilar
       bir xil tarzda kirillga o'tadi.
    ---------------------------------------------------------------------- */
    var LAT_CYR = {
        'a': '\u0430', 'b': '\u0431', 'v': '\u0432', 'g': '\u0433',
        'd': '\u0434', 'j': '\u0436', 'z': '\u0437', 'i': '\u0438',
        'y': '\u0439', 'k': '\u043A', 'l': '\u043B', 'm': '\u043C',
        'n': '\u043D', 'o': '\u043E', 'p': '\u043F', 'r': '\u0440',
        's': '\u0441', 't': '\u0442', 'u': '\u0443', 'f': '\u0444',
        'x': '\u0445', 'h': '\u04B3', 'q': '\u049B', 'e': '\u0435',
        '\u015F': '\u0448', '\u00E7': '\u0447', '\u011F': '\u0493',
        '\u00F6': '\u045E', '\u00F1': '\u043D\u0433'
    };

    var LAT_KIR_RE = new RegExp([
        'shch|sh|ch|ts',
        '[oO]' + APOS,
        '[gG]' + APOS,
        'ye|yo|yu|ya',
        '[A-Za-z\\u015E\\u015F\\u00C7\\u00E7\\u011E\\u011F\\u00D6\\u00F6\\u00D1\\u00F1\\u02BB\\u02BC]'
    ].join('|'), 'gi');

    function latinToken(tok, prevSrc) {
        var low = tok.toLowerCase();
        var upper = tok.charAt(0) !== tok.charAt(0).toLowerCase();
        var prevLetter = /[a-z\u015F\u00E7\u011F\u00F1\u00F6]/.test(prevSrc);
        var prevVowel = 'aeiou\u00F6'.indexOf(prevSrc) !== -1;
        var iot = !prevLetter || prevVowel;
        var rep;

        if (low === 'shch') rep = '\u0449';
        else if (low === 'sh') rep = '\u0448';
        else if (low === 'ch') rep = '\u0447';
        else if (low === 'ts') rep = '\u0446';
        else if (tok.length === 2 && low.charAt(0) === 'o' && APOS_ONE.test(tok.charAt(1))) rep = '\u045E';
        else if (tok.length === 2 && low.charAt(0) === 'g' && APOS_ONE.test(tok.charAt(1))) rep = '\u0493';
        else if (low === 'ye') rep = '\u0435';
        else if (low === 'yo') rep = iot ? '\u0451' : '\u043E';
        else if (low === 'yu') rep = iot ? '\u044E' : '\u0443';
        else if (low === 'ya') rep = iot ? '\u044F' : '\u0430';
        else if (low === '\u02BB' || low === '\u02BC') rep = '\u044A';
        else rep = LAT_CYR[low] || tok;

        if (upper && rep !== tok) rep = capFirst(rep);
        return rep;
    }

    function latinToCyrPass(text) {
        var out = '';
        var map = [];
        var last = 0;
        var prevSrc = '';
        var m;
        LAT_KIR_RE.lastIndex = 0;

        while ((m = LAT_KIR_RE.exec(text)) !== null) {
            for (var k = last; k < m.index; k++) { out += text[k]; map.push(k); }

            var rep = latinToken(m[0], prevSrc);
            for (var j = 0; j < rep.length; j++) { out += rep[j]; map.push(m.index); }

            var tail = m[0].charAt(m[0].length - 1).toLowerCase();
            prevSrc = /[a-z\u015F\u00E7\u011F\u00F1\u00F6]/.test(tail) ? tail : '';
            last = m.index + m[0].length;
        }
        for (var p = last; p < text.length; p++) { out += text[p]; map.push(p); }
        return { out: out, map: map };
    }

    /* --- ikki bosqichni birlashtirish ------------------------------------- */
    function compose(a, b) {
        var out = '';
        var map = [];
        for (var k = 0; k < b.out.length; k++) {
            out += b.out[k];
            map.push(a.map[b.map[k]]);
        }
        return { out: out, map: map };
    }

    /* --- asosiy API -------------------------------------------------------- */
    function convertWithMap(text, mode, opts) {
        opts = opts || {};

        if (mode === 'kirill') {
            var c = cyrPass(text);
            var l = lotinPass(c.out);
            return compose(c, l);
        }
        if (mode === 'eski') return cyrPass(text);
        if (mode === 'kirillga') {
            var lp = lotinPass(text);
            return compose(lp, latinToCyrPass(lp.out));
        }
        if (mode === 'orqaga') return revPass(text);
        return lotinPass(text);
    }

    function convertPlain(text, mode, opts) {
        return convertWithMap(text, mode, opts).out;
    }

    /* --- havola / e-pochta manzillarini saqlab qolish --------------------- */
    var LINK_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

    function convertTextSafe(text, mode, opts) {
        opts = opts || {};
        if (opts.keepLinks === false) return convertPlain(text, mode, opts);

        var out = '';
        var last = 0;
        var m;
        LINK_RE.lastIndex = 0;
        while ((m = LINK_RE.exec(text)) !== null) {
            out += convertPlain(text.slice(last, m.index), mode, opts) + m[0];
            last = m.index + m[0].length;
        }
        out += convertPlain(text.slice(last), mode, opts);
        return out;
    }

    /* --- alifbo aniqlash ---------------------------------------------------
       Faqat matn bo'laklari beriladi (XML tag atributlari/URL'lar hisobga
       olinmaydi). Hisob: kirill harflari, yangi alifbo harflari (Ö Ğ Ş Ç Ñ),
       eski lotin izlari (sh/ch va oʻ/gʻ).
    ---------------------------------------------------------------------- */
    var RE_CYR = /[\u0400-\u052F]/g;
    var RE_NEW = /[\u00D6\u00F6\u011E\u011F\u015E\u015F\u00C7\u00E7\u00D1\u00F1]/g;
    var RE_OLD_DIG = /[sS][hH]|[cC][hH]/g;
    var RE_OLD_APOS = new RegExp('[oOgG]' + APOS, 'g');
    var RE_LATIN = /[A-Za-z]/g;

    function countMatches(text, re) {
        var n = 0;
        var m;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
            if (m[0].length === 0) re.lastIndex++;
            else n++;
        }
        return n;
    }

    function detectAlphabet(text) {
        text = String(text || '').slice(0, 200000);

        var cyr = countMatches(text, RE_CYR);
        var nu = countMatches(text, RE_NEW);
        var oldDig = countMatches(text, RE_OLD_DIG);
        var oldApos = countMatches(text, RE_OLD_APOS);
        var lat = countMatches(text, RE_LATIN);
        var old = oldDig + oldApos;

        var code;
        var confident = true;

        if (cyr >= 4 && cyr >= nu && cyr >= old) code = 'kirill';
        else if (nu > 0 && nu * 2 >= old) code = 'yangi';
        else if (old > 0) code = 'eski';
        else if (cyr > 0) code = 'kirill';
        else if (lat > 0) { code = 'eski'; confident = false; }
        else { code = 'unknown'; confident = false; }

        return {
            code: code,
            confident: confident,
            counts: { kirill: cyr, yangi: nu, eski: old, latin: lat }
        };
    }

    /* --- XML entity helpers ----------------------------------------------- */
    var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

    function decodeEnt(s) {
        return s.replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, function (m, g) {
            if (g.charAt(0) === '#') {
                var code = (g.charAt(1) === 'x' || g.charAt(1) === 'X')
                    ? parseInt(g.slice(2), 16)
                    : parseInt(g.slice(1), 10);
                try { return String.fromCodePoint(code); } catch (e) { return m; }
            }
            return ENT[g] !== undefined ? ENT[g] : m;
        });
    }

    function encEnt(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* detection uchun faqat ko'rinadigan matn: <w:t> yoki <t> ichi */
    function extractText(xml, kind) {
        var re = kind === 'docx'
            ? /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
            : /<t\b[^>]*>([\s\S]*?)<\/t>/g;
        var out = '';
        var total = 0;
        var m;
        while ((m = re.exec(xml)) !== null) {
            var piece = decodeEnt(m[1]);
            if (!piece) continue;
            out += (out ? ' ' : '') + piece;
            total += piece.length;
            if (total >= 200000) break;
        }
        return out;
    }

    /* --- guruhlangan XML matnini o'girish ---------------------------------
       Word:  <w:p> ... <w:t>matn</w:t> ... </w:p>
       Excel: <si>  ... <t>matn</t>   ... </si>

       Matn bir nechta <t> bo'laklariga bo'lingan bo'lsa ham (masalan "s" va
       "h" alohida run'larda), biz butun guruh matnini birlashtirib o'giramiz va
       natijani har bir bo'lakning boshlanish pozitsiyasi bo'yicha qaytaramiz.
       Shu bilan "sh" -> "ş" kabi holatlar ham to'g'ri ishlaydi.
    ---------------------------------------------------------------------- */
    function convertTextNodes(group, textRe, convert) {
        var tRe = new RegExp(textRe.source, textRe.flags.indexOf('g') === -1 ? textRe.flags + 'g' : textRe.flags);
        tRe.lastIndex = 0;

        var nodes = [];
        var m;
        while ((m = tRe.exec(group)) !== null) {
            if (m[0].length === 0) { tRe.lastIndex++; continue; }
            nodes.push({
                innerStart: m.index + m[1].length,
                innerEnd: m.index + m[1].length + m[2].length,
                text: decodeEnt(m[2])
            });
        }
        if (nodes.length === 0) return group;

        var combined = '';
        var owner = [];
        for (var i = 0; i < nodes.length; i++) {
            combined += nodes[i].text;
            for (var k = 0; k < nodes[i].text.length; k++) owner.push(i);
        }
        if (combined.length === 0) return group;

        var res = convert(combined);
        var outText = res.out;
        var outMap = res.map;

        var buf = new Array(nodes.length);
        for (var b = 0; b < nodes.length; b++) buf[b] = '';

        for (var p = 0; p < outText.length; p++) {
            var src = outMap[p];
            if (src >= owner.length) src = owner.length - 1;
            if (src < 0) src = 0;
            buf[owner[src]] += outText[p];
        }

        var result = '';
        var last = 0;
        for (var n = 0; n < nodes.length; n++) {
            result += group.slice(last, nodes[n].innerStart) + encEnt(buf[n]);
            last = nodes[n].innerEnd;
        }
        result += group.slice(last);
        return result;
    }

    function convertGroupedXml(xml, groupRe, textRe, convert) {
        var gRe = new RegExp(groupRe.source, groupRe.flags.indexOf('g') === -1 ? groupRe.flags + 'g' : groupRe.flags);
        return xml.replace(gRe, function (group) {
            return convertTextNodes(group, textRe, convert);
        });
    }

    function convertDocxXml(xml, convert) {
        var PARA = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
        var TEXT = /(<w:t\b[^>]*>)([\s\S]*?)<\/w:t>/g;
        var BREAK = /(<w:(?:tab|br|cr)\b[^>]*\/>)/;

        return xml.replace(PARA, function (para) {
            var parts = para.split(BREAK);
            for (var i = 0; i < parts.length; i += 2) {
                parts[i] = convertTextNodes(parts[i], TEXT, convert);
            }
            return parts.join('');
        });
    }

    function convertSharedStringsXml(xml, convert) {
        return convertGroupedXml(xml, /<si\b[^>]*>[\s\S]*?<\/si>/g, /(<t\b[^>]*>)([\s\S]*?)<\/t>/g, convert);
    }

    function convertSheetXml(xml, convert) {
        return convertGroupedXml(xml, /<is\b[^>]*>[\s\S]*?<\/is>/g, /(<t\b[^>]*>)([\s\S]*?)<\/t>/g, convert);
    }

    var api = {
        APOS: APOS,
        lotinPass: lotinPass,
        revPass: revPass,
        cyrPass: cyrPass,
        latinToCyrPass: latinToCyrPass,
        compose: compose,
        convertWithMap: convertWithMap,
        convertPlain: convertPlain,
        convertTextSafe: convertTextSafe,
        detectAlphabet: detectAlphabet,
        decodeEnt: decodeEnt,
        encEnt: encEnt,
        extractText: extractText,
        convertGroupedXml: convertGroupedXml,
        convertTextNodes: convertTextNodes,
        convertDocxXml: convertDocxXml,
        convertSharedStringsXml: convertSharedStringsXml,
        convertSheetXml: convertSheetXml
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.AlifboCore = api;

})(typeof globalThis !== 'undefined' ? globalThis : this);
