(function () {
    'use strict';
    var LW = window.LW = window.LW || {};

    function luminance(r, g, b) {
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function millHeightmapGcode(imageData, opts) {
        var cellSize = opts.cellSize || 0.1;
        var safeZ = opts.safeZ || 10;
        var startZ = opts.startZ || 0;
        var maxDepth = opts.maxDepth || -1;
        var plungeFeed = opts.plungeFeed || 300;
        var cutFeed = opts.cutFeed || 300;
        var decimal = opts.decimal || 3;
        var offsetX = opts.offsetX || 0;
        var offsetY = opts.offsetY || 0;
        var stepOverPx = opts.stepOverPx || 1;
        var direction = opts.direction || 'top_to_bottom';
        var invert = opts.invert || false;

        var w = imageData.width;
        var h = imageData.height;
        var data = imageData.data;
        var lines = [];

        lines.push('; Mill Heightmap Raster');
        lines.push('; Cell: ' + cellSize + ' mm  SafeZ: ' + safeZ + '  Depth: ' + startZ + ' to ' + maxDepth);
        lines.push('G0 Z' + safeZ.toFixed(decimal));

        var yStart = direction === 'bottom_to_top' ? h - 1 : 0;
        var yEnd = direction === 'bottom_to_top' ? -1 : h;
        var yStep = (direction === 'bottom_to_top' ? -1 : 1) * stepOverPx;

        for (var y = yStart; (yStep > 0 ? y < yEnd : y > yEnd); y += yStep) {
            var clampedY = Math.max(0, Math.min(h - 1, y));
            var scanLeft = (Math.floor(Math.abs(clampedY - yStart) / stepOverPx) % 2 === 0);
            var xStart = scanLeft ? 0 : w - 1;
            var xEnd = scanLeft ? w : -1;
            var xStep = scanLeft ? 1 : -1;

            var first = true;
            for (var x = xStart; x !== xEnd; x += xStep) {
                var clampedX = Math.max(0, Math.min(w - 1, x));
                var idx = (clampedY * w + clampedX) * 4;
                var luma = luminance(data[idx], data[idx + 1], data[idx + 2]);
                if (invert) luma = 255 - luma;

                var z = startZ + (luma / 255) * (maxDepth - startZ);
                var wx = clampedX * cellSize + offsetX;
                var wy = clampedY * cellSize + offsetY;

                if (first) {
                    lines.push('G0 X' + wx.toFixed(decimal) + ' Y' + wy.toFixed(decimal));
                    lines.push('G1 Z' + z.toFixed(decimal) + ' F' + plungeFeed);
                    first = false;
                } else {
                    lines.push('G1 X' + wx.toFixed(decimal) + ' Y' + wy.toFixed(decimal) + ' Z' + z.toFixed(decimal) + ' F' + cutFeed);
                }
            }
            lines.push('G0 Z' + safeZ.toFixed(decimal));
        }

        return lines.join('\n');
    }

    LW.millHeightmap = millHeightmapGcode;
})();
