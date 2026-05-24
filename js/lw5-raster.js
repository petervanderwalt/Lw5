(function (window) {
    'use strict';
    if (!window.LW) window.LW = {};
    var LW = window.LW;

    function getRawPathsBounds(rawPaths) {
        var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (var pi = 0; pi < rawPaths.length; pi++) {
            var p = rawPaths[pi];
            for (var vi = 0; vi < p.length; vi += 2) {
                var px = p[vi], py = p[vi + 1];
                if (px < x1) x1 = px;
                if (py < y1) y1 = py;
                if (px > x2) x2 = px;
                if (py > y2) y2 = py;
            }
        }
        return { x1: x1, y1: y1, x2: x2, y2: y2 };
    }

    function transformBounds(bounds, t) {
        var corners = [
            { x: bounds.x1, y: bounds.y1 },
            { x: bounds.x2, y: bounds.y1 },
            { x: bounds.x2, y: bounds.y2 },
            { x: bounds.x1, y: bounds.y2 }
        ];
        var wb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        for (var i = 0; i < 4; i++) {
            var wx = t[0] * corners[i].x + t[2] * corners[i].y + t[4];
            var wy = t[1] * corners[i].x + t[3] * corners[i].y + t[5];
            if (wx < wb.x1) wb.x1 = wx;
            if (wy < wb.y1) wb.y1 = wy;
            if (wx > wb.x2) wb.x2 = wx;
            if (wy > wb.y2) wb.y2 = wy;
        }
        return wb;
    }

    function collectDocs(documents, filteredDocIds) {
        var docs = [];
        var globalBounds = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        var hasAny = false;
        for (var di = 0; di < documents.length; di++) {
            var doc = documents[di];
            if (!filteredDocIds.has(doc.id)) continue;
            if (!doc.transform2d) continue;
            var localBounds;
            if (doc.rawPaths && doc.rawPaths.length) {
                localBounds = getRawPathsBounds(doc.rawPaths);
            } else if (doc.type === 'image') {
                if (doc.originalPixels && doc.originalPixels.length >= 2) {
                    var w = doc.originalPixels[0] || 0;
                    var h = doc.originalPixels[1] || 0;
                    if (!w || !h) continue;
                    localBounds = { x1: 0, y1: 0, x2: w, y2: h };
                } else {
                    continue;
                }
            } else {
                continue;
            }
            var worldBounds = transformBounds(localBounds, doc.transform2d);
            globalBounds.x1 = Math.min(globalBounds.x1, worldBounds.x1);
            globalBounds.y1 = Math.min(globalBounds.y1, worldBounds.y1);
            globalBounds.x2 = Math.max(globalBounds.x2, worldBounds.x2);
            globalBounds.y2 = Math.max(globalBounds.y2, worldBounds.y2);
            docs.push(doc);
            hasAny = true;
        }
        return { docs: docs, bounds: globalBounds, hasAny: hasAny };
    }

    function renderVector(ctx, doc) {
        var rp = doc.rawPaths;
        if (!rp || !rp.length) return;
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        for (var pi = 0; pi < rp.length; pi++) {
            var p = rp[pi];
            if (p.length < 4) continue;
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            for (var vi = 2; vi < p.length; vi += 2) {
                ctx.lineTo(p[vi], p[vi + 1]);
            }
            if (p.length >= 4 && p[0] === p[p.length - 2] && p[1] === p[p.length - 1]) {
                ctx.closePath();
            }
            ctx.fill();
            ctx.stroke();
        }
    }

    LW.rasterMerge = function (documents, filteredDocIds, laserDiameter, callback) {
        var collected = collectDocs(documents, filteredDocIds);
        if (!collected.hasAny) { callback(null, null); return; }
        if (!laserDiameter || laserDiameter <= 0) { callback(null, null); return; }
        var b = collected.bounds;
        b.x2 = Math.max(b.x2, b.x1 + 1);
        b.y2 = Math.max(b.y2, b.y1 + 1);
        var width = Math.ceil((b.x2 - b.x1) / laserDiameter);
        var height = Math.ceil((b.y2 - b.y1) / laserDiameter);
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.setTransform(1 / laserDiameter, 0, 0, 1 / laserDiameter, -b.x1 / laserDiameter, -b.y1 / laserDiameter);
        var pending = 0;
        var doneCalled = false;
        function finish() {
            if (doneCalled) return;
            doneCalled = true;
            var t2d = [(b.x2 - b.x1) / width, 0, 0, (b.y2 - b.y1) / height, b.x1, b.y1];
            callback(canvas.toDataURL(), t2d);
        }
        for (var di = 0; di < collected.docs.length; di++) {
            var doc = collected.docs[di];
            ctx.save();
            ctx.transform(doc.transform2d[0], doc.transform2d[1], doc.transform2d[2], doc.transform2d[3], doc.transform2d[4], doc.transform2d[5]);
            if (doc.type === 'image' && doc.dataURL) {
                pending++;
                (function (d) {
                    var img = new Image();
                    img.onload = function () {
                        if (!doneCalled) ctx.drawImage(img, 0, 0);
                        pending--;
                        if (pending === 0) finish();
                    };
                    img.onerror = function () {
                        pending--;
                        if (pending === 0) finish();
                    };
                    img.src = d.dataURL;
                })(doc);
            } else if (doc.rawPaths && doc.rawPaths.length) {
                renderVector(ctx, doc);
            }
            ctx.restore();
        }
        if (pending === 0) finish();
    };
})(window);
