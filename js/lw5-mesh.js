// Copyright 2014-2016 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// TODO: pass React elements to alertFn

(function () {
    "use strict";

    var ClipperLib = window.ClipperLib;
    var SweepContext = window.poly2tri.SweepContext;

    var inchToClipperScale = 1270000000;
    var mmToClipperScale = inchToClipperScale / 25.4;
    var clipperToCppScale = 1 / 128;
    var cleanPolyDist = 100;
    var arcTolerance = 10000;

    function linearizeCubicBezier(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, minNumSegments, minSegmentLength) {
        function bez(p0, p1, p2, p3, t) {
            return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
        }

        if (p1x == c1x && p1y == c1y && p2x == c2x && p2y == c2y)
            return ['L', p2x, p2y];

        var numSegments = minNumSegments;
        while (true) {
            var x = p1x;
            var y = p1y;
            var result = ['L'];
            for (var i = 1; i <= numSegments; ++i) {
                var t = 1.0 * i / numSegments;
                var nextX = bez(p1x, c1x, c2x, p2x, t);
                var nextY = bez(p1y, c1y, c2y, p2y, t);
                if ((nextX - x) * (nextX - x) + (nextY - y) * (nextY - y) > minSegmentLength * minSegmentLength) {
                    numSegments *= 2;
                    result = null;
                    break;
                }
                result.push(nextX, nextY);
                x = nextX;
                y = nextY;
            }
            if (result)
                return result;
        }
    }

    function linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn) {
        if (path.length < 2 || path[0].length != 3 || path[0][0] != 'M') {
            alertFn('Path does not begin with M')
            return null;
        }
        var x = path[0][1];
        var y = path[0][2];
        var result = [path[0]];
        for (var i = 1; i < path.length; ++i) {
            var subpath = path[i];
            if (subpath[0] == 'C' && subpath.length == 7) {
                result.push(linearizeCubicBezier(
                    x, y, subpath[1], subpath[2], subpath[3], subpath[4], subpath[5], subpath[6], minNumSegments, minSegmentLength));
                x = subpath[5];
                y = subpath[6];
            } else if (subpath[0] == 'M' && subpath.length == 3) {
                result.push(subpath);
                x = subpath[1];
                y = subpath[2];
            } else {
                alertFn('Subpath has an unknown prefix: ' + subpath[0]);
                return null;
            }
        }
        return result;
    };

    function elementToLinearSnapPaths(element, minNumSegments, minSegmentLength, alertFn) {
        var path = null;
        var Snap = require('snapsvg');
        var snapElement = Snap(element);

        if (snapElement.type == 'path')
            path = snapElement.attr('d');
        else if (snapElement.type == 'rect') {
            var x = Number(snapElement.attr('x'));
            var y = Number(snapElement.attr('y'));
            var w = Number(snapElement.attr('width'));
            var h = Number(snapElement.attr('height'));
            path = 'm' + x + ',' + y + ' ' + w + ',' + 0 + ' ' + 0 + ',' + h + ' ' + (-w) + ',' + 0 + ' ' + 0 + ',' + (-h) + ' ';
        }
        else {
            alertFn('<b>' + snapElement.type + "</b> is not supported; try Inkscape's <strong>Object to Path</strong> command");
            return null;
        }

        if (snapElement.attr('clip-path') != '') {
            alertFn('clip-path is not supported');
            return null;
        }

        if (snapElement.attr('mask') != '') {
            alertFn('mask is not supported');
            return null;
        }

        if (path == null) {
            alertFn('path is missing');
            return;
        }

        path = Snap.path.map(path, snapElement.transform().globalMatrix);
        path = Snap.parsePathString(path);
        path = linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn);
        return path;
    };

    function snapPathToRawPaths(snapPath, pxPerInch, alertFn) {
        var factor = 2540 / (pxPerInch * 100);
        if (snapPath.length < 2 || snapPath[0].length != 3 || snapPath[0][0] != 'M') {
            alertFn('Path does not begin with M');
            return null;
        }
        var currentPath = [snapPath[0][1] * factor, snapPath[0][2] * factor];
        var result = [currentPath];
        for (var i = 1; i < snapPath.length; ++i) {
            var subpath = snapPath[i];
            if (subpath[0] == 'M' && subpath.length == 3) {
                currentPath = [subpath[1] * factor, subpath[2] * factor];
                result.push(currentPath);
            } else if (subpath[0] == 'L') {
                for (var j = 0; j < (subpath.length - 1) / 2; ++j)
                    currentPath.push(subpath[1 + j * 2] * factor, subpath[2 + j * 2] * factor);
            } else {
                alertFn('Subpath has a non-linear prefix: ' + subpath[0]);
                return null;
            }
        }
        return result;
    };

    function elementToRawPaths(element, pxPerInch, minNumSegments, minSegmentLength, alertFn) {
        var path = elementToLinearSnapPaths(element, minNumSegments, minSegmentLength, alertFn);
        if (path !== null)
            return snapPathToRawPaths(path, pxPerInch, alertFn);
        return null;
    }

    function pathStrToRawPaths(str, pxPerInch, minNumSegments, minSegmentLength, alertFn) {
        var Snap = require('snapsvg');
        var path = Snap.parsePathString(str);
        path = Snap.path.toCubic(path);
        path = linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn);
        if (path !== null)
            return snapPathToRawPaths(path, pxPerInch, alertFn);
        return null;
    }

    function flipY(allRawPaths, deltaY) {
        for (var rawPaths of allRawPaths)
            for (var rawPath of rawPaths)
                for (var i = 0; i < rawPath.length; i += 2)
                    rawPath[i + 1] = deltaY - rawPath[i + 1];
    }

    function hasClosedRawPaths(rawPaths) {
        for (var path of rawPaths)
            if (path.length >= 4 && path[0] == path[path.length - 2] && path[1] == path[path.length - 1])
                return true;
        return false;
    }

    function filterClosedRawPaths(rawPaths) {
        var result = [];
        for (var path of rawPaths)
            if (path.length >= 4 && path[0] == path[path.length - 2] && path[1] == path[path.length - 1])
                result.push(path);
        return result;
    }

    function rawPathsToClipperPaths(rawPaths, transform) {
        var result = rawPaths.map(function (p) {
            var result = [];
            for (var i = 0; i < p.length; i += 2) {
                result.push({
                    X: (transform[0] * p[i] + transform[2] * p[i + 1] + transform[4]) * mmToClipperScale,
                    Y: (transform[1] * p[i] + transform[3] * p[i + 1] + transform[5]) * mmToClipperScale,
                });
            }
            return result;
        });
        if (hasClosedRawPaths(rawPaths)) {
            result = ClipperLib.Clipper.CleanPolygons(result, cleanPolyDist);
            result = ClipperLib.Clipper.SimplifyPolygons(result, ClipperLib.PolyFillType.pftEvenOdd);
        }
        return result;
    }

    function clipperPathsToPolyTree(paths) {
        var c = new ClipperLib.Clipper();
        c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
        var polyTree = new ClipperLib.PolyTree();
        c.Execute(ClipperLib.ClipType.ctUnion, polyTree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
        return polyTree;
    }

    function triangulatePolyTree(polyTree) {
        var result = [];
        var pointToVertex = function (point) { return { x: point.X / mmToClipperScale, y: point.Y / mmToClipperScale }; };
        var contourToVertexes = function (path) { return path.map(pointToVertex); };
        var nodesToVertexes = function (nodes) { return nodes.map(function (node) { return contourToVertexes(node.Contour()); }); };
        var processNode = function (node) {
            var vertexes = contourToVertexes(node.Contour());
            var holes = nodesToVertexes(node.Childs());
            var context = new SweepContext(vertexes);
            context.addHoles(holes);
            context.triangulate();
            var triangles = context.getTriangles();
            for (var t of triangles) {
                var p = t.getPoints();
                result.push(
                    p[0].x, p[0].y,
                    p[1].x, p[1].y,
                    p[2].x, p[2].y);
            }
            for (var hole of node.Childs()) {
                for (var next of hole.Childs()) {
                    processNode(next);
                }
            }
        };
        for (var node of polyTree.Childs()) {
            processNode(node);
        }
        return result;
    }

    function triangulateRawPaths(rawPaths) {
        return triangulatePolyTree(clipperPathsToPolyTree(rawPathsToClipperPaths(rawPaths, [1, 0, 0, 1, 0, 0])));
    }

    function clipperPathsToCPaths(memoryBlocks, clipperPaths) {
        if (typeof Module === 'undefined') return [null, 0, null];
        var doubleSize = 8;

        var cPaths = Module._malloc(clipperPaths.length * 4);
        memoryBlocks.push(cPaths);
        var cPathsBase = cPaths >> 2;

        var cPathSizes = Module._malloc(clipperPaths.length * 4);
        memoryBlocks.push(cPathSizes);
        var cPathSizesBase = cPathSizes >> 2;

        for (var i = 0; i < clipperPaths.length; ++i) {
            var clipperPath = clipperPaths[i];

            var cPath = Module._malloc(clipperPath.length * 2 * doubleSize + 4);
            memoryBlocks.push(cPath);
            if (cPath & 4)
                cPath += 4;
            var pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);

            for (var j = 0; j < clipperPath.length; ++j) {
                var point = clipperPath[j];
                pathArray[j * 2] = point.X * clipperToCppScale;
                pathArray[j * 2 + 1] = point.Y * clipperToCppScale;
            }

            Module.HEAPU32[cPathsBase + i] = cPath;
            Module.HEAPU32[cPathSizesBase + i] = clipperPath.length;
        }

        return [cPaths, clipperPaths.length, cPathSizes];
    }

    function cPathsToClipperPaths(memoryBlocks, cPathsRef, cNumPathsRef, cPathSizesRef) {
        var cPaths = Module.HEAPU32[cPathsRef >> 2];
        memoryBlocks.push(cPaths);
        var cPathsBase = cPaths >> 2;

        var cNumPaths = Module.HEAPU32[cNumPathsRef >> 2];

        var cPathSizes = Module.HEAPU32[cPathSizesRef >> 2];
        memoryBlocks.push(cPathSizes);
        var cPathSizesBase = cPathSizes >> 2;

        var clipperPaths = [];
        for (var i = 0; i < cNumPaths; ++i) {
            var pathSize = Module.HEAPU32[cPathSizesBase + i];
            var cPath = Module.HEAPU32[cPathsBase + i];
            memoryBlocks.push(cPath);
            if (cPath & 4)
                cPath += 4;
            var pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);

            var clipperPath = [];
            clipperPaths.push(clipperPath);
            for (var j = 0; j < pathSize; ++j)
                clipperPath.push({
                    X: pathArray[j * 2] / clipperToCppScale,
                    Y: pathArray[j * 2 + 1] / clipperToCppScale,
                });
        }

        return clipperPaths;
    }

    function cPathsToCamPaths(memoryBlocks, cPathsRef, cNumPathsRef, cPathSizesRef) {
        var cPaths = Module.HEAPU32[cPathsRef >> 2];
        memoryBlocks.push(cPaths);
        var cPathsBase = cPaths >> 2;

        var cNumPaths = Module.HEAPU32[cNumPathsRef >> 2];

        var cPathSizes = Module.HEAPU32[cPathSizesRef >> 2];
        memoryBlocks.push(cPathSizes);
        var cPathSizesBase = cPathSizes >> 2;

        var convertedPaths = [];
        for (var i = 0; i < cNumPaths; ++i) {
            var pathSize = Module.HEAPU32[cPathSizesBase + i];
            var cPath = Module.HEAPU32[cPathsBase + i];
            memoryBlocks.push(cPath);
            if (cPath & 4)
                cPath += 4;
            var pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);

            var convertedPath = [];
            convertedPaths.push({ path: convertedPath, safeToClose: false });
            for (var j = 0; j < pathSize; ++j)
                convertedPath.push({
                    X: pathArray[j * 3] / clipperToCppScale,
                    Y: pathArray[j * 3 + 1] / clipperToCppScale,
                    Z: pathArray[j * 3 + 2] / clipperToCppScale,
                });
        }

        return convertedPaths;
    }

    function clipperBounds(paths) {
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE;
        for (var path of paths) {
            for (var pt of path) {
                minX = Math.min(minX, pt.X);
                maxX = Math.max(maxX, pt.X);
                minY = Math.min(minY, pt.Y);
                maxY = Math.max(maxY, pt.Y);
            }
        }
        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    }

    function clip(paths1, paths2, clipType) {
        var clipper = new ClipperLib.Clipper();
        clipper.AddPaths(paths1, ClipperLib.PolyType.ptSubject, true);
        clipper.AddPaths(paths2, ClipperLib.PolyType.ptClip, true);
        var result = [];
        clipper.Execute(clipType, result, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
        return result;
    }

    function union(paths1, paths2) {
        return clip(paths1, paths2, ClipperLib.ClipType.ctUnion);
    }

    function diff(paths1, paths2) {
        return clip(paths1, paths2, ClipperLib.ClipType.ctDifference);
    }

    function xor(paths1, paths2) {
        return clip(paths1, paths2, ClipperLib.ClipType.ctXor);
    }

    function offset(paths, amount, joinType, endType) {
        if (joinType === undefined)
            joinType = ClipperLib.JoinType.jtRound;
        if (endType === undefined)
            endType = ClipperLib.EndType.etClosedPolygon;

        // bug workaround: join types are swapped in ClipperLib 6.1.3.2
        if (joinType === ClipperLib.JoinType.jtSquare)
            joinType = ClipperLib.JoinType.jtMiter;
        else if (joinType === ClipperLib.JoinType.jtMiter)
            joinType = ClipperLib.JoinType.jtSquare;

        var co = new ClipperLib.ClipperOffset(2, arcTolerance);
        co.AddPaths(paths, joinType, endType);
        var offsetted = [];
        co.Execute(offsetted, amount);
        return offsetted;
    }

    window.LW = window.LW || {};
    window.LW.mesh = {
        inchToClipperScale: inchToClipperScale,
        mmToClipperScale: mmToClipperScale,
        clipperToCppScale: clipperToCppScale,
        cleanPolyDist: cleanPolyDist,
        arcTolerance: arcTolerance,
        linearizeCubicBezier: linearizeCubicBezier,
        elementToRawPaths: elementToRawPaths,
        pathStrToRawPaths: pathStrToRawPaths,
        flipY: flipY,
        hasClosedRawPaths: hasClosedRawPaths,
        filterClosedRawPaths: filterClosedRawPaths,
        rawPathsToClipperPaths: rawPathsToClipperPaths,
        triangulateRawPaths: triangulateRawPaths,
        clipperPathsToCPaths: clipperPathsToCPaths,
        cPathsToClipperPaths: cPathsToClipperPaths,
        cPathsToCamPaths: cPathsToCamPaths,
        clipperBounds: clipperBounds,
        clip: clip,
        union: union,
        diff: diff,
        xor: xor,
        offset: offset
    };

})();
