(function () {
    'use strict';
    var LW = window.LW = window.LW || {};

    function luminance(r, g, b) {
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function millHalftoneGcode(imageData, opts) {
        var cellSize = opts.cellSize || 0.1;
        var safeZ = opts.safeZ || 10;
        var startZ = opts.startZ || 0;
        var maxDepth = opts.maxDepth || -1;
        var plungeFeed = opts.plungeFeed || 300;
        var decimal = opts.decimal || 3;
        var offsetX = opts.offsetX || 0;
        var offsetY = opts.offsetY || 0;
        var direction = opts.direction || 'top_to_bottom';
        var invert = opts.invert || false;

        var w = imageData.width;
        var h = imageData.height;
        var data = imageData.data;
        var lines = [];

        lines.push('; Mill Halftone Plunge');
        lines.push('; Cell: ' + cellSize + ' mm  SafeZ: ' + safeZ + '  Depth: ' + startZ + ' to ' + maxDepth);
        lines.push('G0 Z' + safeZ.toFixed(decimal));

        var yStart = direction === 'bottom_to_top' ? h - 1 : 0;
        var yEnd = direction === 'bottom_to_top' ? -1 : h;
        var yStep = direction === 'bottom_to_top' ? -1 : 1;

        for (var y = yStart; y !== yEnd; y += yStep) {
            for (var x = 0; x < w; x++) {
                var idx = (y * w + x) * 4;
                var luma = luminance(data[idx], data[idx + 1], data[idx + 2]);
                if (invert) luma = 255 - luma;
                var depth = startZ + (luma / 255) * (maxDepth - startZ);
                var wx = x * cellSize + offsetX;
                var wy = y * cellSize + offsetY;
                lines.push('G0 X' + wx.toFixed(decimal) + ' Y' + wy.toFixed(decimal));
                lines.push('G1 Z' + depth.toFixed(decimal) + ' F' + plungeFeed);
                lines.push('G0 Z' + safeZ.toFixed(decimal));
            }
        }

        lines.push('G0 Z' + safeZ.toFixed(decimal));
        return lines.join('\n');
    }

    LW.millHalftone = millHalftoneGcode;
})();
