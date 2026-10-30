/* ============================================================================
   app.js — interfeys mantig'i
   ========================================================================== */
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };

    var SAMPLE = 'O\u02BBzbekiston Respublikasida shahar va qishloqlar, choy va shakar, ' +
        'tong va oqshom, bog\u02BB va g\u02BBalaba — bularning barchasi shoshilinch ' +
        'chora-tadbirlarni talab qiladi.';

    var state = { mode: 'lotin', ng: true, keepLinks: true };
    var results = [];
    var pending = 0;
    var toastTimer = null;

    /* ---------------------------------------------------------------- matn */
    function refresh() {
        var src = $('src');
        var dst = $('dst');
        var out = AlifboCore.convertTextSafe(src.value, state.mode, {
            ng: state.ng,
            keepLinks: state.keepLinks
        });

        dst.value = out;

        var words = src.value.trim() ? src.value.trim().split(/\s+/).length : 0;
        var changed = out !== src.value;

        $('stats').innerHTML =
            '<b>' + out.length + '</b> belgi · <b>' + words + '</b> so\u02BBz · ' +
            (changed
                ? '<span style="color:#0f9d58;font-weight:600">o\u02BBgirildi</span>'
                : 'o\u02BBzgarish yo\u02BBq');

        $('outHint').textContent = state.mode === 'orqaga' ? 'eski lotin' : 'yangi alifbo';
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
        toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
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
        fsub.textContent = humanSize(size) + ' · o\u02BBgirilmoqda…';

        meta.appendChild(fname);
        meta.appendChild(fsub);

        var spin = document.createElement('div');
        spin.className = 'spin';

        row.appendChild(ico);
        row.appendChild(meta);
        row.appendChild(spin);

        $('fileList').appendChild(row);
        return { row: row, fsub: fsub, spin: spin, fname: fname };
    }

    function markDone(ref, blob, outName, info) {
        if (ref.spin.parentNode) ref.spin.parentNode.removeChild(ref.spin);
        ref.fsub.className = 'fsub ok';
        ref.fsub.textContent = outName + ' · ' + humanSize(blob.size) + ' · ' + info;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.textContent = '\u2B07 Yuklab olish';
        btn.addEventListener('click', function () {
            download(blob, outName);
            toast('Yuklab olinmoqda: ' + outName);
        });
        ref.row.appendChild(btn);
    }

    function markError(ref, message) {
        if (ref.spin.parentNode) ref.spin.parentNode.removeChild(ref.spin);
        ref.row.classList.add('err');
        ref.fsub.className = 'fsub bad';
        ref.fsub.textContent = message;
    }

    /* ------------------------------------------------------ faylni o'girish */
    function addFile(file) {
        var ref = createRow(file.name, file.size);

        return Convert.convertBlob(file, { mode: state.mode, ng: state.ng })
            .then(function (res) {
                var outName = Convert.outputName(file.name, state.mode);
                var info = res.changedParts + ' qism o\u02BBzgartirildi';
                if (res.changedParts === 0) info = 'o\u02BBzgarish topilmadi';

                results.push({ blob: res.blob, outName: outName });
                markDone(ref, res.blob, outName, info);
            })
            .catch(function (err) {
                markError(ref, err && err.message ? err.message : 'Noma\u02BClum xatolik');
            })
            .then(function () {
                $('fileActions').hidden = results.length === 0;
            });
    }

    function addFiles(list) {
        var files = Array.prototype.slice.call(list || []);
        if (files.length === 0) return;

        pending += files.length;
        var chain = Promise.resolve();
        files.forEach(function (f) {
            chain = chain.then(function () { return addFile(f); });
        });
        chain.then(function () {
            pending -= files.length;
            if (results.length) toast('Tayyor: ' + results.length + ' ta fayl');
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

        $('optNg').addEventListener('change', function () {
            state.ng = this.checked;
            refresh();
        });

        $('optLinks').addEventListener('change', function () {
            state.keepLinks = this.checked;
            refresh();
        });

        $('copyBtn').addEventListener('click', function () {
            var text = $('dst').value;
            if (!text) { toast('Nusxa olish uchun matn yo\u02BBq'); return; }

            function done() { toast('Nusxa olindi'); }
            function fallback() {
                $('dst').select();
                try { document.execCommand('copy'); done(); }
                catch (e) { toast('Nusxa olib bo\u02BBlmadi'); }
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
            toast('Natija manbaga ko\u02BBchirildi');
        });

        $('clearBtn').addEventListener('click', function () {
            $('src').value = '';
            refresh();
            $('src').focus();
        });

        $('sampleBtn').addEventListener('click', function () {
            $('src').value = SAMPLE;
            refresh();
        });

        /* --- tablar --- */
        var tabs = document.querySelectorAll('.tabs button');
        Array.prototype.forEach.call(tabs, function (t) {
            t.addEventListener('click', function () {
                Array.prototype.forEach.call(tabs, function (x) {
                    x.classList.toggle('active', x === t);
                });
                Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
                    v.classList.toggle('active', v.id === 'view-' + t.getAttribute('data-view'));
                });
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
            results = [];
            $('fileList').innerHTML = '';
            $('fileActions').hidden = true;
        });

        $('zipBtn').addEventListener('click', function () {
            if (!results.length) return;

            var btn = this;
            btn.disabled = true;
            btn.textContent = 'Paketlanmoqda…';

            (async function () {
                try {
                    var used = {};
                    var entries = [];
                    for (var i = 0; i < results.length; i++) {
                        var r = results[i];
                        var nm = r.outName;
                        if (used[nm]) {
                            var dot = nm.lastIndexOf('.');
                            nm = (dot > 0 ? nm.slice(0, dot) : nm) + '_' + (i + 1) + (dot > 0 ? nm.slice(dot) : '');
                        }
                        used[nm] = true;

                        var ab = await r.blob.arrayBuffer();
                        entries.push({ name: nm, _data: new Uint8Array(ab), extAttr: 0 });
                    }
                    var buf = await ZipLite.zipWrite(entries);
                    download(new Blob([buf], { type: 'application/zip' }), 'yangi-alifbo-fayllar.zip');
                    toast('Arxiv tayyor');
                } catch (e) {
                    toast('Arxivlab bo\u02BBlmadi: ' + (e && e.message ? e.message : e));
                } finally {
                    btn.disabled = false;
                    btn.textContent = '\u2B07 Hammasini yuklab olish (.zip)';
                }
            })();
        });

        /* brauzer faylni yangi oynada ochib yubormasin */
        window.addEventListener('dragover', function (e) { e.preventDefault(); });
        window.addEventListener('drop', function (e) { e.preventDefault(); });

        refresh();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
