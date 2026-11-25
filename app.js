/* ============================================================================
   app.js — interfeys mantig'i
   ========================================================================== */
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var t = function (key, vars) {
        return window.I18N ? window.I18N.t(key, vars) : key;
    };
    var alpha = function (to) { return t('alpha.' + to); };
    var ZIP_NAME = {
        yangi: 'yangi-alifbo-fayllar.zip',
        eski: 'eski-lotin-fayllar.zip',
        kirill: 'kirill-alifbo-fayllar.zip'
    };
    var TARGETS = ['kirill', 'eski', 'yangi'];

    var state = { mode: 'lotin', keepLinks: true };
    var fileItems = [];
    var pending = 0;
    var zipTarget = 'yangi';
    var menuSeq = 0;
    var toastTimer = null;

    /* ---------------------------------------------------------------- matn */
    function refresh() {
        var src = $('src');
        var dst = $('dst');
        var out = AlifboCore.convertTextSafe(src.value, state.mode, {
            keepLinks: state.keepLinks
        });

        dst.value = out;

        var words = src.value.trim() ? src.value.trim().split(/\s+/).length : 0;
        var changed = out !== src.value;

        $('stats').innerHTML =
            '<b>' + out.length + '</b> ' + t('unit.char') + ' · <b>' + words + '</b> ' + t('unit.word') + ' · ' +
            (changed
                ? '<span class="ok">' + t('status.changed') + '</span>'
                : t('status.same'));

        $('srcCount').textContent = src.value.length + ' ' + t('unit.char');

        $('outHint').textContent = state.mode === 'orqaga' ? t('out.eski') : t('out.yangi');
    }

    var debounce = null;
    function scheduleRefresh() {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(refresh, 50);
    }

    /* --------------------------------------------------------------- toast */
    function toast(msg) {
        var t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
    }

    /* ------------------------------------------------------------ yuklash */
    function download(blob, name) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            URL.revokeObjectURL(url);
            if (a.parentNode) a.parentNode.removeChild(a);
        }, 2000);
    }

    function humanSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }

    function extLabel(name) {
        var m = /\.([a-z0-9]+)$/i.exec(name);
        return m ? m[1].toUpperCase() : 'FILE';
    }

    var DOWN_ICON = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 18v.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V18"/></svg>';
    var CARET_ICON = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

    /* --------------------------------------------------- menyu (disclosure) */
    function menuTriggers(menu) {
        return Array.prototype.slice.call(
            document.querySelectorAll('[aria-controls="' + menu.id + '"]')
        );
    }

    function setMenu(menu, trigger, open) {
        menu.hidden = !open;
        menuTriggers(menu).forEach(function (t) {
            t.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        if (open) {
            menu._opener = trigger;
            var first = menu.querySelector('button');
            if (first) first.focus();
        }
    }

    function toggleMenu(menu, trigger, e) {
        if (e) e.stopPropagation();
        var open = menu.hidden;
        closeAllMenus();
        setMenu(menu, trigger, open);
    }

    function closeAllMenus() {
        Array.prototype.forEach.call(document.querySelectorAll('.dl-menu'), function (menu) {
            if (menu.hidden) return;
            var triggers = menuTriggers(menu);
            var opener = menu._opener && triggers.indexOf(menu._opener) !== -1
                ? menu._opener
                : triggers[0];
            var hadFocus = menu.contains(document.activeElement);
            menu.hidden = true;
            triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
            if (hadFocus && opener) opener.focus();
        });
    }

    function markCurrent(menu, to) {
        Array.prototype.forEach.call(menu.querySelectorAll('button[data-to]'), function (b) {
            if (b.getAttribute('data-to') === to) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
        });
    }

    /* ---------------------------------------------------------- fayl qatori */
    function createRow(name, size) {
        var row = document.createElement('div');
        row.className = 'file';

        var ico = document.createElement('div');
        ico.className = 'fico';
        ico.textContent = extLabel(name);

        var meta = document.createElement('div');
        meta.className = 'fmeta';

        var fname = document.createElement('div');
        fname.className = 'fname';
        fname.textContent = name;

        var fsub = document.createElement('div');
        fsub.className = 'fsub';
        fsub.textContent = humanSize(size) + ' · ' + t('file.converting');

        var fdet = document.createElement('div');
        fdet.className = 'fdet';
        fdet.textContent = t('file.detecting');

        meta.appendChild(fname);
        meta.appendChild(fsub);
        meta.appendChild(fdet);

        var spin = document.createElement('div');
        spin.className = 'spin';

        row.appendChild(ico);
        row.appendChild(meta);
        row.appendChild(spin);

        $('fileList').appendChild(row);
        return { row: row, fsub: fsub, fdet: fdet, spin: spin, fname: fname };
    }

    function detectionText(item) {
        var text = t('file.detected', { alpha: alpha(item.from) });
        if (item.guess) text += t('file.guess');
        return text;
    }

    function renderRow(item, variant) {
        if (item.ref.spin.parentNode) item.ref.spin.parentNode.removeChild(item.ref.spin);
        item.ref.row.classList.remove('err');
        item.ref.fsub.className = 'fsub ok';
        var info = variant.parts ? t('file.parts', { n: variant.parts }) : t('file.noChange');
        item.ref.fsub.textContent =
            variant.outName + ' · ' + humanSize(variant.blob.size) + ' · ' + info;
        item.ref.fdet.textContent = detectionText(item);
        item.shownVariant = variant;
    }

    function markError(ref, message) {
        if (ref.spin.parentNode) ref.spin.parentNode.removeChild(ref.spin);
        ref.row.classList.add('err');
        ref.fsub.className = 'fsub bad';
        ref.fsub.textContent = message;
        ref.fdet.textContent = t('file.notDetected');
    }

    /* ------------------------------------------- variantlar (kerak paytda) */
    function prepareVariant(item, to) {
        if (item.variants[to]) return Promise.resolve(item.variants[to]);
        if (item.pending[to]) return item.pending[to];

        var p = Convert.convertBlob(item.file, { to: to })
            .then(function (res) {
                if (!item.from && res.detected) {
                    item.from = res.from;
                    item.guess = !res.detected.confident;
                    item.detected = res.detected;
                }
                var variant = {
                    blob: res.blob,
                    outName: Convert.outputName(item.name, { to: res.to }),
                    parts: res.changedParts,
                    from: res.from,
                    detected: res.detected,
                    mode: res.mode
                };
                item.variants[to] = variant;
                delete item.pending[to];
                return variant;
            })
            .catch(function (e) {
                delete item.pending[to];
                throw e;
            });

        item.pending[to] = p;
        return p;
    }

    /* -------------------------------------------- har fayl uchun tugmalar */
    function addDownloadButtons(item) {
        if (item.dl) return;

        var group = document.createElement('div');
        group.className = 'dl-group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', t('dl.group'));

        var menuId = 'fileMenu' + (++menuSeq);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn sm';
        btn.innerHTML = DOWN_ICON + ' ' + t('dl.btn');
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', menuId);
        btn.addEventListener('click', function (e) { toggleMenu(menu, btn, e); });

        var caret = document.createElement('button');
        caret.type = 'button';
        caret.className = 'btn sm caret';
        caret.setAttribute('aria-haspopup', 'true');
        caret.setAttribute('aria-expanded', 'false');
        caret.setAttribute('aria-controls', menuId);
        caret.setAttribute('aria-label', t('dl.caret'));
        caret.innerHTML = CARET_ICON;

        var menu = document.createElement('div');
        menu.className = 'dl-menu';
        menu.id = menuId;
        menu.setAttribute('role', 'group');
        menu.setAttribute('aria-label', t('dl.menu'));
        menu.hidden = true;

        var options = {};
        TARGETS.forEach(function (to) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = t('alphaOption.' + to);
            b.setAttribute('data-to', to);
            b.addEventListener('click', function () {
                closeAllMenus();
                item.chosen = to;
                markCurrent(menu, to);
                downloadChosen(item);
            });
            options[to] = b;
            menu.appendChild(b);
        });

        caret.addEventListener('click', function (e) { toggleMenu(menu, caret, e); });

        group.appendChild(btn);
        group.appendChild(caret);
        group.appendChild(menu);
        item.ref.row.appendChild(group);

        item.dl = { group: group, btn: btn, caret: caret, menu: menu, options: options };
        markCurrent(menu, item.chosen);
    }

    function downloadChosen(item) {
        if (!item.dl) return;
        var btn = item.dl.btn;
        btn.disabled = true;

        prepareVariant(item, item.chosen)
            .then(function (v) {
                renderRow(item, v);
                download(v.blob, v.outName);
                toast(t('toast.download', { name: v.outName }));
            })
            .catch(function (e) {
                toast(t('toast.fail', { msg: e && e.message ? e.message : e }));
            })
            .then(function () { btn.disabled = false; });
    }

    /* --------------------------------------------------------- fayl qo'shish */
    function goodItems() {
        return fileItems.filter(function (item) { return !item.error; });
    }

    function setBusy() {
        var busy = pending > 0;
        $('zipBtn').disabled = busy;
        $('zipMenuBtn').disabled = busy;
    }

    function updateFileFoot() {
        var n = goodItems().length;
        $('fileActions').hidden = n === 0;
        $('zipLabel').textContent = n
            ? t('zip.count', { n: n })
            : t('zip.default');
    }

    /* Til o'zgarganda allaqachon yaratilgan matnlar ham yangilanadi. */
    function applyLanguage() {
        refresh();
        updateFileFoot();

        fileItems.forEach(function (item) {
            if (item.shownVariant) {
                renderRow(item, item.shownVariant);
            } else if (item.error) {
                item.ref.fdet.textContent = t('file.notDetected');
            } else {
                item.ref.fsub.textContent = humanSize(item.size) + ' · ' + t('file.converting');
                item.ref.fdet.textContent = t('file.detecting');
            }
            if (!item.dl) return;
            item.dl.group.setAttribute('aria-label', t('dl.group'));
            item.dl.btn.innerHTML = DOWN_ICON + ' ' + t('dl.btn');
            item.dl.caret.setAttribute('aria-label', t('dl.caret'));
            item.dl.menu.setAttribute('aria-label', t('dl.menu'));
            TARGETS.forEach(function (to) {
                item.dl.options[to].textContent = t('alphaOption.' + to);
            });
        });

        $('zipGroup').setAttribute('aria-label', t('zip.group'));
        $('zipMenuBtn').setAttribute('aria-label', t('zip.aria'));
        $('zipMenu').setAttribute('aria-label', t('zip.menuAria'));
        Array.prototype.forEach.call($('zipMenu').querySelectorAll('button[data-to]'), function (b) {
            b.textContent = t('alphaOption.' + b.getAttribute('data-to'));
        });
    }

    /* Yo'nalish faqat matn uchun: Fayl ko'rinishida yoki fayl yuklanganida
       uni ko'rinishdan faolsizlantiramiz (aria + disabled + CSS). */
    function syncSetupState() {
        var active = document.querySelector('.tabs button.active');
        var view = active ? active.getAttribute('data-view') : 'matn';
        var muted = view === 'fayl' || fileItems.length > 0;
        var setup = document.querySelector('.setup');

        setup.classList.toggle('is-muted', muted);
        Array.prototype.forEach.call(setup.querySelectorAll('button, input'), function (el) {
            el.disabled = muted;
            if (muted) el.setAttribute('aria-disabled', 'true');
            else el.removeAttribute('aria-disabled');
        });
    }

    function addFile(file) {
        var item = {
            file: file,
            name: file.name,
            size: file.size,
            ref: createRow(file.name, file.size),
            variants: {},
            pending: {},
            chosen: 'yangi',
            from: null,
            guess: false,
            detected: null,
            error: null,
            dl: null
        };
        fileItems.push(item);
        syncSetupState();

        pending++;
        setBusy();

        return prepareVariant(item, 'yangi')
            .then(function (v) {
                item.from = v.from;
                item.guess = !v.detected.confident;
                item.detected = v.detected;
                renderRow(item, v);
                addDownloadButtons(item);
            })
            .catch(function (e) {
                item.error = e && e.message ? e.message : t('file.unknown');
                markError(item.ref, item.error);
            })
            .then(function () {
                pending--;
                setBusy();
                updateFileFoot();
            });
    }

    function addFiles(list) {
        var all = Array.prototype.slice.call(list || []);
        if (!all.length) return;

        var files = [];
        var skipped = 0;
        all.forEach(function (f) {
            if (/\.(docx|xlsx)$/i.test(f.name)) files.push(f);
            else skipped++;
        });
        if (skipped) toast(t('file.skipped', { n: skipped }));
        if (!files.length) return;

        var done = 0;
        files.forEach(function (f) {
            addFile(f).then(function () {
                done++;
                if (done === files.length && goodItems().length) {
                    toast(t('file.ready', { n: goodItems().length }));
                }
            });
        });
    }

    /* -------------------------------------------------------------- ZIP */
    function zipNow(to) {
        var items = goodItems();
        if (!items.length) return;

        closeAllMenus();
        zipTarget = to;
        markCurrent($('zipMenu'), to);

        var btn = $('zipBtn');
        var caret = $('zipMenuBtn');
        var label = $('zipLabel');
        btn.disabled = true;
        caret.disabled = true;
        label.textContent = t('zip.packing');

        var chain = Promise.resolve();
        var variants = [];
        items.forEach(function (item) {
            chain = chain.then(function () {
                return prepareVariant(item, to).then(function (v) { variants.push(v); });
            });
        });

        chain
            .then(async function () {
                var used = {};
                var entries = [];
                for (var i = 0; i < variants.length; i++) {
                    var nm = variants[i].outName;
                    if (used[nm]) {
                        var dot = nm.lastIndexOf('.');
                        nm = (dot > 0 ? nm.slice(0, dot) : nm) + '_' + (i + 1) + (dot > 0 ? nm.slice(dot) : '');
                    }
                    used[nm] = true;

                    var ab = await variants[i].blob.arrayBuffer();
                    entries.push({ name: nm, _data: new Uint8Array(ab), extAttr: 0 });
                }
                var buf = await ZipLite.zipWrite(entries);
                download(new Blob([buf], { type: 'application/zip' }), ZIP_NAME[to]);
                toast(t('toast.zipReady', { name: alpha(to) }));
            })
            .catch(function (e) {
                toast(t('toast.zipFail', { msg: e && e.message ? e.message : e }));
            })
            .then(function () {
                btn.disabled = false;
                caret.disabled = false;
                updateFileFoot();
            });
    }

    /* --------------------------------------------------------------- init */
    function init() {
        /* --- matn --- */
        $('src').addEventListener('input', scheduleRefresh);

        $('modeSeg').addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-mode]');
            if (!btn) return;
            state.mode = btn.getAttribute('data-mode');
            Array.prototype.forEach.call(this.querySelectorAll('button'), function (b) {
                b.classList.toggle('active', b === btn);
            });
            refresh();
        });

        $('optLinks').addEventListener('change', function () {
            state.keepLinks = this.checked;
            refresh();
        });

        $('copyBtn').addEventListener('click', function () {
            var text = $('dst').value;
            if (!text) { toast(t('toast.copyEmpty')); return; }

            function done() { toast(t('toast.copied')); }
            function fallback() {
                $('dst').select();
                try { document.execCommand('copy'); done(); }
                catch (e) { toast(t('toast.copyFail')); }
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(fallback);
            } else {
                fallback();
            }
        });

        $('swapBtn').addEventListener('click', function () {
            var out = $('dst').value;
            if (!out) return;
            $('src').value = out;
            refresh();
            toast(t('toast.swapped'));
        });

        $('clearBtn').addEventListener('click', function () {
            $('src').value = '';
            refresh();
            $('src').focus();
        });

        /* --- tablar --- */
        var tabs = document.querySelectorAll('.tabs button');
        Array.prototype.forEach.call(tabs, function (t) {
            t.addEventListener('click', function () {
                Array.prototype.forEach.call(tabs, function (x) {
                    x.classList.toggle('active', x === t);
                    x.setAttribute('aria-selected', x === t ? 'true' : 'false');
                });
                Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
                    v.classList.toggle('active', v.id === 'view-' + t.getAttribute('data-view'));
                });
                syncSetupState();
                closeAllMenus();
            });
        });

        /* --- fayllar --- */
        var drop = $('drop');
        var input = $('fileInput');

        ['dragenter', 'dragover'].forEach(function (ev) {
            drop.addEventListener(ev, function (e) {
                e.preventDefault();
                e.stopPropagation();
                drop.classList.add('over');
            });
        });

        ['dragleave', 'dragend'].forEach(function (ev) {
            drop.addEventListener(ev, function () {
                drop.classList.remove('over');
            });
        });

        drop.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            drop.classList.remove('over');
            addFiles(e.dataTransfer.files);
        });

        input.addEventListener('change', function () {
            addFiles(input.files);
            input.value = '';
        });

        $('clearFiles').addEventListener('click', function () {
            closeAllMenus();
            fileItems = [];
            $('fileList').innerHTML = '';
            updateFileFoot();
            syncSetupState();
        });

        $('zipBtn').addEventListener('click', function (e) {
            toggleMenu($('zipMenu'), this, e);
        });

        $('zipMenuBtn').addEventListener('click', function (e) {
            toggleMenu($('zipMenu'), this, e);
        });

        $('zipMenu').addEventListener('click', function (e) {
            var b = e.target.closest('button[data-to]');
            if (!b) return;
            zipNow(b.getAttribute('data-to'));
        });

        /* --- til tanlash (header) --- */
        $('langBtn').addEventListener('click', function (e) {
            toggleMenu($('langMenu'), this, e);
        });
        $('langMenu').addEventListener('click', function (e) {
            var b = e.target.closest('button[data-lang]');
            if (!b) return;
            window.I18N.set(b.getAttribute('data-lang'));
            closeAllMenus();
        });
        document.addEventListener('i18n:change', applyLanguage);

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dl-group, .lang')) closeAllMenus();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeAllMenus();
        });

        /* brauzer faylni yangi oynada ochib yubormasin */
        window.addEventListener('dragover', function (e) { e.preventDefault(); });
        window.addEventListener('drop', function (e) { e.preventDefault(); });

        markCurrent($('zipMenu'), zipTarget);
        updateFileFoot();
        syncSetupState();
        refresh();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
