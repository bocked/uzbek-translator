/* ============================================================================
   effects.js — ob-havo va faslga mos dinamik fon effektlari
   ----------------------------------------------------------------------------
   Tashqi kutubxona yo'q: butun animatsiya bitta canvas va requestAnimationFrame
   bilan ishlaydi, shuning uchun qo'shimcha tarmoq so'rovi yoki og'ir paket yo'q.

   Mantiq:
     1. Open-Meteo'dan joriy `weathercode` olinadi (API kalitsiz).
     2. Yomg'ir kodlari (51-67, 80-82, 95-99)  -> yomg'ir
        Qor kodlari (71-77, 85-86)             -> qor
        Qolganlari yoki API xatosi             -> qurilma oyiga qarab fasl
     3. Natija sessionStorage'da 30 daqiqaga keshlanadi.

   Sinov rejimi (ob-havoni kutmasdan istalgan effektni ko'rish):
     ?fx=rain | ?fx=snow | ?fx=petal | ?fx=leaf | ?fx=none
     yoki konsolda: fxPreview('snow')
   Bu rejim API'ga so'rov yubormaydi va keshga yozmaydi.
   ========================================================================== */
(function () {
    'use strict';

    var API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=40.78&longitude=72.34&current_weather=true';
    var CACHE_KEY = 'yerlikoglon:fx-weather:v1';
    var CACHE_TTL = 30 * 60 * 1000;   /* 30 daqiqa */
    var FETCH_TIMEOUT = 7000;

    var PETAL_COLORS = ['#f9c9d8', '#f6b7cc', '#fdeef4', '#f3a9c3'];
    var LEAF_COLORS = ['#d97706', '#b45309', '#ca8a04', '#dc2626', '#ea580c'];
    var MODES = { rain: 1, snow: 1, petal: 1, leaf: 1, none: 1 };

    var canvas = null;
    var ctx = null;
    var parts = [];
    var view = { w: 0, h: 0, dpr: 1, small: false };
    var mode = 'none';
    var raf = 0;
    var last = 0;
    var resizeTimer = 0;
    var manual = false;

    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(list) { return list[(Math.random() * list.length) | 0]; }

    /* ------------------------------------------------------------ ob-havo */

    function seasonMode() {
        var month = new Date().getMonth();
        if (month === 11 || month === 0 || month === 1) return 'snow';
        if (month >= 2 && month <= 4) return 'petal';
        if (month >= 8 && month <= 10) return 'leaf';
        return 'none';
    }

    function modeFromCode(code) {
        if (typeof code !== 'number') return null;
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
            return 'rain';
        }
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
            return 'snow';
        }
        return null;
    }

    function readCache() {
        try {
            var raw = window.sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || typeof data.t !== 'number' || typeof data.mode !== 'string') return null;
            if (Date.now() - data.t > CACHE_TTL) return null;
            return data.mode;
        } catch (e) {
            return null;
        }
    }

    function writeCache(value) {
        try {
            window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), mode: value }));
        } catch (e) { /* sessionStorage yopiq bo'lsa jim o'tkazamiz */ }
    }

    function pickMode(done) {
        var cached = readCache();
        if (cached) { done(cached); return; }

        var finished = false;
        var timer = setTimeout(function () { finish(seasonMode()); }, FETCH_TIMEOUT);

        function finish(value) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            writeCache(value);
            done(value);
        }

        if (!window.fetch) { finish(seasonMode()); return; }

        window.fetch(API_URL, { credentials: 'omit', mode: 'cors' })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                var current = data && (data.current_weather || data.current);
                var code = current ? (typeof current.weathercode === 'number' ? current.weathercode : current.weather_code) : null;
                finish(modeFromCode(code) || seasonMode());
            })
            .catch(function () { finish(seasonMode()); });
    }

    /* ------------------------------------------------------------- canvas */

    function prefersReduced() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function previewMode() {
        var value = null;
        try { value = new URLSearchParams(window.location.search).get('fx'); } catch (e) { return null; }
        return value && MODES[value] ? value : null;
    }

    function ensureCanvas() {
        if (canvas) return true;
        canvas = document.createElement('canvas');
        canvas.className = 'fx-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        ctx = canvas.getContext ? canvas.getContext('2d') : null;
        if (!ctx) { canvas = null; return false; }
        document.body.appendChild(canvas);
        return true;
    }

    function sizeCanvas() {
        view.w = window.innerWidth;
        view.h = window.innerHeight;
        view.small = view.w < 820;
        view.dpr = Math.min(window.devicePixelRatio || 1, view.small ? 1.5 : 2);
        canvas.width = Math.round(view.w * view.dpr);
        canvas.height = Math.round(view.h * view.dpr);
        ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    }

    function particleCount() {
        if (mode === 'rain') return view.small ? 55 : 120;
        if (mode === 'snow') return view.small ? 45 : 95;
        if (mode === 'petal' || mode === 'leaf') return view.small ? 16 : 34;
        return 0;
    }

    function makeParticle(initial) {
        var p = {
            x: rand(0, view.w),
            y: initial ? rand(-view.h * 0.15, view.h) : rand(-60, -12),
            r: 1,
            len: 0,
            vx: 0,
            vy: 0,
            rot: 0,
            vr: 0,
            ph: rand(0, Math.PI * 2),
            sw: rand(0.6, 1.6),
            amp: 0,
            a: 0.6,
            c: '#ffffff'
        };

        if (mode === 'rain') {
            p.len = rand(10, 20);
            p.vx = rand(-22, -6);
            p.vy = rand(420, 700);
            p.a = rand(0.22, 0.45);
        } else if (mode === 'snow') {
            p.r = rand(1.2, 3.2);
            p.vx = rand(-10, 6);
            p.vy = rand(22, 52);
            p.amp = rand(8, 26);
            p.a = rand(0.45, 0.9);
        } else if (mode === 'petal') {
            p.r = rand(3.4, 6.4);
            p.vx = rand(-6, 14);
            p.vy = rand(18, 40);
            p.amp = rand(14, 34);
            p.rot = rand(0, Math.PI * 2);
            p.vr = rand(-1.6, 1.6);
            p.a = rand(0.5, 0.9);
            p.c = pick(PETAL_COLORS);
        } else if (mode === 'leaf') {
            p.r = rand(4.2, 8);
            p.vx = rand(-4, 16);
            p.vy = rand(26, 52);
            p.amp = rand(18, 40);
            p.rot = rand(0, Math.PI * 2);
            p.vr = rand(-2.2, 2.2);
            p.a = rand(0.5, 0.85);
            p.c = pick(LEAF_COLORS);
        }

        return p;
    }

    function buildParticles() {
        var total = particleCount();
        parts = [];
        for (var i = 0; i < total; i++) parts.push(makeParticle(true));
        if (canvas) {
            canvas.dataset.fx = mode;
            canvas.dataset.fxCount = String(parts.length);
        }
    }

    function drawParticle(p, wind, time, dt) {
        var sway = p.amp ? Math.sin((time / 1000) * p.sw + p.ph) * p.amp : 0;

        p.x += (p.vx + wind * 0.4 + sway) * dt;
        p.y += p.vy * dt;
        if (p.vr) p.rot += p.vr * dt;

        ctx.globalAlpha = p.a;

        if (mode === 'rain') {
            ctx.strokeStyle = '#9fb6d8';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 1.6, p.y + p.len);
            ctx.stroke();
        } else if (mode === 'snow') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function step(time) {
        if (!last) last = time;
        var dt = (time - last) / 1000;
        last = time;
        if (dt > 0.05) dt = 0.05;

        var wind = Math.sin(time / 5200) * (view.small ? 10 : 22);

        ctx.clearRect(0, 0, view.w, view.h);

        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            drawParticle(p, wind, time, dt);

            if (p.y > view.h + 40 || p.x < -80 || p.x > view.w + 80) {
                parts[i] = makeParticle(false);
            }
        }

        ctx.globalAlpha = 1;
        raf = window.requestAnimationFrame(step);
    }

    function startLoop() {
        if (raf || !canvas) return;
        sizeCanvas();
        buildParticles();
        last = 0;
        raf = window.requestAnimationFrame(step);
    }

    function stopLoop() {
        if (!raf) return;
        window.cancelAnimationFrame(raf);
        raf = 0;
    }

    function onResize() {
        if (!canvas) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            sizeCanvas();
            buildParticles();
        }, 200);
    }

    function onVisibility() {
        if (document.visibilityState === 'hidden') stopLoop();
        else if (mode !== 'none' && canvas) startLoop();
    }

    /* --------------------------------------------------------------- boot */

    function applyMode(value) {
        if (!MODES[value]) return false;
        if (value === mode && (value === 'none' || canvas)) return true;

        stopLoop();
        mode = value;

        if (value === 'none' || prefersReduced()) {
            if (canvas) {
                canvas.remove();
                canvas = null;
                ctx = null;
                parts = [];
            }
            return true;
        }

        if (!ensureCanvas()) return false;
        startLoop();
        return true;
    }

    function bind() {
        window.addEventListener('resize', onResize, false);
        document.addEventListener('visibilitychange', onVisibility, false);
    }

    function boot() {
        bind();

        var preview = previewMode();
        if (preview) { applyMode(preview); return; }

        pickMode(function (value) { if (!manual) applyMode(value); });
    }

    /* Konsoldan sinash: fxPreview('rain' | 'snow' | 'petal' | 'leaf' | 'none') */
    window.fxPreview = function (value) {
        manual = true;
        return applyMode(value);
    };

    function schedule(fn) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
        else setTimeout(fn, 350);
    }

    function onLoad() {
        if (document.readyState === 'complete') schedule(boot);
        else window.addEventListener('load', function () { schedule(boot); }, false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onLoad, false);
    } else {
        onLoad();
    }
})();
