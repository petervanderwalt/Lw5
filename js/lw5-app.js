(function () {
    'use strict';

    var LW = window.LW = window.LW || {};

    LW.version = '5.0.0-alpha';

    var ui = LW.ui;

    $(function () {
        if (LW.ui && LW.ui.init) {
            LW.ui.init();
        }

        if ('ontouchstart' in window) {
            document.body.classList.add('lw5-touch');
        }

        init2DWorkspace();
        initWorkspaceTabs();
        initToolPalette();
        initStatusBar();
        initTopBar();

        console.log('LaserWeb5 initialized (v' + LW.version + ')');
    });

    // ---- 2D Canvas Workspace -----------------------------------------------

    function init2DWorkspace() {
        var canvas = document.getElementById('lw5-canvas-2d');
        if (!canvas) return;

        LW.draw.init(canvas);

        var container = document.getElementById('lw5-workspace');
        resize2D(container);

        var state = LW.getState();
        if (state) {
            LW.draw.updateWorkspace(state.settings);
            LW.draw.updateDocuments(state.documents);
        }

        window.addEventListener('resize', function () { resize2D(container); });

        LW.on('stateChanged', function (e) {
            var t = e && e.type;
            var st = LW.getState();
            LW.draw.updateWorkspace(st.settings);
            LW.draw.updateDocuments(st.documents);
            updateStatusBar();
            if (t === 'DOCUMENT_ADD' || t === 'DOCUMENT_ADD_MULTIPLE') {
                if (st.documents.length > 0) LW.draw.fitToView();
            }
        });

        // Show toolpath popup when a document is selected on canvas
        LW.draw.onSelectionChange = function (selectedIds) {
            var docs = LW.getState().documents;
            if (selectedIds.length === 1) {
                var doc = docs.filter(function (d) { return d.id === selectedIds[0]; })[0];
                if (doc) {
                    if (window.showToolpathPopup) {
                        window.showToolpathPopup(doc);
                    }
                }
            } else {
                $('#lw5-toolpath-popup').remove();
            }
            if (window.showTransformBar) window.showTransformBar(selectedIds);
        };
    }

    function resize2D(container) {
        var w = container.clientWidth;
        var h = container.clientHeight;
        // Account for workspace tabs height
        var tabsEl = container.querySelector('.lw5-workspace-tabs');
        if (tabsEl) h -= tabsEl.offsetHeight;
        LW.draw.resize(w, h);
    }

    // ---- Workspace Tab Switching -------------------------------------------

    function initWorkspaceTabs() {
        $('.lw5-wtab').on('click', function () {
            var $btn = $(this);
            if ($btn.hasClass('active')) return;

            $('.lw5-wtab').removeClass('active');
            $btn.addClass('active');

            var container = document.getElementById('lw5-workspace');
            resize2D(container);
        });
    }

    // ---- Left Tool Palette -------------------------------------------------

    function initToolPalette() {
        $('#lw5-toolbar .lw5-tool-btn[data-tool]').on('click', function () {
            var mode = $(this).data('tool');
            $('#lw5-toolbar .lw5-tool-btn[data-tool]').removeClass('active');
            $(this).addClass('active');
            LW.draw.setMode(mode);
            $('#status-mode').text('Tool: ' + mode.charAt(0).toUpperCase() + mode.slice(1));
        });

        LW.draw.onModeChange(function (mode) {
            $('#lw5-toolbar .lw5-tool-btn[data-tool]').removeClass('active');
            $('#lw5-toolbar .lw5-tool-btn[data-tool="' + mode + '"]').addClass('active');
            $('#status-mode').text('Tool: ' + mode.charAt(0).toUpperCase() + mode.slice(1));
        });
    }

    // ---- Status Bar --------------------------------------------------------

    function initStatusBar() {
        function toggleSetting(el, key) {
            var val = $(el).prop('checked');
            var ch = {};
            ch[key] = val;
            LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
        }

        $('#toggle-docs').on('change', function () { toggleSetting(this, 'showDocuments'); });
        $('#toggle-gcode').on('change', function () { toggleSetting(this, 'showGcode'); });
        $('#toggle-laser').on('change', function () { toggleSetting(this, 'showLaser'); });
        $('#toggle-machine').on('change', function () { toggleSetting(this, 'showMachine'); });

        LW.on('SETTINGS_UPDATE', function () {
            var s = LW.getSettings();
            $('#toggle-docs').prop('checked', s.showDocuments !== false);
            $('#toggle-gcode').prop('checked', s.showGcode !== false);
            $('#toggle-laser').prop('checked', s.showLaser === true);
            $('#toggle-machine').prop('checked', s.showMachine !== false);
        });
    }

    function updateStatusBar() {
        var state = LW.getState();
        var selected = state.documents.filter(function (d) { return d.selected; });
        if (selected.length === 0) {
            $('#status-selection').text('Nothing selected');
        } else if (selected.length === 1) {
            $('#status-selection').text(selected[0].name);
        } else {
            $('#status-selection').text(selected.length + ' objects selected');
        }
    }

    // ---- Clipboard ---------------------------------------------------------

    var _clipboard = [];

    function copySelected() {
        var docs = LW.getState().documents;
        _clipboard = docs.filter(function (d) { return d.selected; }).map(function (d) {
            var copy = JSON.parse(JSON.stringify(d));
            delete copy.id;
            return copy;
        });
        if (_clipboard.length) ui.showToast('Copied ' + _clipboard.length + ' object(s)', 'info');
        else ui.showToast('Nothing selected', 'warning');
    }

    function cutSelected() {
        copySelected();
        var ids = LW.getState().documents.filter(function (d) { return d.selected; }).map(function (d) { return d.id; });
        ids.forEach(function (id) { LW.dispatch({ type: 'DOCUMENT_REMOVE', payload: id }); });
    }

    function pasteClipboard() {
        if (!_clipboard.length) { ui.showToast('Nothing to paste', 'warning'); return; }
        _clipboard.forEach(function (c) {
            var doc = JSON.parse(JSON.stringify(c));
            doc.id = LW.generateId ? LW.generateId() : Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            if (doc.transform2d) doc.transform2d[4] += 10;
            if (doc.transform2d) doc.transform2d[5] += 10;
            LW.dispatch({ type: 'DOCUMENT_ADD', payload: doc });
        });
        ui.showToast('Pasted ' + _clipboard.length + ' object(s)', 'info');
    }

    // ---- Dropdown Menus ----------------------------------------------------

    function toggleDropdown($btn, $menu) {
        $('.lw5-dropdown').not($menu).hide();
        $menu.toggle();
        if ($menu.is(':visible')) {
            $(document).one('click', function (e) {
                if (!$btn[0].contains(e.target) && !$menu[0].contains(e.target)) {
                    $menu.hide();
                }
            });
        }
    }

    function showPreferences() {
        var $modal = $(
            '<div class="lw5-modal-overlay">' +
            '<div class="lw5-modal" style="min-width:500px;max-height:80vh">' +
            '<div class="lw5-modal-header"><span><i class="fas fa-cogs"></i> Preferences</span><span class="lw5-modal-close">&times;</span></div>' +
            '<div class="lw5-modal-body" id="settings-modal-body" style="padding:12px"></div>' +
            '</div></div>'
        ).appendTo('body');
        ui.renderSettingsInto($modal.find('#settings-modal-body'));
        $modal.find('.lw5-modal-close').on('click', function () { $modal.remove(); });
        $modal.on('click', function (e) { if (e.target === this) $modal.remove(); });
        $(document).on('keydown.settings', function (e) {
            if (e.key === 'Escape') { $modal.remove(); $(document).off('keydown.settings'); }
        });
    }

    // ---- Top Bar -----------------------------------------------------------

    function initTopBar() {
        // File menu
        var $fileBtn = $('#tb-file');
        var $fileMenu = $('#tb-file-menu');
        $fileBtn.on('click', function (e) { e.stopPropagation(); toggleDropdown($fileBtn, $fileMenu); });

        $fileMenu.find('[data-action="open"]').on('click', function () {
            $fileMenu.hide();
            document.getElementById('file-input').click();
        });
        $fileMenu.find('[data-action="clear"]').on('click', function () {
            $fileMenu.hide();
            LW.dispatch({ type: 'CLEAR_DESIGN' });
            ui.showToast('Design cleared', 'info');
        });
        $fileMenu.find('[data-action="export-json"]').on('click', function () {
            $fileMenu.hide();
            var data = JSON.stringify({ documents: LW.getState().documents }, null, 2);
            var blob = new Blob([data], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'laserweb5-design.json';
            a.click();
            URL.revokeObjectURL(a.href);
            ui.showToast('Design exported', 'success');
        });
        $fileMenu.find('[data-action="import-json"]').on('click', function () {
            $fileMenu.hide();
            document.getElementById('json-file-input').click();
        });

        // Edit menu
        var $editBtn = $('#tb-edit');
        var $editMenu = $('#tb-edit-menu');
        $editBtn.on('click', function (e) { e.stopPropagation(); toggleDropdown($editBtn, $editMenu); });

        $editMenu.find('[data-action="cut"]').on('click', function () { $editMenu.hide(); cutSelected(); });
        $editMenu.find('[data-action="copy"]').on('click', function () { $editMenu.hide(); copySelected(); });
        $editMenu.find('[data-action="paste"]').on('click', function () { $editMenu.hide(); pasteClipboard(); });
        $editMenu.find('[data-action="delete"]').on('click', function () {
            $editMenu.hide();
            var ids = LW.getState().documents.filter(function (d) { return d.selected; }).map(function (d) { return d.id; });
            ids.forEach(function (id) { LW.dispatch({ type: 'DOCUMENT_REMOVE', payload: id }); });
        });
        $editMenu.find('[data-action="preferences"]').on('click', function () { $editMenu.hide(); showPreferences(); });
        $editMenu.find('[data-action="materials"]').on('click', function () { $editMenu.hide(); showMaterialEditor(); });

        // Undo / Redo
        $('#tb-undo').on('click', function () { LW.dispatch({ type: 'UNDO' }); });
        $('#tb-redo').on('click', function () { LW.dispatch({ type: 'REDO' }); });

        // JSON file input
        $('#json-file-input').on('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            this.value = '';
            var reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    var data = JSON.parse(ev.target.result);
                    if (data.documents && Array.isArray(data.documents)) {
                        data.documents.forEach(function (doc) {
                            LW.dispatch({ type: 'DOCUMENT_ADD', payload: doc });
                        });
                        ui.showToast('Imported ' + data.documents.length + ' object(s)', 'success');
                    } else {
                        ui.showToast('Invalid design file', 'error');
                    }
                } catch (err) {
                    ui.showToast('Error parsing JSON: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        });

        // About
        $('#tb-about').on('click', function () {
            var content =
                '<div class="lw5-about">' +
                '<h2>LaserWeb5</h2>' +
                '<p class="lw5-version">Version 5.0.0-alpha</p>' +
                '<p>Open-source <strong>CAM application</strong> for laser cutters, engravers, and CNC machines.</p>' +
                '<p>Based on <a href="https://github.com/LaserWeb/LaserWeb4" target="_blank">LaserWeb4</a>.</p>' +
                '<hr />' +
                '<p id="release-info">Loading release info…</p>' +
                '</div>';

            var $modal = $(
                '<div class="lw5-modal-overlay">' +
                '<div class="lw5-modal" style="min-width:350px">' +
                '<div class="lw5-modal-header"><span>About LaserWeb5</span><span class="lw5-modal-close">&times;</span></div>' +
                '<div class="lw5-modal-body">' + content + '</div>' +
                '</div></div>'
            ).appendTo('body');

            $modal.find('.lw5-modal-close').on('click', function () { $modal.remove(); });
            $modal.on('click', function (e) { if (e.target === this) $modal.remove(); });

            if (typeof marked !== 'undefined' && window.marked) {
                var $ri = $modal.find('#release-info');
                if ($ri.length) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', 'data/RELEASE.md', true);
                    xhr.onload = function () {
                        if (xhr.status === 200) $ri.html(marked.parse(xhr.responseText));
                    };
                    xhr.send();
                }
            }

            $(document).on('keydown.about', function (e) {
                if (e.key === 'Escape') { $modal.remove(); $(document).off('keydown.about'); }
            });
        });

        // Keyboard shortcuts
        $(document).on('keydown', function (e) {
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); LW.dispatch({ type: 'UNDO' }); }
            if (e.ctrlKey && e.key === 'z' && e.shiftKey) { e.preventDefault(); LW.dispatch({ type: 'REDO' }); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); LW.dispatch({ type: 'REDO' }); }
            if (e.ctrlKey && e.key === 'c') { e.preventDefault(); copySelected(); }
            if (e.ctrlKey && e.key === 'x') { e.preventDefault(); cutSelected(); }
            if (e.ctrlKey && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
        });
    }

    // ---- Properties (now handled via floating toolpath popup) --------------

    LW.app = {};

})();
