/* ============================================================================
   visits.js — tashriflar hisoblagichi
   ----------------------------------------------------------------------------
   CounterAPI'ning v1 API'si 2026-yil avgustdan yopilgan (HTTP 410), v2 esa
   API kalit talab qiladi — statik saytda kalitni ochiq saqlab bo'lmaydi.
   Shuning uchun CountAPI uslubidagi bepul va kalitsiz Abacus xizmati:

       https://abacus.jasoncameron.dev/hit/yerlikoglon-uz/visits
       https://abacus.jasoncameron.dev/get/yerlikoglon-uz/visits

   Mantiq:
     1. 24 soat ichida tashrif buyurmagan bo'lsa  -> /hit  (hisob +1)
        Aks holda                                 -> /get  (faqat o'qish)
     2. So'rov `load`dan keyin, brauzer bo'sh vaqtida yuboriladi.
     3. Tarmoq xatosi bo'lsa oxirgi ma'lum raqam localStorage'dan ko'rsatiladi.
   ========================================================================== */
(function () {
    'use strict';

    var API = 'https://abacus.jasoncameron.dev';
    var COUNTER = 'yerlikoglon-uz/visits';
    var VISIT_KEY = 'yerlikoglon:visit:v1';
    var COUNT_KEY = 'yerlikoglon:visits:v1';
    var DAY = 24 * 60 * 60 * 1000;
    var TIMEOUT = 6000;

    /* Faqat jonli saytlar hisoblanadi: lokal fayl va preview deploy raqamni
       sun'iy oshirmaydi. Yangi domen qo'shilsa, shu yerga yozing. */
    var HOSTS = { 'yerlikoglon.uz': 1, 'www.yerlikoglon.uz': 1, 'bocked.github.io': 1 };
    if (!HOSTS[window.location.hostname]) return;

    var box = document.getElementById('visits');
    var out = document.getElementById('visitCount');
    if (!box || !out) return;

    function read(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    }

    function save(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
    }

    function remove(key) {
        try { window.localStorage.removeItem(key); } catch (e) { /* private mode */ }
    }

    function isNewVisit() {
        var last = Number(read(VISIT_KEY));
        return !last || !isFinite(last) || Date.now() - last > DAY;
    }

    function cachedCount() {
        var raw = read(COUNT_KEY);
        var value = raw === null ? NaN : Number(raw);
        return isFinite(value) && value >= 0 ? value : null;
    }

    function format(value) {
        /* 12345 -> "12 345" (o'zbekcha probel bilan guruhlash) */
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function show(value) {
        out.textContent = format(value);
        box.hidden = false;
    }

    function request(url, done) {
        var finished = false;
        var controller = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () {
            if (controller) controller.abort();
            finish(null);
        }, TIMEOUT);

        function finish(value) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            done(value);
        }

        if (!window.fetch) { finish(null); return; }

        window.fetch(url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-store',
            signal: controller ? controller.signal : undefined
        })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                var value = data && (typeof data.value === 'number' ? data.value : data.count);
                finish(typeof value === 'number' && value >= 0 ? value : null);
            })
            .catch(function () { finish(null); });
    }

    function fallback() {
        var cached = cachedCount();
        if (cached !== null) show(cached);
    }

    function run() {
        if (window.navigator && window.navigator.onLine === false) { fallback(); return; }

        var fresh = isNewVisit();
        var stamp = Date.now();

        /* Ko'p tabda bir vaqtda ochilganda ikki marta sanalmasligi uchun
           belgi so'rovdan oldin qo'yiladi; xato bo'lsa qaytariladi. */
        if (fresh) save(VISIT_KEY, String(stamp));

        request(API + (fresh ? '/hit/' : '/get/') + COUNTER, function (value) {
            if (typeof value !== 'number') {
                if (fresh) remove(VISIT_KEY);
                fallback();
                return;
            }

            save(COUNT_KEY, String(value));
            show(value);
        });
    }

    function schedule(fn) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 3000 });
        else setTimeout(fn, 700);
    }

    function start() { schedule(run); }

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, false);
})();
