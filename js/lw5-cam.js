// Copyright 2014, 2016 Todd Fleming
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

'use strict';

window.LW = window.LW || {};
window.LW.cam = {};

(function () {
    var ClipperLib = window.ClipperLib;
    var mesh = window.LW.mesh;

    // Inline mat3/vec2 replacements (avoid gl-matrix dependency)
    function mat3_fromTranslation(m, v) {
        m[0]=1; m[1]=0; m[2]=0; m[3]=0; m[4]=1; m[5]=0; m[6]=v[0]; m[7]=v[1]; m[8]=1;
        return m;
    }
    function mat3_rotate(m, rad) {
        var s=Math.sin(rad), c=Math.cos(rad);
        var m0=m[0], m1=m[1], m2=m[2], m3=m[3], m4=m[4], m5=m[5];
        m[0]=m0*c+m3*s; m[1]=m1*c+m4*s; m[2]=m2*c+m5*s;
        m[3]=-m0*s+m3*c; m[4]=-m1*s+m4*c; m[5]=-m2*s+m5*c;
        return m;
    }
    function mat3_translate(m, v) {
        m[6] += m[0]*v[0] + m[3]*v[1];
        m[7] += m[1]*v[0] + m[4]*v[1];
        m[8] += m[2]*v[0] + m[5]*v[1];
        return m;
    }
    function vec2_transformMat3(out, v, m) {
        var x=v[0], y=v[1];
        out[0] = m[0]*x + m[3]*y + m[6];
        out[1] = m[1]*x + m[4]*y + m[7];
        return out;
    }

    function dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

    function crosses(bounds, p1, p2) {
        if (bounds === null)
            return true;
        if (p1.X === p2.X && p1.Y === p2.Y)
            return false;
        var clipper = new ClipperLib.Clipper();
        clipper.AddPath([p1, p2], ClipperLib.PolyType.ptSubject, false);
        clipper.AddPaths(bounds, ClipperLib.PolyType.ptClip, true);
        var result = new ClipperLib.PolyTree();
        clipper.Execute(ClipperLib.ClipType.ctIntersection, result, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
        if (result.ChildCount() === 1) {
            var child = result.Childs()[0];
            var points = child.Contour();
            if (points.length === 2) {
                if (points[0].X === p1.X && points[1].X === p2.X && points[0].Y === p1.Y && points[1].Y === p2.Y)
                    return false;
                if (points[0].X === p2.X && points[1].X === p1.X && points[0].Y === p2.Y && points[1].Y === p1.Y)
                    return false;
            }
        }
        return true;
    }

    function pathIsClosed(clipperPath) {
        return (
            clipperPath.length >= 2 &&
            clipperPath[0].X === clipperPath[clipperPath.length - 1].X &&
            clipperPath[0].Y === clipperPath[clipperPath.length - 1].Y);
    }

    function closeClipperPaths(paths) {
        for (var i = 0; i < paths.length; ++i)
            paths[i].push(paths[i][0]);
    }

    function mergePaths(bounds, paths) {
        if (paths.length === 0)
            return [];

        var currentPath = paths[0];
        if (pathIsClosed(currentPath))
            currentPath.push(currentPath[0]);
        var currentPoint = currentPath[currentPath.length - 1];
        paths[0] = [];

        var mergedPaths = [];
        var numLeft = paths.length - 1;
        while (numLeft > 0) {
            var closestPathIndex = null;
            var closestPointIndex = null;
            var closestPointDist = null;
            var closestReverse = false;
            for (var pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
                var path = paths[pathIndex];
                function check(pointIndex) {
                    var point = path[pointIndex];
                    var d = (currentPoint.X - point.X) * (currentPoint.X - point.X) + (currentPoint.Y - point.Y) * (currentPoint.Y - point.Y);
                    if (closestPointDist === null || d < closestPointDist) {
                        closestPathIndex = pathIndex;
                        closestPointIndex = pointIndex;
                        closestPointDist = d;
                        closestReverse = false;
                        return true;
                    }
                    else
                        return false;
                }
                if (pathIsClosed(path)) {
                    for (var pointIndex = 0; pointIndex < path.length; ++pointIndex)
                        check(pointIndex);
                } else if (path.length) {
                    check(0);
                    if (check(path.length - 1))
                        closestReverse = true;
                }
            }

            var path = paths[closestPathIndex];
            paths[closestPathIndex] = [];
            numLeft -= 1;
            var needNew;
            if (pathIsClosed(path)) {
                needNew = crosses(bounds, currentPoint, path[closestPointIndex]);
                path = path.slice(closestPointIndex, path.length).concat(path.slice(1, closestPointIndex));
                path.push(path[0]);
            } else {
                needNew = true;
                if (closestReverse) {
                    path = path.slice();
                    path.reverse();
                }
            }
            if (needNew) {
                mergedPaths.push(currentPath);
                currentPath = path;
                currentPoint = currentPath[currentPath.length - 1];
            }
            else {
                currentPath = currentPath.concat(path);
                currentPoint = currentPath[currentPath.length - 1];
            }
        }
        mergedPaths.push(currentPath);

        var camPaths = [];
        for (var i = 0; i < mergedPaths.length; ++i) {
            var p = mergedPaths[i];
            camPaths.push({
                path: p,
                safeToClose: !crosses(bounds, p[0], p[p.length - 1])
            });
        }

        return camPaths;
    }

    function pocket(geometry, cutterDia, stepover, climb) {
        stepover = stepover / 100;
        var current = mesh.offset(geometry, -cutterDia / 2);
        var bounds = current.slice(0);
        var allPaths = [];
        while (current.length !== 0) {
            if (!climb)
                for (var i = 0; i < current.length; ++i)
                    current[i].reverse();
            allPaths = current.concat(allPaths);
            current = mesh.offset(current, -cutterDia * stepover);
        }
        closeClipperPaths(allPaths);
        return mergePaths(bounds, allPaths);
    }

    function insideOutside(geometry, cutterDia, isInside, width, stepover, climb, allowRecutInBounds) {
        stepover = stepover / 100;
        width = Math.max(width, cutterDia);

        var currentWidth = cutterDia;
        var allPaths = [];
        var eachWidth = cutterDia * stepover;

        var current;
        var bounds = null;
        var eachOffset;
        var needReverse;

        if (isInside) {
            current = mesh.offset(geometry, -cutterDia / 2);
            if (allowRecutInBounds)
                bounds = mesh.diff(current, mesh.offset(geometry, -(width - cutterDia / 2)));
            eachOffset = -eachWidth;
            needReverse = !climb;
        } else {
            current = mesh.offset(geometry, cutterDia / 2);
            if (allowRecutInBounds)
                bounds = mesh.diff(mesh.offset(geometry, width - cutterDia / 2), current);
            eachOffset = eachWidth;
            needReverse = climb;
        }

        while (currentWidth <= width) {
            if (needReverse)
                for (var i = 0; i < current.length; ++i)
                    current[i].reverse();
            allPaths = current.concat(allPaths);
            var nextWidth = currentWidth + eachWidth;
            if (nextWidth > width && width - currentWidth > 0) {
                current = mesh.offset(current, width - currentWidth);
                if (needReverse)
                    for (var i = 0; i < current.length; ++i)
                        current[i].reverse();
                allPaths = current.concat(allPaths);
                break;
            }
            currentWidth = nextWidth;
            if (currentWidth <= width)
                current = mesh.offset(current, eachOffset);
        }
        closeClipperPaths(allPaths);
        return mergePaths(bounds, allPaths);
    }

    function cut(geometry, openGeometry, climb) {
        var allPaths = [];
        for (var i = 0; i < geometry.length; ++i) {
            var path = geometry[i].slice(0);
            if (climb)
                path.reverse();
            path.push(path[0]);
            allPaths.push(path);
        }
        for (var i = 0; i < openGeometry.length; ++i)
            allPaths.push(openGeometry[i].slice());
        var result = mergePaths(null, allPaths);
        for (var i = 0; i < result.length; ++i)
            result[i].safeToClose = pathIsClosed(result[i].path);
        return result;
    }

    function fillPath(geometry, lineDistance, angle) {
        if (!geometry.length || !geometry[0].length)
            return [];
        var bounds = mesh.clipperBounds(geometry);
        var cx = (bounds.minX + bounds.maxX) / 2;
        var cy = (bounds.minY + bounds.maxY) / 2;
        var r = dist(cx, cy, bounds.minX, bounds.minY) + lineDistance;

        var m = mat3_fromTranslation([], [cx, cy]);
        m = mat3_rotate(m, angle * Math.PI / 180);
        m = mat3_translate(m, [-cx, -cy]);
        var makePoint = function (x, y) {
            var p = vec2_transformMat3([], [x, y], m);
            return { X: p[0], Y: p[1] };
        };

        var scan = [];
        for (var y = cy - r; y < cy + r; y += lineDistance * 2) {
            scan.push(
                makePoint(cx - r, y),
                makePoint(cx + r, y),
                makePoint(cx + r, y + lineDistance),
                makePoint(cx - r, y + lineDistance)
            );
        }

        var allPaths = [];
        var separated = separateTabs(scan, geometry);
        for (var i = 1; i < separated.length; i += 2)
            allPaths.push(separated[i]);
        return mergePaths(null, allPaths);
    }

    function vCarve(geometry, cutterAngle, passDepth) {
        if (cutterAngle <= 0 || cutterAngle >= 180)
            return [];
        if (typeof Module === 'undefined') {
            if (!window.displayedCppVCarveError) {
                (showAlert || function (m) { console.warn(m); })("Failed to load cam-cpp.js; V-Carve unavailable. This message will not repeat.", "danger", false);
                window.displayedCppVCarveError = true;
            }
            return [];
        }

        var memoryBlocks = [];
        var cGeometry = mesh.clipperPathsToCPaths(memoryBlocks, geometry);
        var resultPathsRef = Module._malloc(4);
        var resultNumPathsRef = Module._malloc(4);
        var resultPathSizesRef = Module._malloc(4);
        memoryBlocks.push(resultPathsRef);
        memoryBlocks.push(resultNumPathsRef);
        memoryBlocks.push(resultPathSizesRef);

        var debugArg0 = 0, debugArg1 = 0;

        Module.ccall(
            'vCarve',
            'void', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
            [
                debugArg0, debugArg1, cGeometry[0], cGeometry[1], cGeometry[2],
                cutterAngle, passDepth * mesh.clipperToCppScale,
                resultPathsRef, resultNumPathsRef, resultPathSizesRef
            ]);

        var result = mesh.cPathsToCamPaths(memoryBlocks, resultPathsRef, resultNumPathsRef, resultPathSizesRef);

        for (var i = 0; i < memoryBlocks.length; ++i)
            Module._free(memoryBlocks[i]);

        return result;
    }

    function reduceCamPaths(camPaths, minDist) {
        if (!(minDist > 0)) return;
        var minDistSqr = minDist * minDist;
        var distSqr = function (p1, p2) { return (p1.X - p2.X) * (p1.X - p2.X) + (p1.Y - p2.Y) * (p1.Y - p2.Y); };
        for (var i = 0; i < camPaths.length; ++i) {
            var camPath = camPaths[i];
            var path = camPath.path;
            var newPath = [path[0]];
            for (var j = 1; j < path.length - 1; ++j) {
                var sq = distSqr(path[j], newPath[newPath.length - 1]);
                if (sq > 0 && sq >= minDistSqr)
                    newPath.push(path[j]);
            }
            newPath.push(path[path.length - 1]);
            camPath.path = newPath;
        }
    }

    function getClipperPathsFromCamPaths(paths) {
        var result = [];
        if (paths !== null)
            for (var i = 0; i < paths.length; ++i)
                result.push(paths[i].path);
        return result;
    }

    var displayedCppTabError1 = false;
    var displayedCppTabError2 = false;

    function separateTabs(cutterPath, tabGeometry) {
        if (tabGeometry.length === 0)
            return [cutterPath];
        if (typeof Module === 'undefined') {
            if (!displayedCppTabError1) {
                showAlert("Failed to load cam-cpp.js; tabs will be missing. This message will not repeat.", "danger", false);
                displayedCppTabError1 = true;
            }
            return [cutterPath];
        }

        var memoryBlocks = [];

        var cCutterPath = mesh.clipperPathsToCPaths(memoryBlocks, [cutterPath]);
        var cTabGeometry = mesh.clipperPathsToCPaths(memoryBlocks, tabGeometry);

        var errorRef = Module._malloc(4);
        var resultPathsRef = Module._malloc(4);
        var resultNumPathsRef = Module._malloc(4);
        var resultPathSizesRef = Module._malloc(4);
        memoryBlocks.push(errorRef);
        memoryBlocks.push(resultPathsRef);
        memoryBlocks.push(resultNumPathsRef);
        memoryBlocks.push(resultPathSizesRef);

        Module.ccall(
            'separateTabs',
            'void', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
            [cCutterPath[0], cCutterPath[1], cCutterPath[2], cTabGeometry[0], cTabGeometry[1], cTabGeometry[2], errorRef, resultPathsRef, resultNumPathsRef, resultPathSizesRef]);

        if (Module.HEAPU32[errorRef >> 2] && !displayedCppTabError2) {
            showAlert("Internal error processing tabs; tabs will be missing. This message will not repeat.", "danger", false);
            displayedCppTabError2 = true;
        }

        var result = mesh.cPathsToClipperPaths(memoryBlocks, resultPathsRef, resultNumPathsRef, resultPathSizesRef);

        for (var i = 0; i < memoryBlocks.length; ++i)
            Module._free(memoryBlocks[i]);

        return result;
    }

    window.LW.cam.dist = dist;
    window.LW.cam.crosses = crosses;
    window.LW.cam.pathIsClosed = pathIsClosed;
    window.LW.cam.closeClipperPaths = closeClipperPaths;
    window.LW.cam.mergePaths = mergePaths;
    window.LW.cam.pocket = pocket;
    window.LW.cam.insideOutside = insideOutside;
    window.LW.cam.cut = cut;
    window.LW.cam.fillPath = fillPath;
    window.LW.cam.vCarve = vCarve;
    window.LW.cam.reduceCamPaths = reduceCamPaths;
    window.LW.cam.getClipperPathsFromCamPaths = getClipperPathsFromCamPaths;
    window.LW.cam.separateTabs = separateTabs;
})();
