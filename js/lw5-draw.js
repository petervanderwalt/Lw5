(function () {
    'use strict';

    var LW = window.LW = window.LW || {};
    var draw = LW.draw = LW.draw || {};

    var canvas, ctx;
    var animFrameId = null;

    // View transform
    var view = { ox: 0, oy: 0, zoom: 1 };

    // State
    var documents = [];
    var settings = {};
    var machineBounds = { x: 0, y: 0, w: 400, h: 400, show: true };

    // GCode overlay cache
    var gcodeOverlayVisible = true;
    var gcodeCache = { version: 0, rapids: null, bands: {} };
    var BAND_COLORS = ['#0044ff','#0088ff','#00bbff','#00ddcc','#00ee66','#44dd00','#aadd00','#ffbb00','#ff6600','#ff2200'];

    // Interaction
    var MODES = { SELECT: 'select', MOVE: 'move', RESIZE: 'resize', ROTATE: 'rotate', TAB: 'tab' };
    var currentMode = MODES.SELECT;
    var drawModeChangeCb = null;
    var selectedIds = [];
    var hoveredId = null;
    var isDragging = false;
    var dragState = null; // { mode:'pan'|'move'|'handle', startMouse, startView, startTransforms, ... }

    // Handle definitions (relative to bounds)
    var HANDLE_SIZE = 8;
    var HANDLE_NAMES = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br', 'rot'];

    // ---- Init ---------------------------------------------------------------

    draw.init = function (c) {
        if (canvas) return;
        canvas = c;
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        view.ox = 0;
        view.oy = 0;
        view.zoom = 1;

        setupInteraction();
        animFrameId = requestAnimationFrame(render);
    };

    draw.resize = function (w, h) {
        if (!canvas) return;
        canvas.width = w;
        canvas.height = h;
    };

    // ---- Camera compat (stub for old code) ----------------------------------

    draw.setCamera = function (cam) {
        // Not needed for 2D canvas, but kept for compat
    };

    draw.getCameraState = function () {
        // Return something approximating camera for status bar
        return {
            eye: [view.ox, view.oy, 500 / view.zoom],
            center: [0, 0, 0],
            up: [0, 1, 0]
        };
    };

    // ---- Public API ---------------------------------------------------------

    function setCanvasCursorClass(cls) {
        var cursorClasses = ['grabbable', 'grabbing', 'crosshair', 'move', 'default', 'copy'];
        for (var ci = 0; ci < cursorClasses.length; ci++)
            canvas.classList.remove(cursorClasses[ci]);
        canvas.classList.add(cls);
    }

    draw.setMode = function (mode) {
        if (!MODES[mode.toUpperCase()]) return;
        currentMode = mode;
        setCanvasCursorClass(getCursorClass());
        if (drawModeChangeCb) drawModeChangeCb(mode);
    };

    draw.getMode = function () { return currentMode; };

    draw.onModeChange = function (cb) { drawModeChangeCb = cb; };

    draw.updateDocuments = function (docs) {
        documents = docs || [];
    };

    draw.fitToView = function () {
        var allBounds = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        var found = false;
        for (var fi = 0; fi < documents.length; fi++) {
            var d = documents[fi];
            if (d.visible === false) continue;
            var b = getDocBounds(d);
            if (b) {
                found = true;
                allBounds.x1 = Math.min(allBounds.x1, b.x1);
                allBounds.y1 = Math.min(allBounds.y1, b.y1);
                allBounds.x2 = Math.max(allBounds.x2, b.x2);
                allBounds.y2 = Math.max(allBounds.y2, b.y2);
            }
        }
        if (!found || !canvas) return;
        var pad = 20;
        var bw = allBounds.x2 - allBounds.x1 + pad * 2;
        var bh = allBounds.y2 - allBounds.y1 + pad * 2;
        var cw = canvas.width, ch = canvas.height;
        if (bw <= 0 || bh <= 0) return;
        var zoom = Math.min(cw / bw, ch / bh);
        if (zoom <= 0) return;
        view.zoom = zoom;
        view.ox = -(allBounds.x1 + allBounds.x2) / 2;
        view.oy = -(allBounds.y1 + allBounds.y2) / 2;
    };

    draw.updateGcode = function (segments) {
        if (!segments) { gcodeCache.rapids = null; gcodeCache.bands = {}; return; }
        gcodeCache.version++;
        gcodeCache.rapids = null;
        gcodeCache.bands = {};
        if (segments.rapids && segments.rapids.length >= 4) {
            var r = segments.rapids;
            gcodeCache.rapids = new Path2D();
            for (var ri = 0; ri < r.length; ri += 4) {
                gcodeCache.rapids.moveTo(r[ri], r[ri + 1]);
                gcodeCache.rapids.lineTo(r[ri + 2], r[ri + 3]);
            }
        }
        if (segments.cuts && segments.cuts.length >= 5) {
            var c = segments.cuts;
            for (var ci = 0; ci < c.length; ci += 5) {
                var s = c[ci + 4];
                var band = s >= 900 ? 9 : Math.floor(s / 100);
                if (band < 0) band = 0;
                if (!gcodeCache.bands[band]) gcodeCache.bands[band] = new Path2D();
                gcodeCache.bands[band].moveTo(c[ci], c[ci + 1]);
                gcodeCache.bands[band].lineTo(c[ci + 2], c[ci + 3]);
            }
        }
    };

    draw.setGcodeOverlayVisible = function (v) { gcodeOverlayVisible = v; };
    draw.isGcodeOverlayVisible = function () { return gcodeOverlayVisible; };

    draw.updateWorkspace = function (s) {
        settings = s || {};
        machineBounds.show = s.showMachine !== false;
        machineBounds.x = s.machineBottomLeftX || 0;
        machineBounds.y = s.machineBottomLeftY || 0;
        machineBounds.w = s.machineWidth || 400;
        machineBounds.h = s.machineHeight || 400;
    };

    draw.getPickedData = function () { return null; };

    // ---- Coordinate helpers -------------------------------------------------

    function worldToCanvas(wx, wy) {
        var w = canvas.width, h = canvas.height;
        return [(wx + view.ox) * view.zoom + w / 2, (wy + view.oy) * view.zoom + h / 2];
    }

    function canvasToWorld(cx, cy) {
        var w = canvas.width, h = canvas.height;
        return [(cx - w / 2) / view.zoom - view.ox, (cy - h / 2) / view.zoom - view.oy];
    }

    // ---- Cursor helper -----------------------------------------------------

    function getCursorClass() {
        switch (currentMode) {
            case MODES.SELECT: return 'crosshair';
            case MODES.MOVE: return 'move';
            case MODES.RESIZE: return 'default';
            case MODES.ROTATE: return 'grabbable';
            case MODES.TAB: return 'copy';
            default: return 'default';
        }
    }

    // ---- Render -------------------------------------------------------------

    function render() {
        if (!canvas || !ctx) return;
        var w = canvas.width, h = canvas.height;
        if (w < 2 || h < 2) { animFrameId = requestAnimationFrame(render); return; }

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(view.zoom, view.zoom);
        ctx.translate(view.ox, view.oy);

        drawGrid();
        if (machineBounds.show) drawMachineBounds();
        drawDocuments();
        if (gcodeOverlayVisible && (gcodeCache.rapids || Object.keys(gcodeCache.bands).length)) drawGcodeOverlay();

        ctx.restore();

        // UI overlays (screen-space)
        drawRulers(w, h);
        drawSelectionBox(w, h);
        drawHandles(w, h);
        drawLegend(w, h);

        animFrameId = requestAnimationFrame(render);
    }

    // ---- Grid ---------------------------------------------------------------

    function drawGrid() {
        var w = canvas.width, h = canvas.height;
        var minX = -view.ox - w / 2 / view.zoom - 10;
        var maxX = -view.ox + w / 2 / view.zoom + 10;
        var minY = -view.oy - h / 2 / view.zoom - 10;
        var maxY = -view.oy + h / 2 / view.zoom + 10;

        var minor = (settings.toolGridMinorSpacing || 10) * view.zoom;
        var major = (settings.toolGridMajorSpacing || 50) * view.zoom;

        // Adaptive grid: skip minor if too dense
        var skipMinor = minor < 4;

        ctx.strokeStyle = '#d4d4d4';
        ctx.lineWidth = 1 / view.zoom;

        if (!skipMinor) {
            var snapMinor = settings.toolGridMinorSpacing || 10;
            var roundedMinX = Math.floor(minX / snapMinor) * snapMinor;
            for (var x = roundedMinX; x < maxX; x += snapMinor) {
                ctx.beginPath();
                ctx.moveTo(x, minY);
                ctx.lineTo(x, maxY);
                ctx.stroke();
            }
            var roundedMinY = Math.floor(minY / snapMinor) * snapMinor;
            for (var y = roundedMinY; y < maxY; y += snapMinor) {
                ctx.beginPath();
                ctx.moveTo(minX, y);
                ctx.lineTo(maxX, y);
                ctx.stroke();
            }
        }

        ctx.strokeStyle = '#b8b8b8';
        var snapMajor = settings.toolGridMajorSpacing || 50;
        for (var mx = Math.floor(minX / snapMajor) * snapMajor; mx <= maxX; mx += snapMajor) {
            ctx.beginPath();
            ctx.moveTo(mx, minY);
            ctx.lineTo(mx, maxY);
            ctx.stroke();
        }
        for (var my = Math.floor(minY / snapMajor) * snapMajor; my <= maxY; my += snapMajor) {
            ctx.beginPath();
            ctx.moveTo(minX, my);
            ctx.lineTo(maxX, my);
            ctx.stroke();
        }

        // Origin axes
        ctx.strokeStyle = 'rgba(255,60,60,0.5)';
        ctx.lineWidth = 2 / view.zoom;
        ctx.beginPath();
        ctx.moveTo(0, minY);
        ctx.lineTo(0, maxY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(60,255,60,0.5)';
        ctx.beginPath();
        ctx.moveTo(minX, 0);
        ctx.lineTo(maxX, 0);
        ctx.stroke();
    }

    // ---- Machine Bounds -----------------------------------------------------

    function drawMachineBounds() {
        var x = machineBounds.x, y = machineBounds.y;
        var w = machineBounds.w, h = machineBounds.h;
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5 / view.zoom;
        ctx.strokeRect(x, y, w, h);

        // Corner L-brackets (brighter)
        var m = 10 / view.zoom;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2 / view.zoom;
        var corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        var dirs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
        for (var ci = 0; ci < 4; ci++) {
            var p = corners[ci], dx = dirs[ci][0], dy = dirs[ci][1];
            ctx.beginPath();
            ctx.moveTo(p[0] + dx * m, p[1]);
            ctx.lineTo(p[0], p[1]);
            ctx.lineTo(p[0], p[1] + dy * m);
            ctx.stroke();
        }

        // Dimension label in bottom-right corner
        var label = Math.round(w) + ' × ' + Math.round(h) + ' mm';
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.font = Math.max(10, 12 / view.zoom) + 'px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x + w - 4 / view.zoom, y + h - 4 / view.zoom);
    }

    // ---- Rulers -------------------------------------------------------------

    function drawRulers(w, h) {
        var margin = 25;
        var majorSpacing = settings.toolGridMajorSpacing || 50;
        var minorSpacing = settings.toolGridMinorSpacing || 10;
        var textColor = 'rgba(0,0,0,0.55)';
        var tickColor = 'rgba(0,0,0,0.25)';
        var minorTickColor = 'rgba(0,0,0,0.12)';
        var bgColor = 'rgba(240,240,240,0.92)';
        var fontSize = 10;

        // Skip minor ticks if they'd be too dense
        var minorSpacingPx = minorSpacing * view.zoom;
        var skipMinor = minorSpacingPx < 4;
        // Skip labels if major ticks would overlap
        var majorSpacingPx = majorSpacing * view.zoom;
        var skipLabels = majorSpacingPx < 30;

        // Background strips
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, margin);
        ctx.fillRect(0, 0, margin, h);
        ctx.fillRect(0, 0, margin, margin);

        // Top ruler: show X coordinates
        var topWorldY = canvasToWorld(0, margin)[1];
        var leftWorldX = canvasToWorld(margin, 0)[0];
        var rightWorldX = canvasToWorld(w, margin)[0];
        ctx.font = fontSize + 'px monospace';
        ctx.textBaseline = 'top';

        // Major ticks (top)
        var firstMajor = Math.ceil(leftWorldX / majorSpacing) * majorSpacing;
        ctx.strokeStyle = tickColor;
        ctx.fillStyle = textColor;
        for (var tx = firstMajor; tx <= rightWorldX; tx += majorSpacing) {
            var sx = worldToCanvas(tx, topWorldY)[0];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx, margin);
            ctx.lineTo(sx, margin - 8);
            ctx.stroke();
            if (!skipLabels) {
                ctx.textAlign = 'center';
                ctx.fillText(Math.round(tx), sx, 2);
            }
        }

        // Minor ticks (top)
        if (!skipMinor) {
            ctx.strokeStyle = minorTickColor;
            var firstMinor = Math.ceil(leftWorldX / minorSpacing) * minorSpacing;
            for (var t2 = firstMinor; t2 <= rightWorldX; t2 += minorSpacing) {
                if (Math.abs(t2 % majorSpacing) < 0.001) continue;
                var sx2 = worldToCanvas(t2, topWorldY)[0];
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx2, margin);
                ctx.lineTo(sx2, margin - 4);
                ctx.stroke();
            }
        }

        // Left ruler: show Y coordinates
        var bottomWorldY = canvasToWorld(margin, h)[1];
        var topRulerWorldY = canvasToWorld(margin, margin)[1];
        var yStart = Math.min(topRulerWorldY, bottomWorldY);
        var yEnd = Math.max(topRulerWorldY, bottomWorldY);
        ctx.textBaseline = 'middle';

        // Major ticks (left)
        var firstMajorY = Math.ceil(yStart / majorSpacing) * majorSpacing;
        ctx.strokeStyle = tickColor;
        ctx.fillStyle = textColor;
        for (var ty = firstMajorY; ty <= yEnd; ty += majorSpacing) {
            var sy = worldToCanvas(leftWorldX, ty)[1];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(margin, sy);
            ctx.lineTo(margin - 8, sy);
            ctx.stroke();
            if (!skipLabels) {
                ctx.textAlign = 'right';
                ctx.fillText(Math.round(ty), margin - 10, sy);
            }
        }

        // Minor ticks (left)
        if (!skipMinor) {
            ctx.strokeStyle = minorTickColor;
            var firstMinorY = Math.ceil(yStart / minorSpacing) * minorSpacing;
            for (var t3 = firstMinorY; t3 <= yEnd; t3 += minorSpacing) {
                if (Math.abs(t3 % majorSpacing) < 0.001) continue;
                var sy2 = worldToCanvas(leftWorldX, t3)[1];
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(margin, sy2);
                ctx.lineTo(margin - 4, sy2);
                ctx.stroke();
            }
        }
    }

    // ---- Document rendering -------------------------------------------------

    function drawDocuments() {
        if (settings.showDocuments === false) return;
        for (var i = 0; i < documents.length; i++) {
            var doc = documents[i];
            if (doc.visible === false) continue;
            drawDocument(doc);
        }
    }

    function drawDocument(doc) {
        var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];
        var isSel = selectedIds.indexOf(doc.id) >= 0;
        var isHov = hoveredId === doc.id;

        // Resolve toolpath display color
        function getToolpathColor(d) {
            var tp = d.toolpath;
            if (!tp || !tp.type) return '#999';
            switch (tp.type) {
                case 'cut_on_line':
                case 'laser_cut':
                    return '#e81123';
                case 'cut_outside':
                case 'laser_cut_outside':
                    return '#0078d4';
                case 'cut_inside':
                case 'laser_cut_inside':
                    return '#ffb900';
                case 'pocket':
                case 'laser_fill':
                    return '#107c10';
                case 'mill_pocket':
                    return '#8b4513';
                case 'mill_cut':
                case 'mill_cut_inside':
                case 'mill_cut_outside':
                    return '#d2691e';
                case 'mill_vcarve':
                    return '#a0522d';
                case 'raster':
                    return '#881798';
                case 'raster_merge':
                    return '#cc33cc';
                case 'none':
                    return d.strokeColor || '#999';
                default:
                    return '#666666';
            }
        }

        ctx.save();
        ctx.transform(tf[0], tf[1], tf[2], tf[3], tf[4], tf[5]);

        if (doc.rawPaths) {
            var tpColor = getToolpathColor(doc);
            ctx.strokeStyle = isSel ? '#4c9aff' : isHov ? '#6db8ff' : tpColor;
            var sw = (doc.strokeWidth || 1);
            var minPx = 1;
            var minWorld = minPx / view.zoom;
            ctx.lineWidth = Math.max(isSel ? 3 : sw, minWorld);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (var pi = 0; pi < doc.rawPaths.length; pi++) {
                var path = doc.rawPaths[pi];
                if (!path || path.length < 2) continue;
                ctx.beginPath();
                ctx.moveTo(path[0], path[1]);
                for (var j = 2; j < path.length; j += 2) {
                    ctx.lineTo(path[j], path[j + 1]);
                }
                ctx.stroke();
            }

            // Fill
            if (doc.fillColor && doc.fillColor[3] > 0) {
                ctx.fillStyle = 'rgba(' + (doc.fillColor[0] * 255) + ',' + (doc.fillColor[1] * 255) + ',' + (doc.fillColor[2] * 255) + ',' + doc.fillColor[3] + ')';
                for (var fi = 0; fi < doc.rawPaths.length; fi++) {
                    var fp = doc.rawPaths[fi];
                    if (!fp || fp.length < 4) continue;
                    ctx.beginPath();
                    ctx.moveTo(fp[0], fp[1]);
                    for (var fj = 2; fj < fp.length; fj += 2) {
                        ctx.lineTo(fp[fj], fp[fj + 1]);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
        } else if (doc.type === 'image' && doc.dataURL) {
            var useDataURL = doc._filteredDataURL || doc.dataURL;
            var imgCache = doc._filterCheck !== useDataURL ? null : doc._cachedImage;
            if (!imgCache) doc._filterCheck = useDataURL;
            var img = imgCache;
            if (!img && !doc._loadingImage) {
                doc._loadingImage = true;
                img = new Image();
                img.onload = function () {
                    doc._cachedImage = img;
                    doc._imgW = img.naturalWidth;
                    doc._imgH = img.naturalHeight;
                    doc._loadingImage = false;
                    doc._filterCheck = useDataURL;
                };
                img.onerror = function () { doc._loadingImage = false; };
                img.src = useDataURL;
            }
            var imgW = doc._imgW || (doc.originalPixels ? doc.originalPixels[0] : (img && img.width ? img.width : 0));
            var imgH = doc._imgH || (doc.originalPixels ? doc.originalPixels[1] : (img && img.height ? img.height : 0));

            if (imgW > 0 && imgH > 0 && img && img.width > 0 && img.height > 0) {
                var sx = tf[0], sy = tf[3];
                ctx.globalAlpha = 0.9;
                ctx.drawImage(img, 0, 0, imgW * Math.abs(sx), imgH * Math.abs(sy));
                ctx.globalAlpha = 1;

                // Border matching drawn image size
                ctx.strokeStyle = isSel ? '#4c9aff' : getToolpathColor(doc);
                ctx.lineWidth = isSel ? 2 : 1;
                ctx.strokeRect(0, 0, imgW * Math.abs(sx), imgH * Math.abs(sy));
            }
        }

        // Draw tabs (bridges)
        var tp = doc.toolpath;
        if (tp && tp.tabs && tp.tabs.length) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = tp.tabs[0].width || 3;
            for (var ti = 0; ti < tp.tabs.length; ti++) {
                var tab = tp.tabs[ti];
                ctx.beginPath();
                ctx.arc(tab.x, tab.y, (tab.width || 3) / 2, 0, Math.PI * 2);
                ctx.stroke();
                // Crosshair
                ctx.strokeStyle = '#ff6666';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(tab.x - 4, tab.y);
                ctx.lineTo(tab.x + 4, tab.y);
                ctx.moveTo(tab.x, tab.y - 4);
                ctx.lineTo(tab.x, tab.y + 4);
                ctx.stroke();
                ctx.strokeStyle = '#ff0000';
            }
        }

        ctx.restore();
    }

    // ---- Selection box (screen-space) ---------------------------------------

    function drawSelectionBox(w, h) {
        if (!isDragging || !dragState || dragState.mode !== 'selectRect') return;
        var sx = dragState.startMouse.x, sy = dragState.startMouse.y;
        var cx = dragState.currentMouse.x, cy = dragState.currentMouse.y;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = '#4c9aff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(Math.min(sx, cx), Math.min(sy, cy), Math.abs(cx - sx), Math.abs(cy - sy));
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(76,154,255,0.08)';
        ctx.fillRect(Math.min(sx, cx), Math.min(sy, cy), Math.abs(cx - sx), Math.abs(cy - sy));
        ctx.restore();
    }

    // ---- Transform handles (screen-space) -----------------------------------

    function drawHandles(w, h) {
        var bounds = getSelBounds();
        if (!bounds) return;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Bounding box
        var tl = worldToCanvas(bounds.x1, bounds.y1);
        var br = worldToCanvas(bounds.x2, bounds.y2);

        ctx.strokeStyle = '#4c9aff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(tl[0], tl[1], br[0] - tl[0], br[1] - tl[1]);
        ctx.setLineDash([]);

        var hs = HANDLE_SIZE;

        // 8 corner handles
        var corners = [
            [bounds.x1, bounds.y1], [bounds.x1 + (bounds.x2 - bounds.x1) / 2, bounds.y1], [bounds.x2, bounds.y1],
            [bounds.x1, bounds.y1 + (bounds.y2 - bounds.y1) / 2], [bounds.x2, bounds.y1 + (bounds.y2 - bounds.y1) / 2],
            [bounds.x1, bounds.y2], [bounds.x1 + (bounds.x2 - bounds.x1) / 2, bounds.y2], [bounds.x2, bounds.y2]
        ];

        for (var i = 0; i < corners.length; i++) {
            var p = worldToCanvas(corners[i][0], corners[i][1]);
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#4c9aff';
            ctx.lineWidth = 1.5;
            ctx.fillRect(p[0] - hs / 2, p[1] - hs / 2, hs, hs);
            ctx.strokeRect(p[0] - hs / 2, p[1] - hs / 2, hs, hs);
        }

        // Rotation handle (above top center)
        var rotCenter = worldToCanvas((bounds.x1 + bounds.x2) / 2, bounds.y1 - 30 / view.zoom);
        ctx.strokeStyle = '#4c9aff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo((tl[0] + br[0]) / 2, tl[1]);
        ctx.lineTo(rotCenter[0], rotCenter[1] + hs / 2);
        ctx.stroke();

        ctx.fillStyle = '#4c9aff';
        ctx.beginPath();
        ctx.arc(rotCenter[0], rotCenter[1], hs / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ---- Legend bar ---------------------------------------------------------

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function drawGcodeOverlay() {
        if (gcodeCache.rapids) {
            ctx.save();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 0.15;
            ctx.setLineDash([1, 2]);
            ctx.stroke(gcodeCache.rapids);
            ctx.setLineDash([]);
            ctx.restore();
        }
        ctx.lineWidth = 0.12;
        for (var b in gcodeCache.bands) {
            ctx.strokeStyle = BAND_COLORS[parseInt(b)];
            ctx.stroke(gcodeCache.bands[b]);
        }
    }

    function drawLegend(w, h) {
        var items = [
            { label: 'Cut on line', color: '#e81123' },
            { label: 'Cut outside', color: '#0078d4' },
            { label: 'Cut inside', color: '#ffb900' },
            { label: 'Fill / Pocket', color: '#107c10' },
            { label: 'Mill Pocket', color: '#8b4513' },
            { label: 'Mill Cut', color: '#d2691e' },
            { label: 'Mill V-Carve', color: '#a0522d' },
            { label: 'Raster', color: '#881798' },
            { label: 'Raster Merge', color: '#cc33cc' },
            { label: 'Engrave', color: '#666666' },
            { label: 'None', color: '#999999' }
        ];
        var barH = 24;
        var gap = 3;
        var swatchW = 10;
        var fontSize = 11;
        var totalW = 0;
        ctx.font = fontSize + 'px sans-serif';
        for (var i = 0; i < items.length; i++) {
            totalW += swatchW + gap + ctx.measureText(items[i].label).width + 16;
        }
        totalW -= 16;
        var startX = (w - totalW) / 2;
        var barY = h - barH - 8;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Background pill
        ctx.fillStyle = 'rgba(240,240,240,0.92)';
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        var bgX = startX - 8;
        var bgW = totalW + 16;
        roundRect(ctx, bgX, barY, bgW, barH, 10);
        ctx.fill();
        ctx.stroke();

        // Items
        var x = startX;
        var cy = barY + barH / 2;
        ctx.textBaseline = 'middle';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            ctx.fillStyle = item.color;
            ctx.fillRect(x, cy - swatchW / 2, swatchW, swatchW);
            ctx.fillStyle = '#333';
            ctx.font = fontSize + 'px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + swatchW + gap, cy);
            x += swatchW + gap + ctx.measureText(item.label).width + 16;
        }

        ctx.restore();
    }

    // ---- Selection ----------------------------------------------------------

    function getSelBounds() {
        var b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        var found = false;
        for (var i = 0; i < documents.length; i++) {
            var d = documents[i];
            if (selectedIds.indexOf(d.id) < 0) continue;
            var db = getDocBounds(d);
            if (db) {
                found = true;
                b.x1 = Math.min(b.x1, db.x1);
                b.y1 = Math.min(b.y1, db.y1);
                b.x2 = Math.max(b.x2, db.x2);
                b.y2 = Math.max(b.y2, db.y2);
            }
        }
        return found ? b : null;
    }

    function getDocBounds(doc) {
        if (doc.rawPaths) {
            var b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
            var found = false;
            for (var pi = 0; pi < doc.rawPaths.length; pi++) {
                var p = doc.rawPaths[pi];
                if (!p || p.length < 2) continue;
                for (var j = 0; j < p.length; j += 2) {
                    found = true;
                    if (p[j] < b.x1) b.x1 = p[j];
                    if (p[j] > b.x2) b.x2 = p[j];
                    if (p[j + 1] < b.y1) b.y1 = p[j + 1];
                    if (p[j + 1] > b.y2) b.y2 = p[j + 1];
                }
            }
            if (!found) return null;
            // Apply transform
            var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];
            var pts = [
                applyTf(tf, b.x1, b.y1), applyTf(tf, b.x2, b.y1),
                applyTf(tf, b.x2, b.y2), applyTf(tf, b.x1, b.y2)
            ];
            var tb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
            for (var k = 0; k < pts.length; k++) {
                if (pts[k][0] < tb.x1) tb.x1 = pts[k][0];
                if (pts[k][0] > tb.x2) tb.x2 = pts[k][0];
                if (pts[k][1] < tb.y1) tb.y1 = pts[k][1];
                if (pts[k][1] > tb.y2) tb.y2 = pts[k][1];
            }
            return tb;
        } else if (doc.type === 'image') {
            var imgW = doc._imgW || (doc.originalPixels ? doc.originalPixels[0] : null);
            var imgH = doc._imgH || (doc.originalPixels ? doc.originalPixels[1] : null);
            if (imgW == null || imgH == null) return null;
            var tf2 = doc.transform2d || [1, 0, 0, 1, 0, 0];
            var iw = imgW * Math.abs(tf2[0]);
            var ih = imgH * Math.abs(tf2[3]);
            var pts2 = [
                applyTf(tf2, 0, 0), applyTf(tf2, iw, 0),
                applyTf(tf2, iw, ih), applyTf(tf2, 0, ih)
            ];
            var tb2 = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
            for (var m = 0; m < pts2.length; m++) {
                if (pts2[m][0] < tb2.x1) tb2.x1 = pts2[m][0];
                if (pts2[m][0] > tb2.x2) tb2.x2 = pts2[m][0];
                if (pts2[m][1] < tb2.y1) tb2.y1 = pts2[m][1];
                if (pts2[m][1] > tb2.y2) tb2.y2 = pts2[m][1];
            }
            return tb2;
        }
        return null;
    }

    function applyTf(tf, x, y) {
        return [tf[0] * x + tf[2] * y + tf[4], tf[1] * x + tf[3] * y + tf[5]];
    }

    // ---- Hit testing --------------------------------------------------------

    function hitTest(mx, my) {
        var world = canvasToWorld(mx, my);
        var wx = world[0], wy = world[1];
        var threshold = 5 / view.zoom;

        for (var i = documents.length - 1; i >= 0; i--) {
            var doc = documents[i];
            if (doc.visible === false) continue;
            var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];

            if (doc.rawPaths) {
                for (var pi = 0; pi < doc.rawPaths.length; pi++) {
                    var path = doc.rawPaths[pi];
                    if (!path || path.length < 2) continue;
                    for (var j = 0; j < path.length - 2; j += 2) {
                        var p1 = applyTf(tf, path[j], path[j + 1]);
                        var p2 = applyTf(tf, path[j + 2], path[j + 3]);
                        var dist = pointToSegmentDist(wx, wy, p1[0], p1[1], p2[0], p2[1]);
                        if (dist < threshold) return doc;
                    }
                }
            } else if (doc.type === 'image') {
                var imgW = doc._imgW || (doc.originalPixels ? doc.originalPixels[0] : null);
                var imgH = doc._imgH || (doc.originalPixels ? doc.originalPixels[1] : null);
                if (imgW == null || imgH == null) continue;
                var iw = imgW * Math.abs(tf[0]);
                var ih = imgH * Math.abs(tf[3]);
                var corners = [
                    applyTf(tf, 0, 0), applyTf(tf, iw, 0),
                    applyTf(tf, iw, ih), applyTf(tf, 0, ih)
                ];
                if (pointInPolygon(wx, wy, corners)) return doc;
            }
        }
        return null;
    }

    function pointToSegmentDist(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        var lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        var nearX = x1 + t * dx, nearY = y1 + t * dy;
        return Math.sqrt((px - nearX) * (px - nearX) + (py - nearY) * (py - nearY));
    }

    function pointInPolygon(px, py, poly) {
        var inside = false;
        for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            var xi = poly[i][0], yi = poly[i][1];
            var xj = poly[j][0], yj = poly[j][1];
            if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    // ---- Handle hit testing (screen-space) ---------------------------------

    function hitHandle(mx, my) {
        var bounds = getSelBounds();
        if (!bounds) return null;
        var hs = HANDLE_SIZE;
        var threshold = hs + 4;

        var corners = [
            { name: 'tl', x: bounds.x1, y: bounds.y1 },
            { name: 'tc', x: (bounds.x1 + bounds.x2) / 2, y: bounds.y1 },
            { name: 'tr', x: bounds.x2, y: bounds.y1 },
            { name: 'ml', x: bounds.x1, y: (bounds.y1 + bounds.y2) / 2 },
            { name: 'mr', x: bounds.x2, y: (bounds.y1 + bounds.y2) / 2 },
            { name: 'bl', x: bounds.x1, y: bounds.y2 },
            { name: 'bc', x: (bounds.x1 + bounds.x2) / 2, y: bounds.y2 },
            { name: 'br', x: bounds.x2, y: bounds.y2 }
        ];

        for (var i = 0; i < corners.length; i++) {
            var p = worldToCanvas(corners[i].x, corners[i].y);
            if (Math.abs(mx - p[0]) < threshold && Math.abs(my - p[1]) < threshold) {
                return corners[i].name;
            }
        }

        // Rotation handle
        var rotY = bounds.y1 - 30 / view.zoom;
        var rp = worldToCanvas((bounds.x1 + bounds.x2) / 2, rotY);
        if (Math.abs(mx - rp[0]) < threshold && Math.abs(my - rp[1]) < threshold) {
            return 'rot';
        }

        return null;
    }

    // ---- Interaction --------------------------------------------------------

    function setupInteraction() {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('dblclick', onDoubleClick);
        canvas.addEventListener('keydown', onKeyDown);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
        canvas.style.touchAction = 'none';
        canvas.setAttribute('tabindex', '0');
    }

    function wrapTouch(e) {
        if (!e.touches || !e.touches.length) return e;
        var t = e.touches[0];
        return {
            clientX: t.clientX, clientY: t.clientY,
            shiftKey: false,
            preventDefault: function () { e.preventDefault(); },
            stopPropagation: function () { e.stopPropagation(); }
        };
    }

    function wrapTouchEnd(e) {
        var t = e.changedTouches[0];
        return {
            clientX: t.clientX, clientY: t.clientY,
            shiftKey: false,
            preventDefault: function () { e.preventDefault(); },
            stopPropagation: function () { e.stopPropagation(); }
        };
    }

    function onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 2) {
            isDragging = true;
            var t1 = e.touches[0], t2 = e.touches[1];
            dragState = {
                mode: 'twoFingerPan',
                startMouse: { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 },
                startView: { ox: view.ox, oy: view.oy }
            };
            setCanvasCursorClass('grabbing');
            return;
        }
        if (e.touches.length === 1) {
            onMouseDown(wrapTouch(e));
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (isDragging && dragState && dragState.mode === 'twoFingerPan' && e.touches.length === 2) {
            var t1 = e.touches[0], t2 = e.touches[1];
            var rect = canvas.getBoundingClientRect();
            var mx = (t1.clientX + t2.clientX) / 2 - rect.left;
            var my = (t1.clientY + t2.clientY) / 2 - rect.top;
            var dx = (mx - dragState.startMouse.x) / view.zoom;
            var dy = (my - dragState.startMouse.y) / view.zoom;
            view.ox = dragState.startView.ox + dx;
            view.oy = dragState.startView.oy + dy;
            return;
        }
        if (e.touches.length === 1) {
            onMouseMove(wrapTouch(e));
        }
    }

    function onTouchEnd(e) {
        if (isDragging && dragState && dragState.mode === 'twoFingerPan') {
            isDragging = false;
            dragState = null;
            setCanvasCursorClass(getCursorClass());
            return;
        }
        onMouseUp(wrapTouchEnd(e));
    }

    function getMousePos(e) {
        var rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMouseDown(e) {
        var pos = getMousePos(e);

        // TAB mode: place a tab (bridge) on the clicked vector
        if (currentMode === MODES.TAB) {
            var hit = hitTest(pos.x, pos.y);
            if (hit) {
                var tp = hit.toolpath || {};
                if (!tp.tabs) tp.tabs = [];
                // Add tab at click point (store world coords)
                var world = canvasToWorld(pos.x, pos.y);
                tp.tabs.push({ x: world[0], y: world[1], width: 3 });
                LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: hit.id, changes: { toolpath: tp } } });
                ui.showToast('Tab placed on ' + (hit.name || 'vector'), 'success');
            } else {
                ui.showToast('Click on a vector to place a tab', 'info');
            }
            return;
        }

        // Check handle hits
        if (selectedIds.length > 0) {
            var h = hitHandle(pos.x, pos.y);
            if (h) {
                isDragging = true;
                var bounds = getSelBounds();
                dragState = {
                    mode: 'handle',
                    handle: h,
                    startMouse: pos,
                    startBounds: { x1: bounds.x1, y1: bounds.y1, x2: bounds.x2, y2: bounds.y2 },
                    startTransforms: getSelTransforms(),
                    constrainAspect: h !== 'rot' && !e.shiftKey
                };
                if (h === 'rot') {
                    var scx = (bounds.x1 + bounds.x2) / 2;
                    var scy = (bounds.y1 + bounds.y2) / 2;
                    var swp = canvasToWorld(pos.x, pos.y);
                    dragState.selCenter = { x: scx, y: scy };
                    dragState.startAngle = Math.atan2(swp[1] - scy, swp[0] - scx);
                }
                return;
            }
        }

        // Check document hits
        var hit = hitTest(pos.x, pos.y);
        if (hit) {
            if (selectedIds.indexOf(hit.id) >= 0 && selectedIds.length > 1 && e.shiftKey) {
                // Remove from selection
                selectedIds = selectedIds.filter(function (id) { return id !== hit.id; });
                syncSelection();
                return;
            }
            if (selectedIds.indexOf(hit.id) < 0 && !e.shiftKey) {
                selectedIds = [hit.id];
                syncSelection();
            } else if (selectedIds.indexOf(hit.id) < 0 && e.shiftKey) {
                selectedIds.push(hit.id);
                syncSelection();
            }

            if (currentMode === MODES.MOVE || currentMode === MODES.SELECT) {
                isDragging = true;
                dragState = {
                    mode: 'move',
                    startMouse: pos,
                    startTransforms: getSelTransforms()
                };
            }
        } else {
            if (!e.shiftKey) {
                selectedIds = [];
                syncSelection();
            }
            if (currentMode === MODES.SELECT || currentMode === MODES.MOVE) {
                isDragging = true;
                dragState = {
                    mode: 'selectRect',
                    startMouse: pos,
                    currentMouse: pos
                };
            }
        }
    }

    function onMouseMove(e) {
        var pos = getMousePos(e);

        if (isDragging && dragState) {
            if (dragState.mode === 'pan') {
                var dx = (pos.x - dragState.startMouse.x) / view.zoom;
                var dy = (pos.y - dragState.startMouse.y) / view.zoom;
                view.ox = dragState.startView.ox + dx;
                view.oy = dragState.startView.oy + dy;
            } else if (dragState.mode === 'move') {
                var dx2 = (pos.x - dragState.startMouse.x) / view.zoom;
                var dy2 = (pos.y - dragState.startMouse.y) / view.zoom;
                applyMove(dx2, dy2);
            } else if (dragState.mode === 'handle') {
                applyHandle(pos);
            } else if (dragState.mode === 'selectRect') {
                dragState.currentMouse = pos;
            }
            return;
        }

        // Hover effects
        if (currentMode === MODES.SELECT || currentMode === MODES.MOVE) {
            var hit = hitTest(pos.x, pos.y);
            if (hit) {
                hoveredId = hit.id;
                canvas.style.cursor = 'pointer';
            } else {
                hoveredId = null;
                canvas.style.cursor = currentMode === MODES.MOVE ? 'move' : 'crosshair';
            }
        }
    }

    function onMouseUp(e) {
        if (isDragging && dragState) {
            if (dragState.mode === 'selectRect') {
                // Do rect selection
                var world1 = canvasToWorld(dragState.startMouse.x, dragState.startMouse.y);
                var world2 = canvasToWorld(dragState.currentMouse.x, dragState.currentMouse.y);
                var r = { x1: Math.min(world1[0], world2[0]), y1: Math.min(world1[1], world2[1]),
                          x2: Math.max(world1[0], world2[0]), y2: Math.max(world1[1], world2[1]) };
                selectedIds = [];
                for (var i = 0; i < documents.length; i++) {
                    var d = documents[i];
                    if (d.visible === false) continue;
                    var db = getDocBounds(d);
                    if (db && db.x1 >= r.x1 && db.y1 >= r.y1 && db.x2 <= r.x2 && db.y2 <= r.y2) {
                        selectedIds.push(d.id);
                    }
                }
                syncSelection();
            } else if (dragState.mode === 'move') {
                commitTransforms();
            } else if (dragState.mode === 'handle') {
                commitTransforms();
            }
        }
        isDragging = false;
        dragState = null;
        setCanvasCursorClass(getCursorClass());
    }

    function onWheel(e) {
        e.preventDefault();
        var pos = getMousePos(e);
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        var newZoom = Math.max(0.05, Math.min(50, view.zoom * delta));
        // Zoom toward mouse position
        var world = canvasToWorld(pos.x, pos.y);
        view.ox = (pos.x - canvas.width / 2) / newZoom - world[0];
        view.oy = (pos.y - canvas.height / 2) / newZoom - world[1];
        view.zoom = newZoom;
    }

    function onDoubleClick(e) {
        // no-op (TAB mode now works on single click)
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            selectedIds = [];
            syncSelection();
            LW.draw.setMode('select');
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedIds.length > 0) {
                selectedIds.forEach(function (id) {
                    LW.dispatch({ type: 'DOCUMENT_REMOVE', payload: id });
                });
                selectedIds = [];
            }
        }
    }

    // ---- Transform helpers --------------------------------------------------

    function getSelTransforms() {
        var map = {};
        for (var i = 0; i < documents.length; i++) {
            var d = documents[i];
            if (selectedIds.indexOf(d.id) >= 0) {
                map[d.id] = (d.transform2d || [1, 0, 0, 1, 0, 0]).slice();
            }
        }
        return map;
    }

    function applyMove(dx, dy) {
        for (var id in dragState.startTransforms) {
            var tf = dragState.startTransforms[id];
            updateDocTransform(id, [tf[0], tf[1], tf[2], tf[3], tf[4] + dx, tf[5] + dy]);
        }
    }

    function applyHandle(pos) {
        var handle = dragState.handle;

        // ---- Rotation ----
        if (handle === 'rot') {
            var sc = dragState.selCenter || { x: 0, y: 0 };
            var curWorld = canvasToWorld(pos.x, pos.y);
            var dxR = curWorld[0] - sc.x, dyR = curWorld[1] - sc.y;
            var curAngle = (dxR === 0 && dyR === 0) ? (dragState.startAngle || 0) : Math.atan2(dyR, dxR);
            var da = curAngle - (dragState.startAngle || 0);
            if (!isFinite(da)) return;
            var cosA = Math.cos(da), sinA = Math.sin(da);
            var cx = sc.x, cy = sc.y;
            for (var rid in dragState.startTransforms) {
                var tf = dragState.startTransforms[rid];
                var newTf = [
                    cosA * tf[0] - sinA * tf[1],
                    sinA * tf[0] + cosA * tf[1],
                    cosA * tf[2] - sinA * tf[3],
                    sinA * tf[2] + cosA * tf[3],
                    cosA * (tf[4] - cx) - sinA * (tf[5] - cy) + cx,
                    sinA * (tf[4] - cx) + cosA * (tf[5] - cy) + cy
                ];
                updateDocTransform(rid, newTf);
            }
            return;
        }

        // ---- Scale / Resize ----
        var bounds = dragState.startBounds;
        var bdx = pos.x - dragState.startMouse.x;
        var bdy = pos.y - dragState.startMouse.y;
        var bworld = { dx: bdx / view.zoom, dy: bdy / view.zoom };

        var newBounds = { x1: bounds.x1, y1: bounds.y1, x2: bounds.x2, y2: bounds.y2 };
        switch (handle) {
            case 'tl': newBounds.x1 += bworld.dx; newBounds.y1 += bworld.dy; break;
            case 'tc': newBounds.y1 += bworld.dy; break;
            case 'tr': newBounds.x2 += bworld.dx; newBounds.y1 += bworld.dy; break;
            case 'ml': newBounds.x1 += bworld.dx; break;
            case 'mr': newBounds.x2 += bworld.dx; break;
            case 'bl': newBounds.x1 += bworld.dx; newBounds.y2 += bworld.dy; break;
            case 'bc': newBounds.y2 += bworld.dy; break;
            case 'br': newBounds.x2 += bworld.dx; newBounds.y2 += bworld.dy; break;
        }

        var ow = bounds.x2 - bounds.x1;
        var oh = bounds.y2 - bounds.y1;
        var nw = newBounds.x2 - newBounds.x1;
        var nh = newBounds.y2 - newBounds.y1;

        if (ow <= 0 || oh <= 0 || nw <= 0 || nh <= 0) return;

        var sx = nw / ow;
        var sy = nh / oh;

        // Aspect ratio constraint (default on, Shift to break)
        if (dragState.constrainAspect) {
            if (['ml', 'mr'].indexOf(handle) >= 0) {
                sy = sx;
            } else if (['tc', 'bc'].indexOf(handle) >= 0) {
                sx = sy;
            } else {
                if (sx > sy) { sy = sx; } else { sx = sy; }
            }
        }

        var cx = (bounds.x1 + bounds.x2) / 2;
        var cy = (bounds.y1 + bounds.y2) / 2;

        for (var id in dragState.startTransforms) {
            var tf = dragState.startTransforms[id];
            var newTf = [tf[0] * sx, tf[1] * sx, tf[2] * sy, tf[3] * sy,
                         cx + sx * (tf[4] - cx), cy + sy * (tf[5] - cy)];
            updateDocTransform(id, newTf);
        }
    }

    function updateDocTransform(id, tf) {
        LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: id, changes: { transform2d: tf } } });
    }

    function commitTransforms() {
        // Transforms are already applied via dispatch - just notify
        LW.emit('stateChanged', { type: 'DOCUMENT_UPDATE', state: LW.getState() });
    }

    function syncSelection() {
        // Deselect all, then select current
        for (var i = 0; i < documents.length; i++) {
            var wasSel = documents[i].selected;
            var isSel = selectedIds.indexOf(documents[i].id) >= 0;
            if (wasSel !== isSel) {
                LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: documents[i].id, changes: { selected: isSel } } });
            }
        }
        if (draw.onSelectionChange) {
            draw.onSelectionChange(selectedIds.slice());
        }
    }

    draw.getSelected = function () { return selectedIds.slice(); };
    draw.getDocBounds = getDocBounds;

    // ---- Mode compatibility stubs ------------------------------------------

    draw.setControls = function () {};

})();
