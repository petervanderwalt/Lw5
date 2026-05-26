(function () {
    'use strict';
    var LW = window.LW = window.LW || {};
    var overlay = { visible: true, segments: null, _worker: null, _cb: null };

    var workerCode = [
        'self.onmessage = function(e) {',
        '  try {',
        '    var code = e.data;',
        '    var rapids = [], cuts = [], plunges = [], zmoves = [];',
        '    var px = 0, py = 0, pz = 0, ps = 0;',
        '    var abs = true;',
        '    var bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;',
        '    function extend(x, y) { if (x < bx1) bx1 = x; if (y < by1) by1 = y; if (x > bx2) bx2 = x; if (y > by2) by2 = y; }',
        '    function pushRapid(x1, y1, x2, y2) { rapids.push(x1, y1, x2, y2); extend(x1, y1); extend(x2, y2); }',
        '    function pushCut(x1, y1, x2, y2, s) { cuts.push(x1, y1, x2, y2, s); extend(x1, y1); extend(x2, y2); }',
        '    function pushPlunge(x1, y1, x2, y2, z1, z2) { plunges.push(x1, y1, x2, y2, z1, z2); extend(x1, y1); extend(x2, y2); }',
        '    function pushZMove(x1, y1, x2, y2, z1, z2) { zmoves.push(x1, y1, x2, y2, z1, z2); extend(x1, y1); extend(x2, y2); }',
        '    var lines = code.split("\\n");',
        '    for (var i = 0; i < lines.length; i++) {',
        '      var line = lines[i].replace(/;.*$/, "").replace(/\\([^)]*\\)/g, "").trim();',
        '      if (!line) continue;',
        '      if (/^G90/i.test(line)) { abs = true; continue; }',
        '      if (/^G91/i.test(line)) { abs = false; continue; }',
        '      var g, x, y, z, s;',
        '      g = (line.match(/^G0/i) ? 0 : line.match(/^G1/i) ? 1 : null);',
        '      if (g === null) {',
        '        var sm = line.match(/\\bS([\\d\\.]+)/i);',
        '        if (sm) ps = parseFloat(sm[1]);',
        '        continue;',
        '      }',
        '      var xm = line.match(/\\bX([\\d\\.\\-]+)/i);',
        '      var ym = line.match(/\\bY([\\d\\.\\-]+)/i);',
        '      var zm = line.match(/\\bZ([\\d\\.\\-]+)/i);',
        '      var sm = line.match(/\\bS([\\d\\.]+)/i);',
        '      if (sm) ps = parseFloat(sm[1]);',
        '      x = xm ? (abs ? parseFloat(xm[1]) : px + parseFloat(xm[1])) : px;',
        '      y = ym ? (abs ? parseFloat(ym[1]) : py + parseFloat(ym[1])) : py;',
        '      z = zm ? (abs ? parseFloat(zm[1]) : pz + parseFloat(zm[1])) : pz;',
        '      var sameXY = (x === px && y === py);',
        '      if (g === 0) {',
        '        if (z !== pz) {',
        '          pushRapid(px, py, x, y);',
        '        }',
        '      } else {',
        '        if (sameXY && z !== pz) {',
        '          if (z < pz) pushPlunge(px, py, x, y, pz, z);',
        '          else pushPlunge(px, py, x, y, pz, z);',
        '        } else if (!sameXY && z !== pz) {',
        '          pushZMove(px, py, x, y, pz, z);',
        '        } else if (!sameXY) {',
        '          pushCut(px, py, x, y, ps);',
        '        }',
        '      }',
        '      px = x; py = y; pz = z;',
        '    }',
        '    self.postMessage({',
        '      rapids: new Float64Array(rapids),',
        '      cuts: new Float64Array(cuts),',
        '      plunges: new Float64Array(plunges),',
        '      zmoves: new Float64Array(zmoves),',
        '      bounds: { x1: bx1, y1: by1, x2: bx2, y2: by2 }',
        '    });',
        '  } catch(err) { self.postMessage({ error: err.message }); }',
        '};'
    ].join('\n');

    function ensureWorker() {
        if (overlay._worker) return;
        var blob = new Blob([workerCode], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);
        overlay._worker = new Worker(url);
        URL.revokeObjectURL(url);
        overlay._worker.onmessage = function (e) {
            if (e.data.error) { console.error('GCode overlay error:', e.data.error); return; }
            overlay.segments = e.data;
            if (overlay._cb) overlay._cb(e.data);
        };
    }

    overlay.parse = function (gcode, cb) {
        ensureWorker();
        overlay._cb = cb || null;
        overlay._worker.postMessage(gcode);
    };

    overlay.setVisible = function (v) { overlay.visible = v; };
    overlay.isVisible = function () { return overlay.visible; };
    overlay.getSegments = function () { return overlay.segments; };

    LW.gcodeOverlay = overlay;
})();
