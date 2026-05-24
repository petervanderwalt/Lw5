(function () {
    'use strict';

    var LW = window.LW = window.LW || {};
    var ui = LW.ui;

    var PRINT_DIALOG_HTML = '\
<div class="lw5-modal-overlay" id="lw5-dialog-overlay">\
  <div class="lw5-dialog">\
    <div class="lw5-dialog-header">\
      <i class="fas fa-print lw5-dialog-icon"></i>\
      <div class="lw5-dialog-header-text">\
        <span class="lw5-dialog-title">Print</span>\
        <span class="lw5-dialog-subtitle" id="lw5-dialog-doc-count">1 object</span>\
      </div>\
    </div>\
    <div class="lw5-dialog-body">\
      <div class="lw5-dialog-settings">\
        <!-- Printer -->\
        <div class="lw5-dialog-section">\
          <div class="lw5-dialog-section-title">Printer</div>\
          <div class="lw5-dialog-row">\
            <label>Machine</label>\
            <select id="lw5-dialog-machine-sel"></select>\
            <button class="lw5-btn lw5-btn-xs" id="lw5-dialog-machine-props" title="Machine Settings"><i class="fas fa-cog"></i></button>\
          </div>\
          <div class="lw5-dialog-row">\
            <label></label>\
            <span class="lw5-dialog-machine-info" id="lw5-dialog-machine-info">No machine selected</span>\
          </div>\
        </div>\
        <!-- Copies & Overrides -->\
        <div class="lw5-dialog-section">\
          <div class="lw5-dialog-section-title">Job</div>\
          <div class="lw5-dialog-row">\
            <label>Copies</label>\
            <input type="number" id="lw5-dialog-copies" value="1" min="1" max="999" class="lw5-dialog-num" />\
          </div>\
          <div class="lw5-dialog-row">\
            <label>Power</label>\
            <input type="range" id="lw5-dialog-power" min="1" max="100" value="100" class="lw5-dialog-range" />\
            <span class="lw5-dialog-range-val" id="lw5-dialog-power-val">100%</span>\
          </div>\
          <div class="lw5-dialog-row">\
            <label>Speed</label>\
            <input type="range" id="lw5-dialog-speed" min="10" max="100" value="100" class="lw5-dialog-range" />\
            <span class="lw5-dialog-range-val" id="lw5-dialog-speed-val">100%</span>\
          </div>\
        </div>\
        <!-- Output -->\
        <div class="lw5-dialog-section">\
          <div class="lw5-dialog-section-title">Output</div>\
          <div class="lw5-dialog-row">\
            <label>Send to</label>\
            <select id="lw5-dialog-output">\
              <option value="file">Save to File</option>\
              <option value="http">HTTP Endpoint</option>\
              <option value="serial">Serial Port</option>\
              <option value="clipboard">Copy to Clipboard</option>\
            </select>\
          </div>\
          <div class="lw5-dialog-row lw5-dialog-row-endpoint" style="display:none">\
            <label>URL</label>\
            <input type="text" id="lw5-dialog-endpoint-url" class="lw5-dialog-text" />\
          </div>\
        </div>\
        <!-- Advanced -->\
        <div class="lw5-dialog-section">\
          <div class="lw5-dialog-section-title">Options</div>\
          <div class="lw5-dialog-row">\
            <label></label>\
            <label class="lw5-dialog-check"><input type="checkbox" id="lw5-dialog-show-toolpath" checked /> Show toolpath preview in canvas</label>\
          </div>\
        </div>\
      </div>\
      <div class="lw5-dialog-preview">\
        <div class="lw5-dialog-preview-header">Preview</div>\
        <div class="lw5-dialog-preview-canvas" id="lw5-dialog-preview-area">\
          <canvas id="lw5-dialog-preview-canvas"></canvas>\
        </div>\
        <div class="lw5-dialog-preview-status" id="lw5-dialog-preview-status">Ready</div>\
      </div>\
    </div>\
    <div class="lw5-dialog-footer">\
      <div class="lw5-dialog-footer-left">\
        <span id="lw5-dialog-job-details"></span>\
      </div>\
      <div class="lw5-dialog-footer-right">\
        <button class="lw5-btn lw5-btn-primary lw5-btn-lg" id="lw5-dialog-btn-print"><i class="fas fa-print"></i> Print</button>\
        <button class="lw5-btn lw5-btn-lg" id="lw5-dialog-btn-cancel">Cancel</button>\
      </div>\
    </div>\
  </div>\
</div>';

    var dialog = null;

    function openPrintDialog() {
        var state = LW.getState();
        var docs = (state.documents || []).filter(function (d) { return d.visible !== false && d.selected; });
        if (!docs.length) {
            docs = (state.documents || []).filter(function (d) { return d.visible !== false; });
        }
        if (!docs.length) {
            ui.showToast('No documents to print', 'warning');
            return;
        }

        var $overlay = $(PRINT_DIALOG_HTML).appendTo('body');
        dialog = { $overlay: $overlay, docs: docs };
        console.log('Print dialog opened: ' + docs.length + ' doc(s), types:', docs.map(function (d) { var tp = d.toolpath; return (tp && tp.type) || 'no-toolpath'; }));

        populateMachineSelect();
        updateMachineInfo();
        updateJobDetails(docs);
        renderPreview(docs);

        // Bind events
        $overlay.find('#lw5-dialog-machine-sel').on('change', function () {
            LW.profiles.currentMachineId = $(this).val();
            LW.profiles.save();
            updateMachineInfo();
            updateOutputOptions();
        });

        $overlay.find('#lw5-dialog-copies').on('change', updateJobDetails);
        $overlay.find('#lw5-dialog-power').on('input', function () {
            $overlay.find('#lw5-dialog-power-val').text($(this).val() + '%');
        });
        $overlay.find('#lw5-dialog-speed').on('input', function () {
            $overlay.find('#lw5-dialog-speed-val').text($(this).val() + '%');
        });

        $overlay.find('#lw5-dialog-output').on('change', function () {
            var val = $(this).val();
            $overlay.find('.lw5-dialog-row-endpoint').toggle(val === 'http');
        });

        $overlay.find('#lw5-dialog-machine-props').on('click', function () {
            ui.showToast('Machine settings - coming soon', 'info');
        });

        $overlay.find('#lw5-dialog-btn-print').on('click', doPrint);
        $overlay.find('#lw5-dialog-btn-cancel').on('click', closePrintDialog);
        $overlay.on('click', function (e) {
            if (e.target === this) closePrintDialog();
        });

        $(document).on('keydown.print', function (e) {
            if (e.key === 'Escape') { closePrintDialog(); }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { doPrint(); }
        });
    }

    function closePrintDialog() {
        if (dialog) {
            dialog.$overlay.remove();
            dialog = null;
        }
        $(document).off('keydown.print');
    }


    function populateMachineSelect() {
        var $sel = dialog.$overlay.find('#lw5-dialog-machine-sel');
        $sel.empty();
        LW.profiles.machines.forEach(function (m) {
            $sel.append('<option value="' + m.id + '"' + (m.id === LW.profiles.currentMachineId ? ' selected' : '') + '>' + escHtml(m.name) + '</option>');
        });
    }

    function updateMachineInfo() {
        var m = LW.profiles.getCurrentMachine();
        var info = dialog.$overlay.find('#lw5-dialog-machine-info');
        if (m) {
            info.text('Work area: ' + m.workArea.x + 'x' + m.workArea.y + 'mm | ' + m.gcodeFlavor.toUpperCase() + ' | ' + m.protocol);
        } else {
            info.text('No machine selected');
        }
        updateOutputOptions();
    }

    function updateOutputOptions() {
        var m = LW.profiles.getCurrentMachine();
        var $sel = dialog.$overlay.find('#lw5-dialog-output');
        if (!m) return;
        $sel.find('option[value="http"]').toggle(m.protocol === 'http');
        $sel.find('option[value="serial"]').toggle(m.protocol === 'serial');
        if (m.protocol === 'http') {
            $sel.val('http');
            dialog.$overlay.find('#lw5-dialog-endpoint-url').val(m.endpoint || 'http://laser.local');
            dialog.$overlay.find('.lw5-dialog-row-endpoint').show();
        } else if (m.protocol === 'serial') {
            $sel.val('serial');
            dialog.$overlay.find('.lw5-dialog-row-endpoint').hide();
        } else {
            $sel.val('file');
            dialog.$overlay.find('.lw5-dialog-row-endpoint').hide();
        }
    }

    function updateJobDetails(docs) {
        if (!docs) docs = dialog ? dialog.docs : [];
        var copies = parseInt(dialog.$overlay.find('#lw5-dialog-copies').val()) || 1;
        var detail = docs.length + ' object' + (docs.length !== 1 ? 's' : '');
        var hasRaster = docs.some(function (d) { return d.type === 'image'; });
        var hasVector = docs.some(function (d) { return d.type === 'svg' || d.rawPaths; });
        if (hasRaster && hasVector) detail += ' (raster + vector)';
        else if (hasRaster) detail += ' (raster)';
        else if (hasVector) detail += ' (vector)';
        if (copies > 1) detail += ' x ' + copies + ' copies';
        dialog.$overlay.find('#lw5-dialog-doc-count').text(detail);
        dialog.$overlay.find('#lw5-dialog-job-details').text(detail);
    }

    function renderPreview(docs) {
        var $canvas = dialog.$overlay.find('#lw5-dialog-preview-canvas');
        var $area = dialog.$overlay.find('#lw5-dialog-preview-area');
        var canvas = $canvas[0];
        if (!canvas) return;

        var rect = $area[0].getBoundingClientRect();
        var pw = Math.min(rect.width - 4, 450);
        var ph = Math.min(rect.height - 4, 350);
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width = pw + 'px';
        canvas.style.height = ph + 'px';

        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, pw, ph);

        if (!docs || !docs.length) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No objects to preview', pw / 2, ph / 2);
            return;
        }

        // Calculate bounds of visible content
        var bounds = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        docs.forEach(function (doc) {
            var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];
            if (doc.rawBounds) {
                var b = doc.rawBounds;
                var corners = [
                    { x: b.x1, y: b.y1 }, { x: b.x2, y: b.y1 },
                    { x: b.x2, y: b.y2 }, { x: b.x1, y: b.y2 }
                ];
                corners.forEach(function (c) {
                    var tx = tf[0] * c.x + tf[2] * c.y + tf[4];
                    var ty = tf[1] * c.x + tf[3] * c.y + tf[5];
                    if (tx < bounds.x1) bounds.x1 = tx;
                    if (ty < bounds.y1) bounds.y1 = ty;
                    if (tx > bounds.x2) bounds.x2 = tx;
                    if (ty > bounds.y2) bounds.y2 = ty;
                });
            } else if (doc.width && doc.height) {
                bounds.x1 = Math.min(bounds.x1, tf[4]);
                bounds.y1 = Math.min(bounds.y1, tf[5]);
                bounds.x2 = Math.max(bounds.x2, tf[4] + doc.width * tf[0]);
                bounds.y2 = Math.max(bounds.y2, tf[5] + doc.height * tf[3]);
            }
        });

        if (!isFinite(bounds.x1)) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Preview not available', pw / 2, ph / 2);
            return;
        }

        var bw = bounds.x2 - bounds.x1 || 1;
        var bh = bounds.y2 - bounds.y1 || 1;
        var margin = 20;
        var scale = Math.min((pw - margin * 2) / bw, (ph - margin * 2) / bh);
        var ox = (pw - bw * scale) / 2 - bounds.x1 * scale;
        var oy = (ph - bh * scale) / 2 + bounds.y2 * scale;

        // Draw machine bed outline
        var m = LW.profiles.getCurrentMachine();
        if (m) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(
                ox, oy - m.workArea.y * scale,
                m.workArea.x * scale, m.workArea.y * scale
            );
            ctx.setLineDash([]);
        }

        // Draw each document (simplified preview)
        docs.forEach(function (doc) {
            ctx.save();
            var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];
            ctx.transform(tf[0] * scale, -tf[1] * scale, -tf[2] * scale, tf[3] * scale, ox + tf[4] * scale, oy - tf[5] * scale);

            if (doc.type === 'image' && doc.image) {
                try { ctx.drawImage(doc.image, 0, 0); } catch (e) { /* cross-origin */ }
            } else if (doc.rawPaths) {
                ctx.strokeStyle = '#4c9aff';
                ctx.lineWidth = 1;
                doc.rawPaths.forEach(function (path) {
                    ctx.beginPath();
                    for (var i = 0; i < path.length; i += 2) {
                        if (i === 0) ctx.moveTo(path[i], path[i + 1]);
                        else ctx.lineTo(path[i], path[i + 1]);
                    }
                    ctx.stroke();
                });
            }
            ctx.restore();
        });

        dialog.$overlay.find('#lw5-dialog-preview-status').text(docs.length + ' object(s)');
    }

    // ---- Print Action ------------------------------------------------------

    function doPrint() {
        if (!dialog) return;

        try {
            var machine = LW.profiles.getCurrentMachine();
            var copies = parseInt(dialog.$overlay.find('#lw5-dialog-copies').val()) || 1;
            var powerOverride = parseInt(dialog.$overlay.find('#lw5-dialog-power').val()) || 100;
            var speedOverride = parseInt(dialog.$overlay.find('#lw5-dialog-speed').val()) || 100;
            var outputMode = dialog.$overlay.find('#lw5-dialog-output').val();
            var endpointUrl = dialog.$overlay.find('#lw5-dialog-endpoint-url').val();

            var docs = dialog.docs;
            if (!docs.length) {
                closePrintDialog();
                ui.showToast('Nothing to print', 'warning');
                return;
            }

            // Close dialog immediately so user sees feedback
            closePrintDialog();

            // Group docs by toolpath type then serialise each toolpath to an operation
            function getOpKey(d) {
                var tp = d.toolpath || { type: 'none', power: 0, speed: 0, passes: 0 };
                return tp.type + '|' + tp.power + '|' + tp.speed + '|' + (tp.margin || 0) + '|' + (tp.trimLine ? 1 : 0) + '|' + (tp.toolDiameter || '') + '|' + (tp.passDepth || '') + '|' + (tp.cutWidth || 0) + '|' + (tp.stepOver || 10) + '|' + (tp.direction || '') + '|' + (tp.lineDistance || 0.1) + '|' + (tp.lineAngle || 0) + '|' + (tp.laserPowerRange || 100) + '|' + (tp.toolSpeed || 0) + '|' + (tp.dpi || 0) + '|' + (tp.diagonal ? 1 : 0) + '|' + (tp.overScan || 0) + '|' + (tp.invertColor ? 1 : 0) + '|' + (tp.smoothing ? 1 : 0) + '|' + (tp.grayscale ? 1 : 0);
            }
            function toolpathToOperation(d) {
                var tp = d.toolpath || LW.defaultToolpath('none');
                var t = tp.type;
                var opType;
                if (t === 'raster' || t === 'raster_merge') {
                    opType = t === 'raster_merge' ? 'Laser Raster Merge' : 'Laser Raster';
                } else if (t === 'pocket' || t === 'laser_fill') {
                    opType = 'Laser Fill Path';
                } else if (t.indexOf('mill_') === 0) {
                    var millMap = { mill_pocket: 'Mill Pocket', mill_cut: 'Mill Cut', mill_cut_inside: 'Mill Cut Inside', mill_cut_outside: 'Mill Cut Outside', mill_vcarve: 'Mill V Carve' };
                    opType = millMap[t] || 'Mill Cut';
                } else if (t === 'cut_outside' || t === 'laser_cut_outside') {
                    opType = 'Laser Cut Outside';
                } else if (t === 'cut_inside' || t === 'laser_cut_inside') {
                    opType = 'Laser Cut Inside';
                } else {
                    opType = 'Laser Cut';
                }
                var isMill = t.indexOf('mill_') === 0;
                var isRaster = t === 'raster' || t === 'raster_merge';
                var op = {
                    id: '__print_' + d.id + '__',
                    type: opType,
                    name: d.name || 'Print job',
                    documents: [d.id],
                    enabled: true,
                    expanded: false,
                    laserPower: tp.power,
                    cutRate: tp.speed,
                    passes: tp.passes || 1,
                    laserDiameter: tp.laserDiameter || tp.margin || 0.1,
                    trimLine: tp.trimLine ? 1 : 0,
                    segmentLength: tp.segmentLength || 0.5,
                    joinPixel: 1,
                    burnWhite: false,
                    passDepth: 1,
                    useBlower: false,
                    useA: false,
                    aAxisDiameter: 0,
                    tabDocuments: [],
                    startHeight: 0,
                    smoothing: !!tp.smoothing,
                    brightness: tp.brightness || 0,
                    contrast: tp.contrast || 0,
                    gamma: tp.gamma || 1,
                    grayscale: tp.grayscale ? 'luma' : 'none',
                    shadesOfGray: tp.shadesOfGray || 64,
                    invertColor: !!tp.invertColor,
                    dithering: tp.dithering === 'none' ? false : tp.dithering,
                    diagonal: !!tp.diagonal,
                    overScan: tp.overScan || 0,
                    verboseGcode: !!tp.verboseGcode,
                    dpi: tp.dpi || 0,
                    hookOperationStart: '',
                    hookOperationEnd: '',
                    hookPassStart: '',
                    hookPassEnd: '',
                    cutWidth: tp.cutWidth || 0,
                    stepOver: tp.stepOver === undefined ? 10 : tp.stepOver,
                    margin: tp.margin || 0,
                    // Per-type fields
                    lineDistance: tp.lineDistance || 0.1,
                    lineAngle: tp.lineAngle || 0,
                    laserPowerRange: tp.laserPowerRange || 100,
                    direction: tp.direction || (isMill ? 'Conventional' : isRaster ? 'top_to_bottom' : 'Climb')
                };  
                // Add mill-specific fields
                if (isMill) {
                    op.toolDiameter = tp.toolDiameter || 3;
                    op.plungeRate = tp.plungeRate || 300;
                    op.passDepth = tp.passDepth || 1;
                    op.millRapidZ = tp.millRapidZ || 10;
                    op.millStartZ = tp.millStartZ || 0;
                    op.millEndZ = tp.millEndZ || -1;
                    op.toolAngle = tp.toolAngle || 90;
                    op.ramp = tp.ramp || false;
                    op.toolSpeed = tp.toolSpeed || 0;
                }
                return op;
            }

            // Group by key, merge doc ids for ops sharing identical config
            var groups = {};
            docs.forEach(function (d) {
                var tp = d.toolpath;
                if (tp && tp.type === 'none') return;
                var key = getOpKey(d);
                if (!groups[key]) {
                    var op = toolpathToOperation(d);
                    op.documents = [d.id];
                    groups[key] = op;
                } else {
                    groups[key].documents.push(d.id);
                }
            });
            var ops = Object.keys(groups).map(function (k) { return groups[k]; });

            console.log('Print: docs=' + docs.length + ' skipped=' + (docs.length - Object.keys(groups).length) + ' ops=' + ops.length);
            if (ops.length > 0) console.log('  first op:', JSON.stringify(ops[0]));

            if (ops.length === 0) {
                console.warn('No printable ops. Doc toolpaths:', docs.map(function (d) { var tp = d.toolpath; return { id: d.id, type: (tp && tp.type) || 'missing' }; }));
                ui.showToast('No printable objects', 'warning');
                return;
            }
            ui.showToast('Generating ' + ops.length + ' operation(s)...', 'info');

            var settings = LW.getState().settings;
            if (copies > 1) {
                var expanded = [];
                for (var ci = 0; ci < copies; ci++) {
                    ops.forEach(function (op) {
                        var copy = JSON.parse(JSON.stringify(op));
                        copy.id = op.id + '_copy' + ci;
                        expanded.push(copy);
                    });
                }
                ops = expanded;
            }
            if (powerOverride !== 100) {
                ops.forEach(function (op) { op.laserPower = Math.round(op.laserPower * powerOverride / 100); });
            }
            if (speedOverride !== 100) {
                ops.forEach(function (op) { op.cutRate = Math.round(op.cutRate * speedOverride / 100); });
            }

            var origOps = LW.getState().operations;
            LW.dispatch({ type: 'LOAD_STATE', payload: { operations: ops } });
            ui.generateGcode(function (gcode) {
                LW.dispatch({ type: 'LOAD_STATE', payload: { operations: origOps } });
                routeOutput(gcode, outputMode, endpointUrl, machine);
            });
        } catch (err) {
            closePrintDialog();
            ui.showToast('Print failed: ' + err.message, 'error');
            console.error('Print error:', err);
        }
    }

    function routeOutput(gcode, mode, endpointUrl, machine) {
        switch (mode) {
            case 'file':
                downloadGcode(gcode);
                break;
            case 'http':
                sendHTTP(gcode, endpointUrl || (machine ? machine.endpoint : null));
                break;
            case 'serial':
                ui.showToast('Serial output - coming soon', 'info');
                downloadGcode(gcode);
                break;
            case 'clipboard':
                copyToClipboard(gcode);
                break;
        }
    }

    function downloadGcode(gcode) {
        var blob = new Blob([gcode], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'lw5-dialog-job.gcode';
        a.click();
        URL.revokeObjectURL(url);
    }

    function sendHTTP(gcode, url) {
        if (!url) {
            ui.showToast('No endpoint URL configured', 'warning');
            downloadGcode(gcode);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url + '/upload', true);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.onload = function () {
            if (xhr.status === 200) {
                ui.showToast('G-code sent to machine', 'success');
            } else {
                ui.showToast('HTTP send failed: ' + xhr.status, 'danger');
            }
        };
        xhr.onerror = function () {
            ui.showToast('HTTP send failed: could not reach ' + url, 'danger');
        };
        xhr.send(gcode);
    }

    function copyToClipboard(gcode) {
        navigator.clipboard.writeText(gcode).then(function () {
            ui.showToast('G-code copied to clipboard', 'success');
        }).catch(function () {
            ui.showToast('Clipboard copy failed', 'danger');
        });
    }

    function escHtml(str) {
        if (typeof str !== 'string') return String(str);
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- Public API ---------------------------------------------------------

    LW.printDialog = {
        open: openPrintDialog,
        close: closePrintDialog
    };

})();
