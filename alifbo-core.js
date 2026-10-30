/* ============================================================================
   alifbo-core.js — Yangi o'zbek alifbosi konvertori (sof mantiq)
   ----------------------------------------------------------------------------
   Tashqi kutubxonalarsiz ishlaydi. Brauzerda ham, Node'da ham yuklanadi.

   Qoidalar:
     Oʻ / oʻ  ->  Ö / ö
     Gʻ / gʻ  ->  Ğ / ğ
     Sh / sh  ->  Ş / ş
     Ch / ch  ->  Ç / ç
     Ng / ng  ->  Ñ / ñ   (ixtiyoriy)

   Rejimlar:
     'lotin'  — eski lotin  -> yangi lotin
     'orqaga' — yangi lotin  -> eski lotin
     'kirill' — kirill       -> yangi lotin
   ========================================================================== */
(function (global) {
    'use strict';

    /* --- apostrof variantlari: ' ’ ‘ ʻ ʼ ` ´ ′ --------------------------- */
    var APOS = "['\\u2018\\u2019\\u02BB\\u02BC\\u0060\\u00B4\\u2032]";

    var LOTIN_RE_CACHE = {};

    function buildLotinRe(useNg) {
        var key = useNg ? '1' : '0';
        if (LOTIN_RE_CACHE[key]) return LOTIN_RE_CACHE[key];
        var parts = [
            '(?<oa>[oO])' + APOS,
            '(?<ga>[gG])' + APOS,
            '(?<sh>[sS])(?<h>[hH])',
            '(?<ch>[cC])(?<h2>[hH])'
        ];
        if (useNg) parts.push('(?<ng>[nN])(?<g2>[gG])');
        var re = new RegExp(parts.join('|'), 'g');
        LOTIN_RE_CACHE[key] = re;
        return re;
    }

    function lotinReplace(groups) {
        if (groups.oa !== undefined) return groups.oa === 'O' ? '\u00D6' : '\u00F6'; // Ö ö
        if (groups.ga !== undefined) return groups.ga === 'G' ? '\u011E' : '\u011F'; // Ğ ğ
        if (groups.sh !== undefined) return groups.sh === 'S' ? '\u015E' : '\u015F'; // Ş ş
        if (groups.ch !== undefined) return groups.ch === 'C' ? '\u00C7' : '\u00E7'; // Ç ç
        if (groups.ng !== undefined) return groups.ng === 'N' ? '\u00D1' : '\u00F1'; // Ñ ñ
        return '';
    }

    /* --- eski lotin -> yangi lotin ---------------------------------------- */
    function lotinPass(text, useNg) {
        var re = buildLotinRe(useNg !== false);
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
        var useNg = opts.ng !== false;

        if (mode === 'kirill') {
            var c = cyrPass(text);
            var l = lotinPass(c.out, useNg);
            return compose(c, l);
        }
        if (mode === 'orqaga') return revPass(text);
        return lotinPass(text, useNg);
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

    /* --- guruhlangan XML matnini o'girish ---------------------------------
       Word:  <w:p> ... <w:t>matn</w:t> ... </w:p>
       Excel: <si>  ... <t>matn</t>   ... </si>

       Matn bir nechta <t> bo'laklariga bo'lingan bo'lsa ham (masalan "s" va "h"
       alohida run'larda), biz butun guruh matnini birlashtirib o'giramiz va
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
        buildLotinRe: buildLotinRe,
        lotinPass: lotinPass,
        revPass: revPass,
        cyrPass: cyrPass,
        compose: compose,
        convertWithMap: convertWithMap,
        convertPlain: convertPlain,
        convertTextSafe: convertTextSafe,
        decodeEnt: decodeEnt,
        encEnt: encEnt,
        convertGroupedXml: convertGroupedXml,
        convertTextNodes: convertTextNodes,
        convertDocxXml: convertDocxXml,
        convertSharedStringsXml: convertSharedStringsXml,
        convertSheetXml: convertSheetXml
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.AlifboCore = api;

})(typeof globalThis !== 'undefined' ? globalThis : this);
