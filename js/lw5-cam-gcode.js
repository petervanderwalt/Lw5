(function (window) {
    'use strict';

    if (!window.LW) window.LW = {};
    var LW = window.LW;

    if (!window.hhmmss) {
        window.hhmmss = function (s) {
            var h = Math.floor(s / 3600);
            var m = Math.floor((s % 3600) / 60);
            var sec = Math.floor(s % 60);
            return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
        };
    }
    var hhmmss = window.hhmmss;

    function getBlobWorker(code) {
        var blob = new Blob([code]);
        return new Worker(URL.createObjectURL(blob));
    }

    function sendAsFile(filename, data, mimetype) {
        if (!mimetype) mimetype = 'text/plain;charset=utf-8';
        var blob = new Blob([data], { type: mimetype });
        var tempLink = document.createElement('a');
        tempLink.href = window.URL.createObjectURL(blob);
        tempLink.setAttribute('download', filename);
        tempLink.click();
    }

    function appendExt(filename, ext) {
        var escaped = ext.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp(escaped + '$', 'i');
        return re.test(filename) ? filename : filename + ext;
    }

    function openDataWindow(data, mimetype, target) {
        if (!mimetype) mimetype = 'text/plain;charset=utf-8';
        if (!target) target = 'data';
        var blob = new Blob([data], { type: mimetype });
        var reader = new FileReader();
        reader.onloadend = function (e) {
            window.open(reader.result, target);
        };
        reader.readAsDataURL(blob);
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
    }

    function deepMerge(target, source) {
        var output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(function (key) {
                if (isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = deepMerge(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    function getDescendantProp(obj, desc) {
        var arr = desc.split('.');
        while (arr.length && (obj = obj[arr.shift()])) { }
        return obj;
    }

    function cast(value, def) {
        if (def === undefined) def = '';
        if (value === undefined) return def;
        if (value === false) return 'No';
        if (value === true) return 'Yes';
        if (isObject(value)) return JSON.stringify(value);
        return String(value);
    }

    function clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

    function captureConsole() {
        window.__capture = window.console;
        var captures = [];
        window.console = {
            log: function () { captures.push({ method: 'log', args: Array.prototype.slice.call(arguments) }); },
            warn: function () { captures.push({ method: 'warn', args: Array.prototype.slice.call(arguments) }); },
            error: function () { captures.push({ method: 'error', args: Array.prototype.slice.call(arguments) }); },
            info: function () { captures.push({ method: 'info', args: Array.prototype.slice.call(arguments) }); }
        };
        return function (keys) {
            window.console = window.__capture;
            if (keys === true) keys = ['log', 'warn', 'error', 'info'];
            if (keys && keys.length) {
                captures.forEach(function (item) {
                    if (keys.indexOf(item.method) !== -1) {
                        window.console[item.method].apply(null, item.args);
                    }
                });
            }
            return captures;
        };
    }

    var strtr = function (str, reps) {
        Object.entries(reps).forEach(function (entry) {
            str = str.replace(entry[0], entry[1]);
        });
        return str;
    };

    function objectHasMatchingFields(obj, fields) {
        for (var key in fields) {
            if (fields.hasOwnProperty(key) && obj[key] !== fields[key])
                return false;
        }
        return true;
    }

    function sameArrayContent(a, b) {
        return a.length === b.length && a.every(function (v, i) { return v === b[i]; });
    }

    function AbstractGenerator(settings) {
        this.settings = settings;
    }
    AbstractGenerator.prototype.postProcessRaster = function (gcode) {
        if (this.settings.gcodeToolOn && this.settings.gcodeToolOff) {
            gcode = gcode.replace(/G0([\s\S]*?)G1/gi, 'G0$1\n' + this.settings.gcodeToolOn + '\nG1');
            gcode = gcode.replace(/G1([\s\S]*?)G0/gi, 'G1$1\n' + this.settings.gcodeToolOff + '\nG0');
            return gcode;
        }
        return gcode;
    };

    function DefaultGenerator(settings) {
        AbstractGenerator.call(this, settings);
    }
    DefaultGenerator.prototype = Object.create(AbstractGenerator.prototype);
    DefaultGenerator.prototype.constructor = DefaultGenerator;
    DefaultGenerator.prototype.moveRapid = function (params, optimized) {
        if (params == null) return '';
        var gcode = '';
        if (!optimized) gcode += 'G0 ';
        gcode += this.move(params);
        return gcode;
    };
    DefaultGenerator.prototype.moveTool = function (params, optimized) {
        if (params == null) return '';
        var gcode = '';
        if (!optimized) gcode += 'G1 ';
        gcode += this.move(params);
        return gcode;
    };
    DefaultGenerator.prototype.toolOn = function (gcode, params) {
        if (gcode == null) return '';
        if (params && params.hasOwnProperty('i'))
            gcode = gcode.split('$INTENSITY').join(params.i);
        return gcode;
    };
    DefaultGenerator.prototype.toolOff = function (gcode, params) {
        if (gcode == null) return '';
        if (params && params.hasOwnProperty('i'))
            gcode = gcode.split('$INTENSITY').join(params.i);
        return gcode;
    };
    DefaultGenerator.prototype.move = function (params) {
        var gcode = '';
        if (params.hasOwnProperty('x')) gcode += ' X' + params.x;
        if (params.hasOwnProperty('y')) gcode += ' Y' + params.y;
        if (params.hasOwnProperty('a')) gcode += ' A' + params.a;
        if (params.hasOwnProperty('i')) gcode += ' ' + params.i;
        if (params.hasOwnProperty('s')) gcode += ' S' + params.s;
        if (params.hasOwnProperty('f')) gcode += ' F' + params.f;
        return gcode.trim();
    };

    function MarlinGenerator(settings) {
        AbstractGenerator.call(this, settings);
    }
    MarlinGenerator.prototype = Object.create(AbstractGenerator.prototype);
    MarlinGenerator.prototype.constructor = MarlinGenerator;
    MarlinGenerator.prototype.moveRapid = function (params) {
        if (params == null) return '';
        return this.move('G0', params);
    };
    MarlinGenerator.prototype.moveTool = function (params) {
        if (params == null) return '';
        return this.move('G1', params);
    };
    MarlinGenerator.prototype.toolOn = function (gcode, params) {
        if (gcode == null) return '';
        if (params && params.hasOwnProperty('i'))
            gcode = gcode.split('$INTENSITY').join(params.i);
        return gcode;
    };
    MarlinGenerator.prototype.toolOff = function (gcode, params) {
        if (gcode == null) return '';
        if (params && params.hasOwnProperty('i'))
            gcode = gcode.split('$INTENSITY').join(params.i);
        return gcode;
    };
    MarlinGenerator.prototype.move = function (prefix, params) {
        var gcode = '';
        if (params.hasOwnProperty('s')) {
            if (this.settings.gcodeToolOn.indexOf('$INTENSITY') > -1) {
                gcode += this.settings.gcodeToolOn.split('$INTENSITY').join(this.settings.gcodeLaserIntensity + params.s) + '\r\n';
            } else {
                gcode += this.settings.gcodeToolOn + ' S' + params.s + '\r\n';
            }
        }
        if (params.hasOwnProperty('i')) {
            if (this.settings.gcodeToolOn.indexOf('$INTENSITY') > -1) {
                gcode += this.settings.gcodeToolOn.split('$INTENSITY').join(params.i) + '\r\n';
            } else {
                gcode += this.settings.gcodeToolOn + ' ' + params.i + '\r\n';
            }
        }
        gcode += prefix;
        if (params.hasOwnProperty('x')) gcode += ' X' + params.x;
        if (params.hasOwnProperty('y')) gcode += ' Y' + params.y;
        if (params.hasOwnProperty('a')) gcode += ' A' + params.a;
        if (params.hasOwnProperty('f')) gcode += ' F' + params.f;
        return gcode.trim();
    };

    function getGenerator(gcodeGenerator, settings) {
        switch (gcodeGenerator) {
            case 'marlin':
                return new MarlinGenerator(settings);
            case 'default':
            default:
                return new DefaultGenerator(settings);
        }
    }

    function parseGcode(gcode) {
        var path = [];
        var lastG = NaN, lastX = NaN, lastY = NaN, lastZ = NaN, lastA = NaN, lastF = NaN, lastS = 0, lastT = 0;
        var stride = 9;
        var i = 0;
        while (i < gcode.length) {
            function parse() {
                ++i;
                while (i < gcode.length && (gcode[i] === ' ' || gcode[i] === '\t'))
                    ++i;
                var begin = i;
                while (i < gcode.length && '+-.0123456789'.indexOf(gcode[i]) !== -1)
                    ++i;
                return Number(gcode.substr(begin, i - begin));
            }
            var g = NaN, x = NaN, y = NaN, z = NaN, a = NaN, f = NaN;
            while (i < gcode.length && gcode[i] !== ';' && gcode[i] !== '\r' && gcode[i] !== '\n') {
                if (gcode[i] === 'G' || gcode[i] === 'g')
                    g = parse();
                else if (gcode[i] === 'X' || gcode[i] === 'x')
                    x = parse();
                else if (gcode[i] === 'Y' || gcode[i] === 'y')
                    y = parse();
                else if (gcode[i] === 'Z' || gcode[i] === 'z')
                    z = parse();
                else if (gcode[i] === 'A' || gcode[i] === 'a')
                    a = parse();
                else if (gcode[i] === 'F' || gcode[i] === 'f')
                    f = parse();
                else if (gcode[i] === 'S' || gcode[i] === 's')
                    lastS = parse();
                else if (gcode[i] === 'T' || gcode[i] === 't')
                    lastT = parse();
                else
                    ++i;
            }
            if (g === 0 || g === 1 || !isNaN(x) || !isNaN(y) || !isNaN(z) || !isNaN(a)) {
                if (g === 0 || g === 1)
                    lastG = g;
                if (!isNaN(x)) {
                    if (isNaN(lastX))
                        for (var j = 1; j < path.length; j += stride)
                            path[j] = x;
                    lastX = x;
                }
                if (!isNaN(y)) {
                    if (isNaN(lastY))
                        for (var j = 2; j < path.length; j += stride)
                            path[j] = y;
                    lastY = y;
                }
                if (!isNaN(z)) {
                    if (isNaN(lastZ))
                        for (var j = 3; j < path.length; j += stride)
                            path[j] = z;
                    lastZ = z;
                }
                if (!isNaN(a)) {
                    if (isNaN(lastA))
                        for (var j = 6; j < path.length; j += stride)
                            path[j] = a;
                    lastA = a;
                }
                if (!isNaN(f)) {
                    if (isNaN(lastF))
                        for (var j = 4; j < path.length; j += stride)
                            path[j] = f;
                    lastF = f;
                }
                if (!isNaN(lastG)) {
                    path.push(lastG);
                    path.push(lastX);
                    path.push(lastY);
                    path.push(lastZ);
                    path.push(0);
                    path.push(lastF);
                    path.push(lastA);
                    path.push(lastS);
                    path.push(lastT);
                }
            }
            while (i < gcode.length && gcode[i] !== '\r' && gcode[i] !== '\n')
                ++i;
            while (i < gcode.length && (gcode[i] === '\r' || gcode[i] === '\n'))
                ++i;
        }
        if (isNaN(lastX))
            for (var j = 1; j < path.length; j += stride)
                path[j] = 0;
        if (isNaN(lastY))
            for (var j = 2; j < path.length; j += stride)
                path[j] = 0;
        if (isNaN(lastZ))
            for (var j = 3; j < path.length; j += stride)
                path[j] = 0;
        if (isNaN(lastF))
            for (var j = 4; j < path.length; j += stride)
                path[j] = 1000;
        if (isNaN(lastA))
            for (var j = 6; j < path.length; j += stride)
                path[j] = 0;
        return path;
    }

    function expandHookGCode(operation) {
        var state = LW.getState ? LW.getState() : (LW.State ? LW.State.getState() : {});
        var settings = state.settings || {};
        var macros = settings.macros || {};
        var op = Object.assign({}, operation);
        var hooks = Object.keys(op).filter(function (i) { return i.match(/^hook/gi); });
        hooks.forEach(function (hook) {
            var keys = op[hook].split(',');
            var gcode = '';
            if (keys.length) {
                keys.forEach(function (key) {
                    if (macros[key])
                        gcode += '\r\n; Macro [' + hook + ']: ' + macros[key].label + '\r\n' + macros[key].gcode + '\r\n';
                });
            }
            op[hook] = gcode;
        });
        return op;
    }

    function getLaserCutGcode(props) {
        var paths = props.paths, generator = props.generator, scale = props.scale;
        var offsetX = props.offsetX, offsetY = props.offsetY, decimal = props.decimal;
        var cutFeed = props.cutFeed, laserPower = props.laserPower, passes = props.passes;
        var useA = props.useA, aAxisDiameter = props.aAxisDiameter;
        var tabGeometry = props.tabGeometry, gcodeToolOn = props.gcodeToolOn, gcodeToolOff = props.gcodeToolOff;
        var gcodeLaserIntensity = props.gcodeLaserIntensity;
        var gcodeLaserIntensitySeparateLine = props.gcodeLaserIntensitySeparateLine;
        var gcodeSMinValue = props.gcodeSMinValue, gcodeSMaxValue = props.gcodeSMaxValue;
        var useZ = props.useZ, useBlower = props.useBlower;
        var hookPassStart = props.hookPassStart, hookPassEnd = props.hookPassEnd;

        if (gcodeToolOn) gcodeToolOn += '\r\n';
        if (gcodeToolOff) gcodeToolOff += '\r\n';
        var laserOnS = gcodeLaserIntensity + (gcodeSMinValue + (gcodeSMaxValue - gcodeSMinValue) * laserPower / 100).toFixed(decimal);

        var lastX = 0, lastY = 0, lastA = 0;
        function convertPoint(p, rapid) {
            var x = p.X * scale + offsetX;
            var y = p.Y * scale + offsetY;
            if (useA) {
                var a = y * 360 / aAxisDiameter / Math.PI;
                var roundedX = Number(x.toFixed(decimal));
                var roundedA = Number(a.toFixed(decimal));
                var adjustedY = roundedA * aAxisDiameter * Math.PI / 360;
                if (rapid) {
                    lastX = roundedX;
                    lastY = adjustedY;
                    lastA = roundedA;
                    return { x: x.toFixed(decimal), a: a.toFixed(decimal) };
                } else {
                    var dx = roundedX - lastX, dy = adjustedY - lastY, da = roundedA - lastA;
                    var travelTime = Math.sqrt(dx * dx + dy * dy) / cutFeed;
                    var f = 0;
                    if (dx) f = Math.abs(dx) / travelTime;
                    else if (da) f = Math.abs(da) / travelTime;
                    else return null;
                    lastX = roundedX;
                    lastY = adjustedY;
                    lastA = roundedA;
                    return { x: x.toFixed(decimal), a: a.toFixed(decimal), f: f.toFixed(decimal) };
                }
            } else {
                return { x: x.toFixed(decimal), y: y.toFixed(decimal) };
            }
        }

        var gcode = '';
        var mesh = LW.mesh;
        var cam = LW.cam;

        for (var pass = 0; pass < passes; ++pass) {
            if (hookPassStart) gcode += hookPassStart;
            gcode += '\n\n; Pass ' + pass + '\r\n';

            if (useBlower && useBlower.blowerOn) {
                gcode += '\r\n ' + useBlower.blowerOn + '; Enable Air assist\r\n';
            }

            var usedZposition = false;
            for (var pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
                var path = paths[pathIndex].path;
                if (path.length === 0) continue;
                gcode += '\r\n; Pass ' + pass + ' Path ' + pathIndex + '\r\n';
                var separatedPaths = cam.separateTabs(path, tabGeometry);
                for (var selectedIndex = 0; selectedIndex < separatedPaths.length; ++selectedIndex) {
                    var selectedPath = separatedPaths[selectedIndex];
                    if (selectedPath.length === 0) continue;
                    if (selectedIndex & 1) {
                        gcode += '; Skip tab\r\n';
                        continue;
                    }
                    gcode += generator.moveRapid(convertPoint(selectedPath[0], true)) + '\r\n';

                    if (useZ && !usedZposition) {
                        usedZposition = true;
                        var zHeight = useZ.startZ + useZ.offsetZ - (useZ.passDepth * pass);
                        gcode += '; Pass Z Height ' + zHeight + 'mm (Offset: ' + useZ.offsetZ + 'mm)\r\n';
                        gcode += 'G0 Z' + zHeight.toFixed(decimal) + '\r\n\r\n';
                    }

                    gcode += generator.toolOn(gcodeToolOn, { i: laserOnS });

                    for (var i = 1; i < selectedPath.length; ++i) {
                        if (i === 1 && gcodeLaserIntensitySeparateLine)
                            gcode += laserOnS + '\n';
                        var action = convertPoint(selectedPath[i], false);
                        if (i === 1 && !gcodeLaserIntensitySeparateLine)
                            action.i = laserOnS;
                        if (i === 1 && !useA)
                            action.f = cutFeed;
                        gcode += generator.moveTool(action);
                        gcode += '\r\n';
                    }

                    gcode += generator.toolOff(gcodeToolOff, { i: laserOnS });
                }
            }

            if (useBlower && useBlower.blowerOff) {
                gcode += '\r\n ' + useBlower.blowerOff + '; Disable Air assist\r\n';
            }
            if (hookPassEnd) gcode += hookPassEnd;
        }
        return gcode;
    }

    function getLaserCutGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress) {
        var ok = true;
        var mesh = LW.mesh;
        var cam = LW.cam;
        var mmToClipperScale = mesh.mmToClipperScale;

        if (op.type !== 'Laser Cut' && op.type !== 'Laser Fill Path') {
            if (op.laserDiameter <= 0) {
                showAlert('Laser Diameter must be greater than 0', 'danger');
                ok = false;
            }
        }
        if (op.type === 'Laser Fill Path') {
            if (op.lineDistance <= 0) {
                showAlert('Line Distance must be greater than 0', 'danger');
                ok = false;
            }
        }
        if (op.laserPower < 0 || op.laserPower > 100) {
            showAlert('Laser Power must be in range [0, 100]', 'danger');
            ok = false;
        }
        if (op.passes <= 0 || (op.passes | 0) !== +op.passes) {
            showAlert('Passes must be integer > 0', 'danger');
            ok = false;
        }
        if (op.cutRate <= 0) {
            showAlert('Cut Rate must be greater than 0', 'danger');
            ok = false;
        }
        if (op.useA) {
            if (op.aAxisDiameter <= 0) {
                showAlert('A axis diameter must be greater than 0', 'danger');
                ok = false;
            }
        }
        if (settings.machineZEnabled) {
            if (op.startHeight === '' || isNaN(op.startHeight)) {
                showAlert('Start Height must be a valid number', 'danger');
                ok = false;
            }
        }
        if (!ok) { done(false); return; }

        var camPaths = [];
        if (op.type === 'Laser Cut') {
            camPaths = cam.cut(geometry, openGeometry, false);
        } else if (op.type === 'Laser Cut Inside') {
            if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);
            camPaths = cam.insideOutside(geometry, op.laserDiameter * mmToClipperScale, true, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', false);
        } else if (op.type === 'Laser Cut Outside') {
            if (op.margin) geometry = mesh.offset(geometry, op.margin * mmToClipperScale);
            camPaths = cam.insideOutside(geometry, op.laserDiameter * mmToClipperScale, false, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', false);
        } else if (op.type === 'Laser Fill Path') {
            if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);
            camPaths = cam.fillPath(geometry, op.lineDistance * mmToClipperScale, op.lineAngle);
        }
        cam.reduceCamPaths(camPaths, op.segmentLength * mmToClipperScale);

        var feedScale = 1;
        if (settings.toolFeedUnits === 'mm/s') feedScale = 60;

        var gcode = '\r\n;' +
            '\r\n; Operation:    ' + opIndex +
            '\r\n; Type:         ' + op.type +
            '\r\n; Paths:        ' + camPaths.length +
            '\r\n; Passes:       ' + op.passes +
            '\r\n; Cut rate:     ' + op.cutRate + ' ' + settings.toolFeedUnits +
            '\r\n;\r\n';

        if (op.hookOperationStart && op.hookOperationStart.length) gcode += op.hookOperationStart;

        var generator = getGenerator(settings.gcodeGenerator, settings);

        gcode += getLaserCutGcode({
            generator: generator,
            paths: camPaths,
            scale: 1 / mmToClipperScale,
            offsetX: 0,
            offsetY: 0,
            decimal: 2,
            cutFeed: op.cutRate * feedScale,
            laserPower: op.laserPower,
            passes: op.passes,
            useA: op.useA,
            useZ: settings.machineZEnabled ? {
                startZ: Number(op.startHeight),
                offsetZ: settings.machineZToolOffset,
                passDepth: op.passDepth
            } : false,
            useBlower: op.useBlower ? {
                blowerOn: settings.machineBlowerGcodeOn,
                blowerOff: settings.machineBlowerGcodeOff
            } : false,
            aAxisDiameter: op.aAxisDiameter,
            tabGeometry: tabGeometry,
            gcodeToolOn: settings.gcodeToolOn,
            gcodeToolOff: settings.gcodeToolOff,
            gcodeLaserIntensity: settings.gcodeLaserIntensity,
            gcodeLaserIntensitySeparateLine: settings.gcodeLaserIntensitySeparateLine,
            gcodeSMinValue: settings.gcodeSMinValue,
            gcodeSMaxValue: settings.gcodeSMaxValue,
            hookPassStart: op.hookPassStart,
            hookPassEnd: op.hookPassEnd
        });

        if (op.hookOperationEnd && op.hookOperationEnd.length) gcode += op.hookOperationEnd;
        done(gcode);
    }

    function getMillGcode(props) {
        var paths = props.paths, ramp = props.ramp, scale = props.scale, useZ = props.useZ;
        var offsetX = props.offsetX, offsetY = props.offsetY, decimal = props.decimal;
        var topZ = props.topZ, botZ = props.botZ, safeZ = props.safeZ, passDepth = props.passDepth;
        var plungeFeed = props.plungeFeed, cutFeed = props.cutFeed;
        var tabGeometry = props.tabGeometry, tabZ = props.tabZ, toolSpeed = props.toolSpeed;

        var plungeFeedGcode = ' F' + plungeFeed;
        var cutFeedGcode = ' F' + cutFeed;

        if (useZ === undefined) useZ = false;
        if (tabGeometry === undefined || tabZ <= botZ) {
            tabGeometry = [];
            tabZ = botZ;
        }

        var retractGcode = '; Retract\r\nG0 Z' + safeZ.toFixed(decimal) + '\r\n';
        var retractForTabGcode = '; Retract for tab\r\nG0 Z' + tabZ.toFixed(decimal) + '\r\n';
        var gcode = retractGcode;
        var cam = LW.cam;

        function getX(p) { return p.X * scale + offsetX; }
        function getY(p) { return p.Y * scale + offsetY; }
        function convertPoint(p, useZCoord) {
            var result = ' X' + (p.X * scale + offsetX).toFixed(decimal) + ' Y' + (p.Y * scale + offsetY).toFixed(decimal);
            if (useZCoord) result += ' Z' + (p.Z * scale + topZ).toFixed(decimal);
            return result;
        }

        for (var pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
            var path = paths[pathIndex];
            var origPath = path.path;
            if (origPath.length === 0) continue;
            var separatedPaths = cam.separateTabs(origPath, tabGeometry);

            gcode += '\r\n' + '; Path ' + pathIndex + '\r\n';

            var currentZ = safeZ;
            var finishedZ = topZ;
            while (finishedZ > botZ || useZ) {
                var nextZ = Math.max(finishedZ - passDepth, botZ);
                if (currentZ < safeZ && (!path.safeToClose || tabGeometry.length > 0)) {
                    gcode += retractGcode;
                    currentZ = safeZ;
                }
                if (tabGeometry.length === 0) currentZ = finishedZ;
                else currentZ = Math.max(finishedZ, tabZ);

                gcode += '; Rapid to initial position\r\nG0' + convertPoint(origPath[0], false) + '\r\nG0 Z' + currentZ.toFixed(decimal) + '\r\n';

                var selectedPaths;
                if (nextZ >= tabZ || useZ) selectedPaths = [origPath];
                else selectedPaths = separatedPaths;

                for (var selectedIndex = 0; selectedIndex < selectedPaths.length; ++selectedIndex) {
                    var selectedPath = selectedPaths[selectedIndex];
                    if (selectedPath.length === 0) continue;

                    if (!useZ) {
                        var selectedZ;
                        if (selectedIndex & 1) selectedZ = tabZ;
                        else selectedZ = nextZ;

                        if (selectedZ < currentZ) {
                            var executedRamp = false;
                            if (ramp) {
                                var minPlungeTime = (currentZ - selectedZ) / plungeFeed;
                                var idealDist = cutFeed * minPlungeTime;
                                var end;
                                var totalDist = 0;
                                for (end = 1; end < selectedPath.length; ++end) {
                                    if (totalDist > idealDist) break;
                                    totalDist += 2 * cam.dist(getX(selectedPath[end - 1]), getY(selectedPath[end - 1]), getX(selectedPath[end]), getY(selectedPath[end]));
                                }
                                if (totalDist > 0) {
                                    gcode += '; ramp\r\n';
                                    executedRamp = true;
                                    var rampPath = selectedPath.slice(0, end).concat(selectedPath.slice(0, end - 1).reverse());
                                    var distTravelled = 0;
                                    for (var ri = 1; ri < rampPath.length; ++ri) {
                                        distTravelled += cam.dist(getX(rampPath[ri - 1]), getY(rampPath[ri - 1]), getX(rampPath[ri]), getY(rampPath[ri]));
                                        var newZ = currentZ + distTravelled / totalDist * (selectedZ - currentZ);
                                        gcode += 'G1' + convertPoint(rampPath[ri], false) + ' Z' + newZ.toFixed(decimal);
                                        if (ri === 1) {
                                            gcode += ' F' + Math.min(totalDist / minPlungeTime, cutFeed).toFixed(decimal);
                                            if (toolSpeed) gcode += ' S' + toolSpeed;
                                        }
                                        gcode += '\r\n';
                                    }
                                }
                            }
                            if (!executedRamp) {
                                gcode += '; plunge\r\nG1 Z' + selectedZ.toFixed(decimal) + plungeFeedGcode;
                                if (toolSpeed) gcode += ' S' + toolSpeed;
                                gcode += '\r\n';
                            }
                        } else if (selectedZ > currentZ) {
                            gcode += retractForTabGcode;
                        }
                        currentZ = selectedZ;
                    }

                    gcode += '; cut\r\n';
                    for (var i = 1; i < selectedPath.length; ++i) {
                        gcode += 'G1' + convertPoint(selectedPath[i], useZ);
                        if (i === 1) {
                            gcode += cutFeedGcode;
                            if (toolSpeed) gcode += ' S' + toolSpeed;
                        }
                        gcode += '\r\n';
                    }
                }
                finishedZ = nextZ;
                if (useZ) break;
            }
            gcode += retractGcode;
        }
        return gcode;
    }

    function getMillGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress) {
        var ok = true;
        var mesh = LW.mesh;
        var cam = LW.cam;
        var mmToClipperScale = mesh.mmToClipperScale;

        if (op.millStartZ > op.millRapidZ) {
            showAlert('millStartZ must be <= millRapidZ', 'danger');
            ok = false;
        }
        if (op.passDepth <= 0) {
            showAlert('Pass Depth must be greater than 0', 'danger');
            ok = false;
        }
        if (op.type === 'Mill V Carve') {
            if (op.toolAngle <= 0 || op.toolAngle >= 180) {
                showAlert('Tool Angle must be in range (0, 180)', 'danger');
                ok = false;
            }
        } else {
            if (op.millEndZ >= op.millStartZ) {
                showAlert('millEndZ must be < millStartZ', 'danger');
                ok = false;
            }
            if (op.type !== 'Mill Cut' && op.toolDiameter <= 0) {
                showAlert('Tool Diameter must be greater than 0', 'danger');
                ok = false;
            }
            if (op.stepOver <= 0 || op.stepOver > 100) {
                showAlert('Step Over must be in range 0-100%', 'danger');
                ok = false;
            }
        }
        if (op.plungeRate <= 0) {
            showAlert('Plunge Rate must be greater than 0', 'danger');
            ok = false;
        }
        if (op.cutRate <= 0) {
            showAlert('Cut Rate must be greater than 0', 'danger');
            ok = false;
        }
        if (!ok) { done(false); return; }

        if (tabGeometry && op.toolDiameter > 0)
            tabGeometry = mesh.offset(tabGeometry, op.toolDiameter / 2 * mmToClipperScale);

        var camPaths = [];
        if (op.type === 'Mill Pocket') {
            if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);
            camPaths = cam.pocket(geometry, op.toolDiameter * mmToClipperScale, op.stepOver, op.direction === 'Climb');
        } else if (op.type === 'Mill Cut') {
            camPaths = cam.cut(geometry, openGeometry, op.direction === 'Climb');
        } else if (op.type === 'Mill Cut Inside') {
            if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);
            camPaths = cam.insideOutside(geometry, op.toolDiameter * mmToClipperScale, true, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', true);
        } else if (op.type === 'Mill Cut Outside') {
            if (op.margin) geometry = mesh.offset(geometry, op.margin * mmToClipperScale);
            camPaths = cam.insideOutside(geometry, op.toolDiameter * mmToClipperScale, false, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', true);
        } else if (op.type === 'Mill V Carve') {
            camPaths = cam.vCarve(geometry, op.toolAngle, op.passDepth * mmToClipperScale);
        }

        for (var ci = 0; ci < camPaths.length; ci++) {
            var path = camPaths[ci].path;
            for (var pi = 0; pi < path.length; pi++) {
                path[pi].X = Math.round(path[pi].X / mmToClipperScale * 1000) * mmToClipperScale / 1000;
                path[pi].Y = Math.round(path[pi].Y / mmToClipperScale * 1000) * mmToClipperScale / 1000;
            }
        }
        cam.reduceCamPaths(camPaths, op.segmentLength * mmToClipperScale);

        var feedScale = 1;
        if (settings.toolFeedUnits === 'mm/s') feedScale = 60;

        var gcode = '\r\n;' +
            '\r\n; Operation:    ' + opIndex +
            '\r\n; Type:         ' + op.type +
            '\r\n; Paths:        ' + camPaths.length +
            '\r\n; Direction:    ' + op.direction +
            '\r\n; Rapid Z:      ' + op.millRapidZ +
            '\r\n; Start Z:      ' + op.millStartZ +
            '\r\n; End Z:        ' + op.millEndZ +
            '\r\n; Pass Depth:   ' + op.passDepth +
            '\r\n; Plunge rate:  ' + op.plungeRate + ' ' + settings.toolFeedUnits +
            '\r\n; Cut rate:     ' + op.cutRate + ' ' + settings.toolFeedUnits +
            '\r\n;\r\n';

        if (op.hookOperationStart && op.hookOperationStart.length) gcode += op.hookOperationStart;

        gcode += getMillGcode({
            paths: camPaths,
            ramp: op.ramp,
            scale: 1 / mmToClipperScale,
            useZ: op.type === 'Mill V Carve',
            offsetX: 0,
            offsetY: 0,
            decimal: 3,
            topZ: op.millStartZ,
            botZ: op.millEndZ,
            safeZ: op.millRapidZ,
            passDepth: op.passDepth,
            plungeFeed: op.plungeRate * feedScale,
            cutFeed: op.cutRate * feedScale,
            tabGeometry: op.type === 'Mill V Carve' ? [] : tabGeometry,
            tabZ: -op.tabDepth,
            toolSpeed: op.toolSpeed
        });

        if (op.hookOperationEnd && op.hookOperationEnd.length) gcode += op.hookOperationEnd;
        done(gcode);
    }

    function LatheGcodeGenerator(props) {
        this.decimal = props.decimal || 2;
        this.toolFeedUnits = props.toolFeedUnits;
        if (this.toolFeedUnits === 'mm/s')
            this.feedScale = 60;
        else
            this.feedScale = 1;
        this.gcode = '';
        this.motionMode = undefined;
        this.f = undefined;
        this.z = undefined;
        this.x = undefined;
    }
    LatheGcodeGenerator.prototype.getMotion = function (mode) {
        if (this.motionMode === mode) return '';
        this.motionMode = mode;
        return mode + ' ';
    };
    LatheGcodeGenerator.prototype.getFeed = function (f) {
        var strF = (f * this.feedScale).toFixed(this.decimal);
        var roundedF = Number(strF);
        if (this.f === roundedF) return '';
        this.f = roundedF;
        return 'F' + strF + ' ';
    };
    LatheGcodeGenerator.prototype.rapidZ = function (z) {
        var strZ = z.toFixed(this.decimal);
        var roundedZ = Number(strZ);
        if (this.z === roundedZ) return;
        this.z = roundedZ;
        this.gcode += this.getMotion('G0') + 'Z' + strZ + '\n';
    };
    LatheGcodeGenerator.prototype.rapidXDia = function (xDia, backSide) {
        if (!backSide) xDia = -xDia;
        var strX = (xDia / 2).toFixed(this.decimal);
        var roundedX = Number(strX);
        if (this.x === roundedX) return;
        this.x = roundedX;
        this.gcode += this.getMotion('G0') + 'X' + strX + '\n';
    };
    LatheGcodeGenerator.prototype.moveZ = function (z, f) {
        var strZ = z.toFixed(this.decimal);
        var roundedZ = Number(strZ);
        if (this.z === roundedZ) return;
        this.z = roundedZ;
        this.gcode += this.getMotion('G1') + this.getFeed(f) + 'Z' + strZ + '\n';
    };
    LatheGcodeGenerator.prototype.moveXDia = function (xDia, backSide, f) {
        if (!backSide) xDia = -xDia;
        var strX = (xDia / 2).toFixed(this.decimal);
        var roundedX = Number(strX);
        if (this.x === roundedX) return;
        this.x = roundedX;
        this.gcode += this.getMotion('G1') + this.getFeed(f) + 'X' + strX + '\n';
    };

    function latheConvFaceTurn(gen, showAlert, props) {
        var latheToolBackSide = props.latheToolBackSide;
        var latheRapidToDiameter = props.latheRapidToDiameter;
        var latheRapidToZ = props.latheRapidToZ;
        var latheStartZ = props.latheStartZ;
        var latheRoughingFeed = props.latheRoughingFeed;
        var latheRoughingDepth = props.latheRoughingDepth;
        var latheFinishFeed = props.latheFinishFeed;
        var latheFinishDepth = props.latheFinishDepth;
        var latheFinishExtraPasses = props.latheFinishExtraPasses;
        var latheFace = props.latheFace;
        var latheFaceEndDiameter = props.latheFaceEndDiameter;
        var latheTurns = props.latheTurns;

        if (latheRapidToDiameter <= 0) return showAlert('latheRapidToDiameter <= 0', 'danger');
        if (latheStartZ > latheRapidToZ) return showAlert('latheStartZ > latheRapidToZ', 'danger');
        if (latheRoughingFeed <= 0) return showAlert('latheRoughingFeed <= 0', 'danger');
        if (latheRoughingDepth <= 0) return showAlert('latheRoughingDepth <= 0', 'danger');
        if (latheFinishFeed <= 0) return showAlert('latheFinishFeed <= 0', 'danger');
        if (latheFinishDepth < 0) return showAlert('latheFinishDepth < 0', 'danger');
        if (latheStartZ + latheFinishDepth > latheRapidToZ) return showAlert('latheStartZ + latheFinishDepth > latheRapidToZ', 'danger');
        if (latheFinishExtraPasses < 0) return showAlert('latheFinishExtraPasses < 0', 'danger');
        if (latheFace && latheFaceEndDiameter >= latheRapidToDiameter) return showAlert('latheFace && latheFaceEndDiameter >= latheRapidToDiameter', 'danger');
        if (!latheFace && !latheTurns.length) return showAlert('!latheFace && !latheTurns.length', 'danger');

        for (var i = 0; i < latheTurns.length; ++i) {
            if (latheTurns[i].startDiameter < 0) return showAlert('i=' + i + ': latheTurns[i].startDiameter < 0', 'danger');
            if (i > 0 && latheTurns[i].startDiameter < latheTurns[i - 1].endDiameter) return showAlert('i=' + i + ': i > 0 && latheTurns[i].startDiameter < latheTurns[i - 1].endDiameter', 'danger');
            if (latheTurns[i].startDiameter >= latheRapidToDiameter) return showAlert('i=' + i + ': latheTurns[i].startDiameter >= latheRapidToDiameter', 'danger');
            if (latheTurns[i].endDiameter <= 0) return showAlert('i=' + i + ': latheTurns[i].endDiameter <= 0', 'danger');
            if (latheTurns[i].endDiameter < latheTurns[i].startDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter < latheTurns[i].startDiameter', 'danger');
            if (latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter', 'danger');
            if (latheTurns[i].endDiameter !== latheTurns[i].startDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter !== latheTurns[i].startDiameter', 'danger');
            if (latheTurns[i].length <= 0) return showAlert('i=' + i + ': latheTurns[i].length <= 0', 'danger');
        }

        gen.gcode += '\r\n; latheToolBackSide:       ' + latheToolBackSide +
            '\r\n; latheRapidToDiameter:    ' + latheRapidToDiameter + ' mm' +
            '\r\n; latheRapidToZ:           ' + latheRapidToZ + ' mm' +
            '\r\n; latheStartZ:             ' + latheStartZ + ' mm' +
            '\r\n; latheRoughingFeed:       ' + latheRoughingFeed + gen.toolFeedUnits +
            '\r\n; latheRoughingDepth:      ' + latheRoughingDepth + ' mm' +
            '\r\n; latheFinishFeed:         ' + latheFinishFeed + gen.toolFeedUnits +
            '\r\n; latheFinishDepth:        ' + latheFinishDepth + ' mm' +
            '\r\n; latheFinishExtraPasses:  ' + latheFinishExtraPasses +
            '\r\n; latheFace:               ' + latheFace +
            '\r\n; latheFaceEndDiameter:    ' + latheFaceEndDiameter + ' mm' +
            '';

        if (latheTurns.length) {
            gen.gcode += '\r\n; turns:';
            for (var t = 0; t < latheTurns.length; t++) {
                gen.gcode += '\r\n;     startDiameter:       ' + latheTurns[t].startDiameter + ' mm' +
                    '\r\n;     endDiameter:         ' + latheTurns[t].endDiameter + ' mm' +
                    '\r\n;     length:              ' + latheTurns[t].length + ' mm';
            }
        }

        gen.gcode += '\n\n; Rapid\n';
        gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
        gen.rapidZ(latheRapidToZ);

        if (latheFace) {
            gen.gcode += '\n; Face roughing\n';
            var z = latheRapidToZ;
            while (true) {
                var nextZ = Math.max(z - latheRoughingDepth, latheStartZ + latheFinishDepth);
                if (nextZ === z) break;
                z = nextZ;
                gen.moveZ(z, latheRoughingFeed);
                gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheRoughingFeed);
                gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheRoughingFeed);
                gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
            }
            gen.gcode += '\n; Face finishing\n';
            var n = latheFinishExtraPasses;
            if (z > latheStartZ) {
                ++n;
                z = latheStartZ;
            }
            for (var fi = 0; fi < n; ++fi) {
                gen.moveZ(z, latheFinishFeed);
                gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheFinishFeed);
                gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheFinishFeed);
                gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
            }
            latheRapidToZ = Math.min(z + latheRoughingDepth, latheRapidToZ);
            gen.rapidZ(latheRapidToZ);
        }

        if (latheTurns.length) {
            gen.gcode += '\n; Turn roughing\n';
            var turnRapidToDiameter = latheRapidToDiameter;
            var startX = turnRapidToDiameter - latheRoughingDepth;
            while (true) {
                var cx = startX;
                var cz = latheRapidToZ;
                var turnStartZ = latheStartZ + latheFinishDepth;
                var done = false;
                for (var ti = 0; ti < latheTurns.length; ti++) {
                    var turn = latheTurns[ti];
                    if (cx < turn.startDiameter + latheFinishDepth && turn.startDiameter + latheFinishDepth < startX + latheRoughingDepth)
                        cx = turn.startDiameter + latheFinishDepth;
                    if (cx < turn.startDiameter + latheFinishDepth) {
                        if (ti === 0) {
                            done = true;
                            break;
                        }
                        gen.moveXDia(cx, latheToolBackSide, latheRoughingFeed);
                        cz = turnStartZ;
                        gen.moveZ(cz, latheRoughingFeed);
                        gen.moveXDia(Math.min(cx + latheRoughingDepth, turnRapidToDiameter), latheToolBackSide, latheRoughingFeed);
                        break;
                    } else {
                        gen.moveXDia(cx, latheToolBackSide, latheRoughingFeed);
                        cz = turnStartZ - turn.length;
                        gen.moveZ(cz, latheRoughingFeed);
                    }
                    turnStartZ -= turn.length;
                }
                if (done) break;
                turnRapidToDiameter = Math.min(turnRapidToDiameter, cx + latheRoughingDepth);
                startX -= latheRoughingDepth;
                gen.moveXDia(turnRapidToDiameter, latheToolBackSide, latheRoughingFeed);
                gen.rapidZ(latheRapidToZ);
            }

            gen.gcode += '\n; Turn finishing\n';
            gen.rapidXDia(latheTurns[0].startDiameter, latheToolBackSide);
            var fz = latheStartZ;
            for (var tf = 0; tf < latheTurns.length; tf++) {
                gen.moveXDia(latheTurns[tf].startDiameter, latheToolBackSide, latheFinishFeed);
                fz -= latheTurns[tf].length;
                gen.moveZ(fz, latheFinishFeed);
            }
            gen.moveXDia(latheRapidToDiameter, latheToolBackSide, latheFinishFeed);
            gen.rapidZ(latheRapidToZ);
        }
        gen.gcode += '\n';
    }

    function getLatheGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress) {
        var gen = new LatheGcodeGenerator({ decimal: 2, toolFeedUnits: settings.toolFeedUnits });
        gen.gcode = '\r\n;' +
            '\r\n; Operation:               ' + opIndex +
            '\r\n; Type:                    ' + op.type +
            '';
        if (op.hookOperationStart && op.hookOperationStart.length)
            gen.gcode += op.hookOperationStart;
        if (op.type === 'Lathe Conv Face/Turn')
            latheConvFaceTurn(gen, showAlert, op);
        if (op.hookOperationEnd && op.hookOperationEnd.length)
            gen.gcode += op.hookOperationEnd;
        done(gen.gcode);
    }

    function getImageBounds(t, w, h) {
        function tx(x, y) { return t[0] * x + t[2] * y; }
        function ty(x, y) { return t[1] * x + t[3] * y; }
        return {
            x1: Math.min(tx(0, 0), tx(w, 0), tx(w, h), tx(0, h)),
            y1: Math.min(ty(0, 0), ty(w, 0), ty(w, h), ty(0, h)),
            x2: Math.max(tx(0, 0), tx(w, 0), tx(w, h), tx(0, h)),
            y2: Math.max(ty(0, 0), ty(w, 0), ty(w, h), ty(0, h))
        };
    }

    function getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, jobIndex, QE_chunk, workers) {
        var ok = true;
        if (!(op.laserDiameter > 0)) {
            showAlert('LaserDiameter should be greater than 0', 'danger');
            ok = false;
        }
        if (!(op.cutRate > 0)) {
            showAlert('CutRate should be greater than 0', 'danger');
            ok = false;
        }
        if (settings.machineZEnabled) {
            if (op.startHeight === '' || isNaN(op.startHeight)) {
                showAlert('Start Height must be a valid number', 'danger');
                ok = false;
            }
        }
        if (op.useA && !op.aAxisDiameter) {
            showAlert('Axis Diameter must be > 0', 'danger');
            ok = false;
        }
        if (!ok) { done(false); return []; }

        var dpi = op.dpi || settings.dpiBitmap;
        if (!dpi || dpi <= 0) {
            showAlert('Bitmap DPI must be greater than 0', 'danger');
            ok = false;
        }
        if (!settings.gcodeSMaxValue || settings.gcodeSMaxValue <= 0) {
            showAlert('S Max Value (gcodeSMaxValue) must be greater than 0', 'danger');
            ok = false;
        }
        if (op.laserPowerRange === undefined || isNaN(op.laserPowerRange) || op.laserPowerRange <= 0) {
            showAlert('Laser Power Range must be > 0', 'danger');
            ok = false;
        }
        if (!ok) { done(false); return []; }

        var gcode = [];
        var axisAFactor = (op.useA && op.aAxisDiameter) ? Number(360 / op.aAxisDiameter / Math.PI).toFixed(3) : 1;

        var QE = new window.queue();
        QE.concurrency = 1;
        QE.timeout = 3600 * 1000;
        QE.chunk = 100 / docsWithImages.length;

        var generator = getGenerator(settings.gcodeGenerator, settings);

        var postProcessing = function (gc) {
            var g = '';
            var raster = '';
            var firstMove = null;
            for (var li = 0; li < gc.length; li++) {
                if (gc[li].match(/^G[0-1]\s+[XYZ]/gi)) {
                    firstMove = gc[li];
                    break;
                }
            }
            for (var li = 0; li < gc.length; li++) {
                var line = gc[li];
                if (op.useA) {
                    line = line.replace(/Y(\s*-?[0-9\.]{1,})/gi, function (str, float) {
                        return 'A' + (parseFloat(float) * axisAFactor).toFixed(3);
                    });
                }
                if (line[0] !== 'S' && line.substring(0, 4) !== 'G0 F') {
                    raster += line + '\r\n';
                } else {
                    raster += '; stripped: ' + line + '\r\n';
                }
            }
            raster += '\r\n\r\n';

            if (op.hookOperationStart && op.hookOperationStart.length) g += op.hookOperationStart;

            for (var pass = 0; pass < op.passes; ++pass) {
                g += '\n\n; Pass ' + pass + '\r\n';
                if (op.hookPassStart && op.hookPassStart.length) g += op.hookPassStart;

                if (op.useBlower && settings.machineBlowerGcodeOn) {
                    g += '\r\n' + settings.machineBlowerGcodeOn + '; Enable Air assist\r\n';
                }

                if (firstMove) {
                    g += '\r\n; First Move\r\n';
                    g += firstMove.replace(/^G[0-1]/gi, 'G0').replace(/S[0\.]+/gi, '') + '\r\n';
                }

                if (settings.machineZEnabled) {
                    var zHeight = Number(op.startHeight) + settings.machineZToolOffset - (op.passDepth * pass);
                    g += '\r\n; Pass Z Height ' + zHeight + 'mm (Offset: ' + settings.machineZToolOffset + 'mm)\r\n';
                    g += 'G0 Z' + zHeight.toFixed(settings.decimal || 3) + '\r\n';
                }

                if (settings.gcodeToolOn && settings.gcodeToolOn.length) {
                    if (settings.gcodeToolOn.indexOf('$INTENSITY') > -1) {
                        g += settings.gcodeToolOn.split('$INTENSITY').join(settings.gcodeLaserIntensity + settings.gcodeSMaxValue.toFixed(4)) + '\r\n';
                    } else {
                        g += settings.gcodeToolOn + ' \r\n';
                    }
                }

                g += generator.postProcessRaster(raster);

                if (settings.gcodeToolOff && settings.gcodeToolOff.length)
                    g += settings.gcodeToolOff + ' \r\n';

                if (op.useBlower && settings.machineBlowerGcodeOff) {
                    g += '\r\n' + settings.machineBlowerGcodeOff + '; Disable Air assist\r\n';
                }
                if (op.hookPassEnd && op.hookPassEnd.length) g += op.hookPassEnd;
            }

            if (op.hookOperationEnd && op.hookOperationEnd.length) g += op.hookOperationEnd;
            return g;
        };

        var percentProcessing = function (percent) {
            var p = parseInt((jobIndex * QE_chunk) + (percent * (QE_chunk / 100)));
            progress(p);
        };

        for (var index = 0; index < docsWithImages.length; index++) {
            QE.push(function (idx) {
                return function (cb) {
                    var doc = Object.assign({}, docsWithImages[idx]);
                    var feedRate = op.cutRate * (settings.toolFeedUnits === 'mm/s' ? 60 : 1);
                    var img = new Image();
                    img.onload = function () {
                        var image = this;
                        if (op.useA && op.aAxisDiameter && op.diagonal) feedRate = feedRate / Math.SQRT2;

                        var scale = (dpi * 100) / 2540;
                        var docBounds = getImageBounds(doc.transform2d, image.width, image.height);
                        var imgBounds = getImageBounds(doc.transform2d, image.width * scale, image.height * scale);

                        var w = Math.round(imgBounds.x2 - imgBounds.x1);
                        var h = Math.round(imgBounds.y2 - imgBounds.y1);

                        var canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;

                        var ctx = canvas.getContext('2d', { willReadFrequently: true });
                        ctx.translate(w / 2, h / 2);
                        ctx.transform(-doc.transform2d[0] * scale, doc.transform2d[1] * scale, doc.transform2d[2] * scale, -doc.transform2d[3] * scale, 0, 0);
                        ctx.rotate((Math.PI / 180) * 180);
                        ctx.translate(-w / 2, -h / 2);
                        ctx.translate((w - image.width) / 2, (h - image.height) / 2);
                        ctx.drawImage(image, 0, 0);
                            ctx.save();

                            var params = {
                                ppi: { x: dpi, y: dpi },
                                toolDiameter: op.laserDiameter,
                                beamRange: { min: 0, max: settings.gcodeSMaxValue },
                                beamPower: { min: 0, max: op.laserPowerRange },
                                rapidRate: false,
                                feedRate: feedRate,
                                offsets: {
                                    X: (docBounds.x1 + docBounds.x2 - w / dpi * 25.4) / 2 + doc.transform2d[4],
                                    Y: (docBounds.y1 + docBounds.y2 - h / dpi * 25.4) / 2 + doc.transform2d[5]
                                },
                                trimLine: op.trimLine,
                                joinPixel: op.joinPixel,
                                burnWhite: op.burnWhite,
                                verboseG: op.verboseGcode,
                                diagonal: op.diagonal,
                                overscan: op.overScan,
                                gcodeGenerator: settings.gcodeGenerator,
                                gcodeToolOn: settings.gcodeToolOn,
                                gcodeToolOff: settings.gcodeToolOff,
                                gcodeLaserIntensity: settings.gcodeLaserIntensity,
                                nonBlocking: false,
                                milling: false,
                                filters: {
                                    smoothing: op.smoothing,
                                    brightness: op.brightness,
                                    contrast: op.contrast,
                                    gamma: op.gamma,
                                    grayscale: op.grayscale,
                                    shadesOfGray: op.shadesOfGray,
                                    invertColor: op.invertColor,
                                    dithering: op.dithering
                                }
                            };

                            var RasterToGcode = LW.RasterToGcode || (window.RasterToGcode && window.RasterToGcode.RasterToGcode);
                            var r2g = new RasterToGcode(params);
                            r2g.load(canvas.toDataURL()).then(function (rtg) {
                                var properties = {
                                    cellSize: rtg.cellSize,
                                    scaleRatio: rtg.scaleRatio,
                                    filters: rtg.filters,
                                    size: rtg.size,
                                    pixels: rtg.pixels
                                };

                                var basePath = window.location.href.replace(/\/[^/]*$/, '/');
                                var rasterWorkerCode = [
                                    'self.onmessage = function(event) {',
                                    '  if (event.data.cmd === "start") {',
                                    '    start(event.data);',
                                    '  }',
                                    '};',
                                    'importScripts("' + basePath + 'vendors/lw.raster-to-gcode.js");',
                                    'function start(data) {',
                                    '  try {',
                                    '    var RasterToGcode = typeof LW !== "undefined" && LW.RasterToGcode;',
                                    '    if (!RasterToGcode && typeof self.RasterToGcode !== "undefined") RasterToGcode = self.RasterToGcode.RasterToGcode;',
                                    '    if (!RasterToGcode) { self.postMessage({ event: "onError", error: "RasterToGcode not available" }); return; }',
                                    '    var rasterToGcode = new RasterToGcode(data.settings);',
                                    '    Object.assign(rasterToGcode, data.properties);',
                                    '    rasterToGcode.on("progress", function(event) {',
                                    '      self.postMessage({ event: "onProgress", percent: event.percent });',
                                    '    }).on("done", function(event) {',
                                    '      self.postMessage({ event: "onDone", gcode: event.gcode });',
                                    '    }).on("abort", function() {',
                                    '      self.postMessage({ event: "onAbort" });',
                                    '    });',
                                    '    self.postMessage({ event: "start" });',
                                    '    rasterToGcode.run();',
                                    '  } catch(e) {',
                                    '    self.postMessage({ event: "onError", error: e.toString() });',
                                    '  }',
                                    '}'
                                ].join('\n');

                                var r2gWorker = getBlobWorker(rasterWorkerCode);
                                r2gWorker.onmessage = function (event) {
                                    if (event.data.event === 'onDone') {
                                        gcode.push(postProcessing(event.data.gcode));
                                        cb();
                                    } else if (event.data.event === 'onProgress') {
                                        percentProcessing((idx * QE.chunk) + (event.data.percent * QE.chunk / 100));
                                    } else if (event.data.event === 'onError') {
                                        if (typeof showAlert === 'function') showAlert('Raster worker error: ' + event.data.error, 'danger');
                                        cb();
                                    } else if (event.data.event === 'onAbort') {
                                        cb();
                                    }
                                };
                                if (workers) workers.push(r2gWorker);
                                r2gWorker.postMessage({ cmd: 'start', settings: params, properties: properties });
                            }).catch(function (err) {
                                if (typeof showAlert === 'function') showAlert('Raster load error: ' + (err.message || err), 'danger');
                                cb();
                            });
                    };
                    img.src = doc.dataURL;
                };
            }(index));
        }

        QE.start(function (err) {
            done(gcode.join('\r\n'));
        });
    }

    function getLaserRasterMergeGcodeFromOp(settings, documentCacheHolder, opIndex, op, filteredDocIds, showAlert, done, progress, jobIndex, QE_chunk, workers) {
        if (documentCacheHolder && documentCacheHolder.cache) {
            var bounds = { x1: Number.MAX_VALUE, y1: Number.MAX_VALUE, x2: -Number.MAX_VALUE, y2: -Number.MAX_VALUE };
            var filteredCachedDocs = [];
            documentCacheHolder.cache.forEach(function (cache) {
                var doc = cache.document;
                if (filteredDocIds.has(doc.id) && doc.transform2d && cache.bounds) {
                    filteredCachedDocs.push(cache);
                    bounds.x1 = Math.min(bounds.x1, cache.bounds.x1 + doc.transform2d[4]);
                    bounds.y1 = Math.min(bounds.y1, cache.bounds.y1 + doc.transform2d[5]);
                    bounds.x2 = Math.max(bounds.x2, cache.bounds.x2 + doc.transform2d[4]);
                    bounds.y2 = Math.max(bounds.y2, cache.bounds.y2 + doc.transform2d[5]);
                }
            });
            if (filteredCachedDocs.length) {
                bounds.x2 = Math.max(bounds.x2, bounds.x1 + 1);
                bounds.y2 = Math.max(bounds.y2, bounds.y1 + 1);
                var width = Math.ceil((bounds.x2 - bounds.x1) / op.laserDiameter);
                var height = Math.ceil((bounds.y2 - bounds.y1) / op.laserDiameter);
                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                var gl = canvas.getContext('webgl', { alpha: true, depth: true, antialias: true, preserveDrawingBuffer: true });
                var DrawCommands = LW.DrawCommands;
                var drawCommands = new DrawCommands(gl);
                var perspective = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                var sx = 2 / (bounds.x2 - bounds.x1);
                var sy = 2 / (bounds.y2 - bounds.y1);
                var tx = -1 - sx * bounds.x1;
                var ty = -1 - sy * bounds.y1;
                var view = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1];
                gl.viewport(0, 0, width, height);
                gl.clearColor(1, 1, 1, 1);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.enable(gl.BLEND);

                for (var cdi = 0; cdi < filteredCachedDocs.length; cdi++) {
                    var drawDocument = LW.drawDocument;
                    if (drawDocument) drawDocument(perspective, view, drawCommands, filteredCachedDocs[cdi], true);
                }

                var DOCUMENT_INITIALSTATE = LW.DOCUMENT_INITIALSTATE || {};
                var docsWithImages = [Object.assign({}, DOCUMENT_INITIALSTATE, {
                    transform2d: [(bounds.x2 - bounds.x1) / width, 0, 0, (bounds.y2 - bounds.y1) / height, bounds.x1, bounds.y1],
                    dataURL: canvas.toDataURL()
                })];
                drawCommands.destroy();

                getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, jobIndex, QE_chunk, workers);
                return;
            }
            done('');
            return;
        }
        // Fallback: 2D canvas composite (LW5 mode, no document cache)
        var rasterMerge = LW.rasterMerge;
        if (!rasterMerge) {
            showAlert('LW.rasterMerge not available; include lw5-raster.js', 'danger');
            done('');
            return;
        }
        rasterMerge(documents, filteredDocIds, op.laserDiameter, function (dataURL, transform2d) {
            if (!dataURL) { done(''); return; }
            var docsWithImages = [{
                type: 'image',
                transform2d: transform2d,
                dataURL: dataURL
            }];
            getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, jobIndex, QE_chunk, workers);
        });
    }

    function getGcode(settings, documents, operations, documentCacheHolder, showAlert, done, progress) {
        var starttime = new Date().getTime();
        var QE = new window.queue();
        QE.timeout = 3600 * 1000;
        QE.concurrency = settings.gcodeConcurrency || 1;

        var gcode = Array(operations.length);
        var gauge = Array(operations.length * 2).fill(0);
        var workers = [];
        var jobIndex = 0;

        for (var opIndex = 0; opIndex < operations.length; ++opIndex) {
            var op = expandHookGCode(operations[opIndex]);

            var invokeWebWorker = function (workerCode, props, cb, ji) {
                // importScripts in blob workers needs absolute paths; compute from page origin
                var basePath = window.location.href.replace(/\/[^/]*$/, '/');
                var libBoot = [
                    'var window = self;',
                    'importScripts("' + basePath + 'vendors/clipper-lib.js");',
                    'importScripts("' + basePath + 'vendors/poly2tri.js");',
                    'importScripts("' + basePath + 'js/lw5-mesh.js");',
                    'importScripts("' + basePath + 'js/lw5-cam.js");',
                    'self.__mesh__ = LW.mesh;',
                    'self.__cam__ = LW.cam;',
                ].join('\n');
                var peasant = getBlobWorker(libBoot + '\n' + workerCode);
                peasant.onmessage = function (e) {
                    var data = JSON.parse(e.data);
                    if (data.event === 'onDone') {
                        gauge[props.opIndex * 2 + 1] = 100;
                        progress(gauge);
                        if (data.gcode !== false) { gcode[props.opIndex] = data.gcode; }
                        cb();
                    } else if (data.event === 'onProgress') {
                        gauge[props.opIndex * 2 + 1] = data.progress;
                        progress(gauge);
                    } else {
                        if (data.errors) {
                            data.errors.forEach(function (item) {
                                showAlert(item.message, item.level);
                            });
                        }
                        QE.end();
                    }
                };
                workers.push(peasant);
                peasant.postMessage(props);
            };

            var preflightPromise = function (settings, documents, opIndex, op, workers) {
                return new Promise(function (resolve, reject) {
                    var geometry = [];
                    var openGeometry = [];
                    var tabGeometry = [];
                    var filteredDocIds = new Set();
                    var docsWithImages = [];

                    var mesh = LW.mesh;

                    function matchColor(filterColor, color) {
                        if (!filterColor) return true;
                        if (!color) return false;
                        return filterColor[0] === color[0] && filterColor[1] === color[1] && filterColor[2] === color[2] && filterColor[3] === color[3];
                    }

                    function examineDocTree(isTab, id) {
                        var doc = documents.find(function (d) { return d.id === id; });
                        if (!doc) return;
                        if (doc.rawPaths) {
                            if (isTab) {
                                tabGeometry = mesh.union(tabGeometry, mesh.rawPathsToClipperPaths(doc.rawPaths, doc.transform2d));
                            } else if (matchColor(op.filterFillColor, doc.fillColor) && matchColor(op.filterStrokeColor, doc.strokeColor)) {
                                filteredDocIds.add(doc.id);
                                if (!op.type || op.type.indexOf('Raster') === -1) {
                                    var isClosed = false;
                                    for (var rpi = 0; rpi < doc.rawPaths.length; rpi++) {
                                        var rp = doc.rawPaths[rpi];
                                        if (rp.length >= 4 && rp[0] === rp[rp.length - 2] && rp[1] === rp[rp.length - 1])
                                            isClosed = true;
                                    }
                                    var clipperPaths = mesh.rawPathsToClipperPaths(doc.rawPaths, doc.transform2d);
                                    if (isClosed)
                                        geometry = mesh.xor(geometry, clipperPaths);
                                    else if (!op.filterFillColor)
                                        openGeometry = openGeometry.concat(clipperPaths);
                                }
                            }
                        }
                        if (doc.type === 'image' && !isTab) {
                            filteredDocIds.add(doc.id);
                            var cache = documentCacheHolder && documentCacheHolder.cache ? documentCacheHolder.cache.get(doc.id) : null;
                            if (cache && cache.imageLoaded)
                                docsWithImages.push(Object.assign([], doc, { image: cache.image }));
                            else
                                docsWithImages.push(doc);
                        }
                        if (doc.children) {
                            for (var ci = 0; ci < doc.children.length; ci++) {
                                examineDocTree(isTab, doc.children[ci]);
                            }
                        }
                    }

                    for (var di = 0; di < op.documents.length; di++) {
                        examineDocTree(false, op.documents[di]);
                    }
                    if (op.tabDocuments) {
                        for (var tdi = 0; tdi < op.tabDocuments.length; tdi++) {
                            examineDocTree(true, op.tabDocuments[tdi]);
                        }
                    }

                    gauge[opIndex * 2] = 100;
                    resolve({ geometry: geometry, openGeometry: openGeometry, tabGeometry: tabGeometry, filteredDocIds: filteredDocIds, docsWithImages: docsWithImages });
                });
            };

            var jobDone = function (g, cb) {
                if (g !== false) { gcode[opIndex] = g; }
                cb();
            };

            if (op.enabled) {
                QE.push(function (cb) {
                    console.log(op.type + '->' + jobIndex);
                    preflightPromise(settings, documents, opIndex, op, workers)
                        .then(function (preflight) {
                            var geometry = preflight.geometry;
                            var openGeometry = preflight.openGeometry;
                            var tabGeometry = preflight.tabGeometry;
                            var filteredDocIds = preflight.filteredDocIds;
                            var docsWithImages = preflight.docsWithImages;

                            if (op.type === 'Laser Cut' || op.type === 'Laser Cut Inside' || op.type === 'Laser Cut Outside' || op.type === 'Laser Fill Path') {
                                var lasercutWorkerCode = [
                                    'var LW = {};',
                                    'LW.mesh = self.__mesh__;',
                                    'LW.cam = self.__cam__;',
                                    'self.__generator__ = self.__generator__ || {};',
                                    '',
                                    'function getGenerator(gcodeGenerator, settings) {',
                                    '  switch(gcodeGenerator) {',
                                    '    case "marlin":',
                                    '      return new self.__generator__.MarlinGenerator(settings);',
                                    '    default:',
                                    '      return new self.__generator__.DefaultGenerator(settings);',
                                    '  }',
                                    '}',
                                    '',
                                    'function AbstractGenerator(settings) { this.settings = settings; }',
                                    'AbstractGenerator.prototype.postProcessRaster = function(gcode) {',
                                    '  if (this.settings.gcodeToolOn && this.settings.gcodeToolOff) {',
                                    '    gcode = gcode.replace(/G0([\\s\\S]*?)G1/gi, "G0$1\\n" + this.settings.gcodeToolOn + "\\nG1");',
                                    '    gcode = gcode.replace(/G1([\\s\\S]*?)G0/gi, "G1$1\\n" + this.settings.gcodeToolOff + "\\nG0");',
                                    '  }',
                                    '  return gcode;',
                                    '};',
                                    '',
                                    'function DefaultGenerator(settings) { AbstractGenerator.call(this, settings); }',
                                    'DefaultGenerator.prototype = Object.create(AbstractGenerator.prototype);',
                                    'DefaultGenerator.prototype.constructor = DefaultGenerator;',
                                    'DefaultGenerator.prototype.moveRapid = function(params, optimized) {',
                                    '  if (params == null) return "";',
                                    '  var gcode = "";',
                                    '  if (!optimized) gcode += "G0 ";',
                                    '  gcode += this.move(params);',
                                    '  return gcode;',
                                    '};',
                                    'DefaultGenerator.prototype.moveTool = function(params, optimized) {',
                                    '  if (params == null) return "";',
                                    '  var gcode = "";',
                                    '  if (!optimized) gcode += "G1 ";',
                                    '  gcode += this.move(params);',
                                    '  return gcode;',
                                    '};',
                                    'DefaultGenerator.prototype.toolOn = function(gcode, params) {',
                                    '  if (gcode == null) return "";',
                                    '  if (params && params.hasOwnProperty("i")) gcode = gcode.split("$INTENSITY").join(params.i);',
                                    '  return gcode;',
                                    '};',
                                    'DefaultGenerator.prototype.toolOff = function(gcode, params) {',
                                    '  if (gcode == null) return "";',
                                    '  if (params && params.hasOwnProperty("i")) gcode = gcode.split("$INTENSITY").join(params.i);',
                                    '  return gcode;',
                                    '};',
                                    'DefaultGenerator.prototype.move = function(params) {',
                                    '  var gcode = "";',
                                    '  if (params.hasOwnProperty("x")) gcode += " X" + params.x;',
                                    '  if (params.hasOwnProperty("y")) gcode += " Y" + params.y;',
                                    '  if (params.hasOwnProperty("a")) gcode += " A" + params.a;',
                                    '  if (params.hasOwnProperty("i")) gcode += " " + params.i;',
                                    '  if (params.hasOwnProperty("s")) gcode += " S" + params.s;',
                                    '  if (params.hasOwnProperty("f")) gcode += " F" + params.f;',
                                    '  return gcode.trim();',
                                    '};',
                                    '',
                                    'function MarlinGenerator(settings) { AbstractGenerator.call(this, settings); }',
                                    'MarlinGenerator.prototype = Object.create(AbstractGenerator.prototype);',
                                    'MarlinGenerator.prototype.constructor = MarlinGenerator;',
                                    'MarlinGenerator.prototype.moveRapid = function(params) {',
                                    '  if (params == null) return "";',
                                    '  return this.move("G0", params);',
                                    '};',
                                    'MarlinGenerator.prototype.moveTool = function(params) {',
                                    '  if (params == null) return "";',
                                    '  return this.move("G1", params);',
                                    '};',
                                    'MarlinGenerator.prototype.toolOn = function(gcode, params) {',
                                    '  if (gcode == null) return "";',
                                    '  if (params && params.hasOwnProperty("i")) gcode = gcode.split("$INTENSITY").join(params.i);',
                                    '  return gcode;',
                                    '};',
                                    'MarlinGenerator.prototype.toolOff = function(gcode, params) {',
                                    '  if (gcode == null) return "";',
                                    '  if (params && params.hasOwnProperty("i")) gcode = gcode.split("$INTENSITY").join(params.i);',
                                    '  return gcode;',
                                    '};',
                                    'MarlinGenerator.prototype.move = function(prefix, params) {',
                                    '  var gcode = "";',
                                    '  if (params.hasOwnProperty("s")) {',
                                    '    if (this.settings.gcodeToolOn.indexOf("$INTENSITY") > -1) {',
                                    '      gcode += this.settings.gcodeToolOn.split("$INTENSITY").join(this.settings.gcodeLaserIntensity + params.s) + "\\r\\n";',
                                    '    } else {',
                                    '      gcode += this.settings.gcodeToolOn + " S" + params.s + "\\r\\n";',
                                    '    }',
                                    '  }',
                                    '  if (params.hasOwnProperty("i")) {',
                                    '    if (this.settings.gcodeToolOn.indexOf("$INTENSITY") > -1) {',
                                    '      gcode += this.settings.gcodeToolOn.split("$INTENSITY").join(params.i) + "\\r\\n";',
                                    '    } else {',
                                    '      gcode += this.settings.gcodeToolOn + " " + params.i + "\\r\\n";',
                                    '    }',
                                    '  }',
                                    '  gcode += prefix;',
                                    '  if (params.hasOwnProperty("x")) gcode += " X" + params.x;',
                                    '  if (params.hasOwnProperty("y")) gcode += " Y" + params.y;',
                                    '  if (params.hasOwnProperty("a")) gcode += " A" + params.a;',
                                    '  if (params.hasOwnProperty("f")) gcode += " F" + params.f;',
                                    '  return gcode.trim();',
                                    '};',
                                    '',
                                    'self.__generator__.AbstractGenerator = AbstractGenerator;',
                                    'self.__generator__.DefaultGenerator = DefaultGenerator;',
                                    'self.__generator__.MarlinGenerator = MarlinGenerator;',
                                    '',
                                    'function getGcode(props) {',
                                    '  var paths = props.paths, generator = props.generator;',
                                    '  var scale = props.scale, offsetX = props.offsetX, offsetY = props.offsetY;',
                                    '  var decimal = props.decimal, cutFeed = props.cutFeed, laserPower = props.laserPower;',
                                    '  var passes = props.passes, useA = props.useA, aAxisDiameter = props.aAxisDiameter;',
                                    '  var tabGeometry = props.tabGeometry, gcodeToolOn = props.gcodeToolOn, gcodeToolOff = props.gcodeToolOff;',
                                    '  var gcodeLaserIntensity = props.gcodeLaserIntensity;',
                                    '  var gcodeLaserIntensitySeparateLine = props.gcodeLaserIntensitySeparateLine;',
                                    '  var gcodeSMinValue = props.gcodeSMinValue, gcodeSMaxValue = props.gcodeSMaxValue;',
                                    '  var useZ = props.useZ, useBlower = props.useBlower;',
                                    '  var hookPassStart = props.hookPassStart, hookPassEnd = props.hookPassEnd;',
                                    '',
                                    '  if (gcodeToolOn) gcodeToolOn += "\\r\\n";',
                                    '  if (gcodeToolOff) gcodeToolOff += "\\r\\n";',
                                    '  var laserOnS = gcodeLaserIntensity + (gcodeSMinValue + (gcodeSMaxValue - gcodeSMinValue) * laserPower / 100).toFixed(decimal);',
                                    '',
                                    '  var lastX = 0, lastY = 0, lastA = 0;',
                                    '  function convertPoint(p, rapid) {',
                                    '    var x = p.X * scale + offsetX;',
                                    '    var y = p.Y * scale + offsetY;',
                                    '    if (useA) {',
                                    '      var a = y * 360 / aAxisDiameter / Math.PI;',
                                    '      var roundedX = Number(x.toFixed(decimal));',
                                    '      var roundedA = Number(a.toFixed(decimal));',
                                    '      var adjustedY = roundedA * aAxisDiameter * Math.PI / 360;',
                                    '      if (rapid) {',
                                    '        lastX = roundedX; lastY = adjustedY; lastA = roundedA;',
                                    '        return {x: x.toFixed(decimal), a: a.toFixed(decimal)};',
                                    '      } else {',
                                    '        var dx = roundedX - lastX, dy = adjustedY - lastY, da = roundedA - lastA;',
                                    '        var travelTime = Math.sqrt(dx * dx + dy * dy) / cutFeed;',
                                    '        var f = 0;',
                                    '        if (dx) f = Math.abs(dx) / travelTime;',
                                    '        else if (da) f = Math.abs(da) / travelTime;',
                                    '        else return null;',
                                    '        lastX = roundedX; lastY = adjustedY; lastA = roundedA;',
                                    '        return {x: x.toFixed(decimal), a: a.toFixed(decimal), f: f.toFixed(decimal)};',
                                    '      }',
                                    '    } else {',
                                    '      return {x: x.toFixed(decimal), y: y.toFixed(decimal)};',
                                    '    }',
                                    '  }',
                                    '',
'  var gcode = "";',
                        '  var cam = { separateTabs: self.__cam__.separateTabs };',
                        '',
                        '  for (var pass = 0; pass < passes; ++pass) {',
                        '    if (hookPassStart) gcode += hookPassStart;',
                        '    gcode += "\\n\\n; Pass " + pass + "\\r\\n";',
                        '    if (useBlower && useBlower.blowerOn) {',
                        '      gcode += "\\r\\n " + useBlower.blowerOn + "; Enable Air assist\\r\\n";',
                        '    }',
                                    '    var usedZposition = false;',
                                    '    for (var pathIndex = 0; pathIndex < paths.length; ++pathIndex) {',
                                    '      var path = paths[pathIndex].path;',
                                    '      if (path.length === 0) continue;',
                                    '      gcode += "\\r\\n; Pass " + pass + " Path " + pathIndex + "\\r\\n";',
                                    '      var separatedPaths = cam.separateTabs(path, tabGeometry);',
                                    '      for (var selIdx = 0; selIdx < separatedPaths.length; ++selIdx) {',
                                    '        var selectedPath = separatedPaths[selIdx];',
                                    '        if (selectedPath.length === 0) continue;',
                                    '        if (selIdx & 1) { gcode += "; Skip tab\\r\\n"; continue; }',
                                    '        gcode += generator.moveRapid(convertPoint(selectedPath[0], true)) + "\\r\\n";',
                                    '        if (useZ && !usedZposition) {',
                                    '          usedZposition = true;',
                                    '          var zHeight = useZ.startZ + useZ.offsetZ - (useZ.passDepth * pass);',
                                    '          gcode += "; Pass Z Height " + zHeight + "mm (Offset: " + useZ.offsetZ + "mm)\\r\\n";',
                                    '          gcode += "G0 Z" + zHeight.toFixed(decimal) + "\\r\\n\\r\\n";',
                                    '        }',
                                    '        gcode += generator.toolOn(gcodeToolOn, { i: laserOnS });',
                                    '        for (var i = 1; i < selectedPath.length; ++i) {',
                                    '          if (i === 1 && gcodeLaserIntensitySeparateLine) gcode += laserOnS + "\\n";',
                                    '          var action = convertPoint(selectedPath[i], false);',
                                    '          if (i === 1 && !gcodeLaserIntensitySeparateLine) action.i = laserOnS;',
                                    '          if (i === 1 && !useA) action.f = cutFeed;',
                                    '          gcode += generator.moveTool(action);',
                                    '          gcode += "\\r\\n";',
                                    '        }',
                                    '        gcode += generator.toolOff(gcodeToolOff, { i: laserOnS });',
                                    '      }',
                                    '    }',
                                    '    if (useBlower && useBlower.blowerOff) {',
                                    '      gcode += "\\r\\n " + useBlower.blowerOff + "; Disable Air assist\\r\\n";',
                                    '    }',
                                    '    if (hookPassEnd) gcode += hookPassEnd;',
                                    '  }',
                                    '  return gcode;',
                                    '}',
                                    '',
                                    'onmessage = function(event) {',
                                    '  var data = event.data;',
                                    '  var settings = data.settings, opIndex = data.opIndex, op = data.op;',
                                    '  var geometry = data.geometry || [], openGeometry = data.openGeometry || [];',
                                    '  var tabGeometry = data.tabGeometry || [];',
                                    '  var errors = [];',
                                    '  var showAlert = function(message, level) { errors.push({ message: message, level: level }); };',
                                    '  var progressFn = function() { postMessage(JSON.stringify({ event: "onProgress", gcode: null, errors: errors })); };',
                                    '  var done = function(gcode) {',
                                    '    if (gcode === false && errors.length) { postMessage(JSON.stringify({ event: "onError", errors: errors })); }',
                                    '    else { postMessage(JSON.stringify({ event: "onDone", gcode: gcode })); }',
                                    '    self.close();',
                                    '  };',
                                    '  try {',
                                    '    var cam = self.__cam__;',
                                    '    var mesh = self.__mesh__;',
                                    '    var mmToClipperScale = mesh.mmToClipperScale;',
                                    '    var ok = true;',
                                    '',
                                    '    if (op.type !== "Laser Cut" && op.type !== "Laser Fill Path") {',
                                    '      if (op.laserDiameter <= 0) { showAlert("Laser Diameter must be greater than 0", "danger"); ok = false; }',
                                    '    }',
                                    '    if (op.type === "Laser Fill Path") {',
                                    '      if (op.lineDistance <= 0) { showAlert("Line Distance must be greater than 0", "danger"); ok = false; }',
                                    '    }',
                                    '    if (op.laserPower < 0 || op.laserPower > 100) { showAlert("Laser Power must be in range [0, 100]", "danger"); ok = false; }',
                                    '    if (op.passes <= 0 || (op.passes | 0) !== +op.passes) { showAlert("Passes must be integer > 0", "danger"); ok = false; }',
                                    '    if (op.cutRate <= 0) { showAlert("Cut Rate must be greater than 0", "danger"); ok = false; }',
                                    '    if (op.useA && op.aAxisDiameter <= 0) { showAlert("A axis diameter must be greater than 0", "danger"); ok = false; }',
                                    '    if (settings.machineZEnabled && (op.startHeight === "" || isNaN(op.startHeight))) {',
                                    '      showAlert("Start Height must be a valid number", "danger"); ok = false;',
                                    '    }',
                                    '    if (!ok) { done(false); return; }',
                                    '',
                                    '    var camPaths = [];',
                                    '    if (op.type === "Laser Cut") {',
                                    '      camPaths = cam.cut(geometry, openGeometry, false);',
                                    '    } else if (op.type === "Laser Cut Inside") {',
                                    '      if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);',
                                    '      camPaths = cam.insideOutside(geometry, op.laserDiameter * mmToClipperScale, true, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === "Climb", false);',
                                    '    } else if (op.type === "Laser Cut Outside") {',
                                    '      if (op.margin) geometry = mesh.offset(geometry, op.margin * mmToClipperScale);',
                                    '      camPaths = cam.insideOutside(geometry, op.laserDiameter * mmToClipperScale, false, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === "Climb", false);',
                                    '    } else if (op.type === "Laser Fill Path") {',
                                    '      if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);',
                                    '      camPaths = cam.fillPath(geometry, op.lineDistance * mmToClipperScale, op.lineAngle);',
                                    '    }',
                                    '    cam.reduceCamPaths(camPaths, op.segmentLength * mmToClipperScale);',
                                    '',
                                    '    var feedScale = 1;',
                                    '    if (settings.toolFeedUnits === "mm/s") feedScale = 60;',
                                    '',
                                    '    var md = "\\r\\n;" + "\\r\\n; Operation:    " + opIndex +',
                                    '        "\\r\\n; Type:         " + op.type +',
                                    '        "\\r\\n; Paths:        " + camPaths.length +',
                                    '        "\\r\\n; Passes:       " + op.passes +',
                                    '        "\\r\\n; Cut rate:     " + op.cutRate + " " + settings.toolFeedUnits +',
                                    '        "\\r\\n;\\r\\n";',
                                    '    if (op.hookOperationStart && op.hookOperationStart.length) md += op.hookOperationStart;',
                                    '',
                                    '    var generator = getGenerator(settings.gcodeGenerator, settings);',
                                    '',
                                    '    md += getGcode({',
                                    '      generator: generator,',
                                    '      paths: camPaths,',
                                    '      scale: 1 / mmToClipperScale,',
                                    '      offsetX: 0, offsetY: 0, decimal: 2,',
                                    '      cutFeed: op.cutRate * feedScale,',
                                    '      laserPower: op.laserPower, passes: op.passes,',
                                    '      useA: op.useA,',
                                    '      useZ: settings.machineZEnabled ? { startZ: Number(op.startHeight), offsetZ: settings.machineZToolOffset, passDepth: op.passDepth } : false,',
                                    '      useBlower: op.useBlower ? { blowerOn: settings.machineBlowerGcodeOn, blowerOff: settings.machineBlowerGcodeOff } : false,',
                                    '      aAxisDiameter: op.aAxisDiameter,',
                                    '      tabGeometry: tabGeometry,',
                                    '      gcodeToolOn: settings.gcodeToolOn,',
                                    '      gcodeToolOff: settings.gcodeToolOff,',
                                    '      gcodeLaserIntensity: settings.gcodeLaserIntensity,',
                                    '      gcodeLaserIntensitySeparateLine: settings.gcodeLaserIntensitySeparateLine,',
                                    '      gcodeSMinValue: settings.gcodeSMinValue,',
                                    '      gcodeSMaxValue: settings.gcodeSMaxValue,',
                                    '      hookPassStart: op.hookPassStart,',
                                    '      hookPassEnd: op.hookPassEnd',
                                    '    });',
                                    '',
                                    '    if (op.hookOperationEnd && op.hookOperationEnd.length) md += op.hookOperationEnd;',
                                    '    done(md);',
                                    '  } catch(e) {',
                                    '    console.error(e);',
                                    '    postMessage(JSON.stringify({ event: "onError", errors: [{ message: e.toString(), level: 10 }] }));',
                                    '  }',
                                    '}'
                                ].join('\n');

                                invokeWebWorker(lasercutWorkerCode, { settings: settings, opIndex: opIndex, op: op, geometry: geometry, openGeometry: openGeometry, tabGeometry: tabGeometry }, cb, jobIndex);

                            } else if (op.type === 'Laser Raster') {

                                getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, function (gcode) { jobDone(gcode, cb); }, progress, jobIndex, QE.chunk, workers);

                            } else if (op.type === 'Laser Raster Merge') {

                                getLaserRasterMergeGcodeFromOp(settings, documentCacheHolder, opIndex, op, filteredDocIds, showAlert, function (gcode) { jobDone(gcode, cb); }, progress, jobIndex, QE.chunk, workers);

                            } else if (op.type.substring(0, 5) === 'Mill ') {

                                var millWorkerCode = [
                                    'LW = { mesh: self.__mesh__, cam: self.__cam__ };',
                                    '',
                                    'function getGcode(props) {',
                                    '  var paths = props.paths, ramp = props.ramp, scale = props.scale, useZ = props.useZ;',
                                    '  var offsetX = props.offsetX, offsetY = props.offsetY, decimal = props.decimal;',
                                    '  var topZ = props.topZ, botZ = props.botZ, safeZ = props.safeZ, passDepth = props.passDepth;',
                                    '  var plungeFeed = props.plungeFeed, cutFeed = props.cutFeed;',
                                    '  var tabGeometry = props.tabGeometry, tabZ = props.tabZ, toolSpeed = props.toolSpeed;',
                                    '  if (safeZ === undefined || isNaN(safeZ)) safeZ = 10;',
                                    '  if (topZ === undefined || isNaN(topZ)) topZ = 0;',
                                    '  if (botZ === undefined || isNaN(botZ)) botZ = -1;',
                                    '  if (passDepth === undefined || isNaN(passDepth)) passDepth = 1;',
                                    '  if (plungeFeed === undefined || isNaN(plungeFeed)) plungeFeed = 300;',
                                    '  if (cutFeed === undefined || isNaN(cutFeed)) cutFeed = 300;',
                                    '  if (decimal === undefined || isNaN(decimal)) decimal = 3;',
                                    '  var plungeFeedGcode = " F" + plungeFeed;',
                                    '  var cutFeedGcode = " F" + cutFeed;',
                                    '  if (useZ === undefined) useZ = false;',
                                    '  if (tabGeometry === undefined || tabZ <= botZ) { tabGeometry = []; tabZ = botZ; }',
                                    '  var retractGcode = "; Retract\\r\\nG0 Z" + safeZ.toFixed(decimal) + "\\r\\n";',
                                    '  var retractForTabGcode = "; Retract for tab\\r\\nG0 Z" + tabZ.toFixed(decimal) + "\\r\\n";',
                                    '  var gcode = retractGcode;',
                                    '  var cam = self.__cam__;',
                                    '  function getX(p) { return p.X * scale + offsetX; }',
                                    '  function getY(p) { return p.Y * scale + offsetY; }',
                                    '  function convertPoint(p, uz) {',
                                    '    var r = " X" + (p.X * scale + offsetX).toFixed(decimal) + " Y" + (p.Y * scale + offsetY).toFixed(decimal);',
                                    '    if (uz) r += " Z" + (p.Z * scale + topZ).toFixed(decimal);',
                                    '    return r;',
                                    '  }',
                                    '  for (var pathIndex = 0; pathIndex < paths.length; ++pathIndex) {',
                                    '    var path = paths[pathIndex];',
                                    '    var origPath = path.path;',
                                    '    if (origPath.length === 0) continue;',
                                    '    var separatedPaths = cam.separateTabs(origPath, tabGeometry);',
                                    '    gcode += "\\r\\n; Path " + pathIndex + "\\r\\n";',
                                    '    var currentZ = safeZ;',
                                    '    var finishedZ = topZ;',
                                    '    while (finishedZ > botZ || useZ) {',
                                    '      var nextZ = Math.max(finishedZ - passDepth, botZ);',
                                    '      if (currentZ < safeZ && (!path.safeToClose || tabGeometry.length > 0)) {',
                                    '        gcode += retractGcode; currentZ = safeZ;',
                                    '      }',
                                    '      if (tabGeometry.length === 0) currentZ = finishedZ;',
                                    '      else currentZ = Math.max(finishedZ, tabZ);',
                                    '      gcode += "; Rapid to initial position\\r\\nG0" + convertPoint(origPath[0], false) + "\\r\\nG0 Z" + currentZ.toFixed(decimal) + "\\r\\n";',
                                    '      var selectedPaths;',
                                    '      if (nextZ >= tabZ || useZ) selectedPaths = [origPath];',
                                    '      else selectedPaths = separatedPaths;',
                                    '      for (var selIdx = 0; selIdx < selectedPaths.length; ++selIdx) {',
                                    '        var selectedPath = selectedPaths[selIdx];',
                                    '        if (selectedPath.length === 0) continue;',
                                    '        if (!useZ) {',
                                    '          var selectedZ;',
                                    '          if (selIdx & 1) selectedZ = tabZ;',
                                    '          else selectedZ = nextZ;',
                                    '          if (selectedZ < currentZ) {',
                                    '            var executedRamp = false;',
                                    '            if (ramp) {',
                                    '              var minPlungeTime = (currentZ - selectedZ) / plungeFeed;',
                                    '              var idealDist = cutFeed * minPlungeTime;',
                                    '              var end, totalDist = 0;',
                                    '              for (end = 1; end < selectedPath.length; ++end) {',
                                    '                if (totalDist > idealDist) break;',
                                    '                totalDist += 2 * cam.dist(getX(selectedPath[end-1]), getY(selectedPath[end-1]), getX(selectedPath[end]), getY(selectedPath[end]));',
                                    '              }',
                                    '              if (totalDist > 0) {',
                                    '                gcode += "; ramp\\r\\n"; executedRamp = true;',
                                    '                var rampPath = selectedPath.slice(0, end).concat(selectedPath.slice(0, end-1).reverse());',
                                    '                var distTravelled = 0;',
                                    '                for (var ri = 1; ri < rampPath.length; ++ri) {',
                                    '                  distTravelled += cam.dist(getX(rampPath[ri-1]), getY(rampPath[ri-1]), getX(rampPath[ri]), getY(rampPath[ri]));',
                                    '                  var newZ = currentZ + distTravelled / totalDist * (selectedZ - currentZ);',
                                    '                  gcode += "G1" + convertPoint(rampPath[ri], false) + " Z" + newZ.toFixed(decimal);',
                                    '                  if (ri === 1) {',
                                    '                    gcode += " F" + Math.min(totalDist / minPlungeTime, cutFeed).toFixed(decimal);',
                                    '                    if (toolSpeed) gcode += " S" + toolSpeed;',
                                    '                  }',
                                    '                  gcode += "\\r\\n";',
                                    '                }',
                                    '              }',
                                    '            }',
                                    '            if (!executedRamp) {',
                                    '              gcode += "; plunge\\r\\nG1 Z" + selectedZ.toFixed(decimal) + plungeFeedGcode;',
                                    '              if (toolSpeed) gcode += " S" + toolSpeed;',
                                    '              gcode += "\\r\\n";',
                                    '            }',
                                    '          } else if (selectedZ > currentZ) {',
                                    '            gcode += retractForTabGcode;',
                                    '          }',
                                    '          currentZ = selectedZ;',
                                    '        }',
                                    '        gcode += "; cut\\r\\n";',
                                    '        for (var i = 1; i < selectedPath.length; ++i) {',
                                    '          gcode += "G1" + convertPoint(selectedPath[i], useZ);',
                                    '          if (i === 1) { gcode += cutFeedGcode; if (toolSpeed) gcode += " S" + toolSpeed; }',
                                    '          gcode += "\\r\\n";',
                                    '        }',
                                    '      }',
                                    '      finishedZ = nextZ;',
                                    '      if (useZ) break;',
                                    '    }',
                                    '    gcode += retractGcode;',
                                    '  }',
                                    '  return gcode;',
                                    '}',
                                    '',
                                    'onmessage = function(event) {',
                                    '  var data = event.data;',
                                    '  var settings = data.settings, opIndex = data.opIndex, op = data.op;',
                                    '  var geometry = data.geometry || [], openGeometry = data.openGeometry || [];',
                                    '  var tabGeometry = data.tabGeometry || [];',
                                    '  var errors = [];',
                                    '  var showAlert = function(message, level) { errors.push({ message: message, level: level }); };',
                                    '  var progressFn = function() { postMessage(JSON.stringify({ event: "onProgress", gcode: null, errors: errors })); };',
                                    '  var done = function(gcode) {',
                                    '    if (gcode === false && errors.length) { postMessage(JSON.stringify({ event: "onError", errors: errors })); }',
                                    '    else { postMessage(JSON.stringify({ event: "onDone", gcode: gcode })); }',
                                    '  };',
                                    '  try {',
                                    '    var cam = self.__cam__;',
                                    '    var mesh = self.__mesh__;',
                                    '    var mmToClipperScale = mesh.mmToClipperScale;',
                                    '    var ok = true;',
                                    '    if (op.millStartZ > op.millRapidZ) { showAlert("millStartZ must be <= millRapidZ", "danger"); ok = false; }',
                                    '    if (op.passDepth <= 0) { showAlert("Pass Depth must be greater than 0", "danger"); ok = false; }',
                                    '    if (op.type === "Mill V Carve") {',
                                    '      if (op.toolAngle <= 0 || op.toolAngle >= 180) { showAlert("Tool Angle must be in range (0, 180)", "danger"); ok = false; }',
                                    '    } else {',
                                    '      if (op.millEndZ >= op.millStartZ) { showAlert("millEndZ must be < millStartZ", "danger"); ok = false; }',
                                    '      if (op.type !== "Mill Cut" && op.toolDiameter <= 0) { showAlert("Tool Diameter must be greater than 0", "danger"); ok = false; }',
                                    '      if (op.stepOver <= 0 || op.stepOver > 100) { showAlert("Step Over must be in range 0-100%", "danger"); ok = false; }',
                                    '    }',
                                    '    if (op.plungeRate <= 0) { showAlert("Plunge Rate must be greater than 0", "danger"); ok = false; }',
                                    '    if (op.cutRate <= 0) { showAlert("Cut Rate must be greater than 0", "danger"); ok = false; }',
                                    '    if (!ok) { done(false); return; }',
                                    '    if (tabGeometry && op.toolDiameter > 0)',
                                    '      tabGeometry = mesh.offset(tabGeometry, op.toolDiameter / 2 * mmToClipperScale);',
                                    '    var camPaths = [];',
                                    '    if (op.type === "Mill Pocket") {',
                                    '      if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);',
                                    '      camPaths = cam.pocket(geometry, op.toolDiameter * mmToClipperScale, op.stepOver, op.direction === "Climb");',
                                    '    } else if (op.type === "Mill Cut") {',
                                    '      camPaths = cam.cut(geometry, openGeometry, op.direction === "Climb");',
                                    '    } else if (op.type === "Mill Cut Inside") {',
                                    '      if (op.margin) geometry = mesh.offset(geometry, -op.margin * mmToClipperScale);',
                                    '      camPaths = cam.insideOutside(geometry, op.toolDiameter * mmToClipperScale, true, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === "Climb", true);',
                                    '    } else if (op.type === "Mill Cut Outside") {',
                                    '      if (op.margin) geometry = mesh.offset(geometry, op.margin * mmToClipperScale);',
                                    '      camPaths = cam.insideOutside(geometry, op.toolDiameter * mmToClipperScale, false, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === "Climb", true);',
                                    '    } else if (op.type === "Mill V Carve") {',
                                    '      camPaths = cam.vCarve(geometry, op.toolAngle, op.passDepth * mmToClipperScale);',
                                    '    }',
                                    '    for (var ci = 0; ci < camPaths.length; ci++) {',
                                    '      var pp = camPaths[ci].path;',
                                    '      for (var pi = 0; pi < pp.length; pi++) {',
                                    '        pp[pi].X = Math.round(pp[pi].X / mmToClipperScale * 1000) * mmToClipperScale / 1000;',
                                    '        pp[pi].Y = Math.round(pp[pi].Y / mmToClipperScale * 1000) * mmToClipperScale / 1000;',
                                    '      }',
                                    '    }',
                                    '    cam.reduceCamPaths(camPaths, op.segmentLength * mmToClipperScale);',
                                    '    var feedScale = 1;',
                                    '    if (settings.toolFeedUnits === "mm/s") feedScale = 60;',
                                    '    var gcode = "\\r\\n;" + "\\r\\n; Operation:    " + opIndex + "\\r\\n; Type:         " + op.type + "\\r\\n; Paths:        " + camPaths.length + "\\r\\n; Direction:    " + op.direction + "\\r\\n; Rapid Z:      " + op.millRapidZ + "\\r\\n; Start Z:      " + op.millStartZ + "\\r\\n; End Z:        " + op.millEndZ + "\\r\\n; Pass Depth:   " + op.passDepth + "\\r\\n; Plunge rate:  " + op.plungeRate + " " + settings.toolFeedUnits + "\\r\\n; Cut rate:     " + op.cutRate + " " + settings.toolFeedUnits + "\\r\\n;\\r\\n";',
                                    '    if (op.hookOperationStart && op.hookOperationStart.length) gcode += op.hookOperationStart;',
                                    '    gcode += getGcode({',
                                    '      paths: camPaths, ramp: op.ramp, scale: 1 / mmToClipperScale, useZ: op.type === "Mill V Carve",',
                                    '      offsetX: 0, offsetY: 0, decimal: 3, topZ: op.millStartZ, botZ: op.millEndZ,',
                                    '      safeZ: op.millRapidZ, passDepth: op.passDepth, plungeFeed: op.plungeRate * feedScale,',
                                    '      cutFeed: op.cutRate * feedScale, tabGeometry: op.type === "Mill V Carve" ? [] : tabGeometry,',
                                    '      tabZ: -op.tabDepth, toolSpeed: op.toolSpeed',
                                    '    });',
                                    '    if (op.hookOperationEnd && op.hookOperationEnd.length) gcode += op.hookOperationEnd;',
                                    '    done(gcode);',
                                    '  } catch(e) {',
                                    '    console.error(e);',
                                    '    postMessage(JSON.stringify({ event: "onError", errors: [{ message: e.toString(), level: 10 }] }));',
                                    '  }',
                                    '}'
                                ].join('\n');

                                invokeWebWorker(millWorkerCode, { settings: settings, opIndex: opIndex, op: op, geometry: geometry, openGeometry: openGeometry, tabGeometry: tabGeometry }, cb, jobIndex);

                            } else if (op.type.substring(0, 6) === 'Lathe ') {

                                var latheWorkerCode = [
                                    'LW = { mesh: self.__mesh__, cam: self.__cam__ };',
                                    '',
                                    'function LatheGcodeGenerator(props) {',
                                    '  this.decimal = props.decimal || 2;',
                                    '  this.toolFeedUnits = props.toolFeedUnits;',
                                    '  this.feedScale = this.toolFeedUnits === "mm/s" ? 60 : 1;',
                                    '  this.gcode = "";',
                                    '  this.motionMode = undefined; this.f = undefined; this.z = undefined; this.x = undefined;',
                                    '}',
                                    'LatheGcodeGenerator.prototype.getMotion = function(mode) {',
                                    '  if (this.motionMode === mode) return ""; this.motionMode = mode; return mode + " ";',
                                    '};',
                                    'LatheGcodeGenerator.prototype.getFeed = function(f) {',
                                    '  var strF = (f * this.feedScale).toFixed(this.decimal);',
                                    '  var roundedF = Number(strF); if (this.f === roundedF) return ""; this.f = roundedF; return "F" + strF + " ";',
                                    '};',
                                    'LatheGcodeGenerator.prototype.rapidZ = function(z) {',
                                    '  var strZ = z.toFixed(this.decimal); var roundedZ = Number(strZ);',
                                    '  if (this.z === roundedZ) return; this.z = roundedZ; this.gcode += this.getMotion("G0") + "Z" + strZ + "\\n";',
                                    '};',
                                    'LatheGcodeGenerator.prototype.rapidXDia = function(xDia, backSide) {',
                                    '  if (!backSide) xDia = -xDia; var strX = (xDia / 2).toFixed(this.decimal);',
                                    '  var roundedX = Number(strX); if (this.x === roundedX) return;',
                                    '  this.x = roundedX; this.gcode += this.getMotion("G0") + "X" + strX + "\\n";',
                                    '};',
                                    'LatheGcodeGenerator.prototype.moveZ = function(z, f) {',
                                    '  var strZ = z.toFixed(this.decimal); var roundedZ = Number(strZ);',
                                    '  if (this.z === roundedZ) return; this.z = roundedZ;',
                                    '  this.gcode += this.getMotion("G1") + this.getFeed(f) + "Z" + strZ + "\\n";',
                                    '};',
                                    'LatheGcodeGenerator.prototype.moveXDia = function(xDia, backSide, f) {',
                                    '  if (!backSide) xDia = -xDia; var strX = (xDia / 2).toFixed(this.decimal);',
                                    '  var roundedX = Number(strX); if (this.x === roundedX) return;',
                                    '  this.x = roundedX; this.gcode += this.getMotion("G1") + this.getFeed(f) + "X" + strX + "\\n";',
                                    '};',
                                    '',
                                    'function latheConvFaceTurn(gen, showAlert, props) {',
                                    '  var latheToolBackSide = props.latheToolBackSide;',
                                    '  var latheRapidToDiameter = props.latheRapidToDiameter;',
                                    '  var latheRapidToZ = props.latheRapidToZ;',
                                    '  var latheStartZ = props.latheStartZ;',
                                    '  var latheRoughingFeed = props.latheRoughingFeed;',
                                    '  var latheRoughingDepth = props.latheRoughingDepth;',
                                    '  var latheFinishFeed = props.latheFinishFeed;',
                                    '  var latheFinishDepth = props.latheFinishDepth;',
                                    '  var latheFinishExtraPasses = props.latheFinishExtraPasses;',
                                    '  var latheFace = props.latheFace;',
                                    '  var latheFaceEndDiameter = props.latheFaceEndDiameter;',
                                    '  var latheTurns = props.latheTurns;',
                                    '  if (latheRapidToDiameter <= 0) return showAlert("latheRapidToDiameter <= 0", "danger");',
                                    '  if (latheStartZ > latheRapidToZ) return showAlert("latheStartZ > latheRapidToZ", "danger");',
                                    '  if (latheRoughingFeed <= 0) return showAlert("latheRoughingFeed <= 0", "danger");',
                                    '  if (latheRoughingDepth <= 0) return showAlert("latheRoughingDepth <= 0", "danger");',
                                    '  if (latheFinishFeed <= 0) return showAlert("latheFinishFeed <= 0", "danger");',
                                    '  if (latheFinishDepth < 0) return showAlert("latheFinishDepth < 0", "danger");',
                                    '  if (latheStartZ + latheFinishDepth > latheRapidToZ) return showAlert("latheStartZ + latheFinishDepth > latheRapidToZ", "danger");',
                                    '  if (latheFinishExtraPasses < 0) return showAlert("latheFinishExtraPasses < 0", "danger");',
                                    '  if (latheFace && latheFaceEndDiameter >= latheRapidToDiameter) return showAlert("latheFace && latheFaceEndDiameter >= latheRapidToDiameter", "danger");',
                                    '  if (!latheFace && !latheTurns.length) return showAlert("!latheFace && !latheTurns.length", "danger");',
                                    '  for (var i = 0; i < latheTurns.length; ++i) {',
                                    '    if (latheTurns[i].startDiameter < 0) return showAlert("bad startDiameter");',
                                    '    if (i > 0 && latheTurns[i].startDiameter < latheTurns[i-1].endDiameter) return showAlert("bad turn order");',
                                    '    if (latheTurns[i].startDiameter >= latheRapidToDiameter) return showAlert("bad startDiameter");',
                                    '    if (latheTurns[i].endDiameter <= 0) return showAlert("bad endDiameter");',
                                    '    if (latheTurns[i].endDiameter < latheTurns[i].startDiameter) return showAlert("bad endDiameter");',
                                    '    if (latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter) return showAlert("bad endDiameter");',
                                    '    if (latheTurns[i].endDiameter !== latheTurns[i].startDiameter) return showAlert("bad endDiameter");',
                                    '    if (latheTurns[i].length <= 0) return showAlert("bad length");',
                                    '  }',
                                    '  gen.gcode += "\\r\\n; latheToolBackSide: " + latheToolBackSide + "\\r\\n; latheRapidToDiameter: " + latheRapidToDiameter + " mm\\r\\n; latheRapidToZ: " + latheRapidToZ + " mm\\r\\n; latheStartZ: " + latheStartZ + " mm\\r\\n; latheRoughingFeed: " + latheRoughingFeed + gen.toolFeedUnits + "\\r\\n; latheRoughingDepth: " + latheRoughingDepth + " mm\\r\\n; latheFinishFeed: " + latheFinishFeed + gen.toolFeedUnits + "\\r\\n; latheFinishDepth: " + latheFinishDepth + " mm\\r\\n; latheFinishExtraPasses: " + latheFinishExtraPasses + "\\r\\n; latheFace: " + latheFace + "\\r\\n; latheFaceEndDiameter: " + latheFaceEndDiameter + " mm";',
                                    '  if (latheTurns.length) {',
                                    '    gen.gcode += "\\r\\n; turns:";',
                                    '    for (var t = 0; t < latheTurns.length; t++) {',
                                    '      gen.gcode += "\\r\\n;     startDiameter: " + latheTurns[t].startDiameter + " mm\\r\\n;     endDiameter: " + latheTurns[t].endDiameter + " mm\\r\\n;     length: " + latheTurns[t].length + " mm";',
                                    '    }',
                                    '  }',
                                    '  gen.gcode += "\\n\\n; Rapid\\n";',
                                    '  gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);',
                                    '  gen.rapidZ(latheRapidToZ);',
                                    '  if (latheFace) {',
                                    '    gen.gcode += "\\n; Face roughing\\n";',
                                    '    var z = latheRapidToZ;',
                                    '    while (true) {',
                                    '      var nextZ = Math.max(z - latheRoughingDepth, latheStartZ + latheFinishDepth);',
                                    '      if (nextZ === z) break; z = nextZ;',
                                    '      gen.moveZ(z, latheRoughingFeed);',
                                    '      gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheRoughingFeed);',
                                    '      gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheRoughingFeed);',
                                    '      gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);',
                                    '    }',
                                    '    gen.gcode += "\\n; Face finishing\\n";',
                                    '    var n = latheFinishExtraPasses;',
                                    '    if (z > latheStartZ) { ++n; z = latheStartZ; }',
                                    '    for (var fi = 0; fi < n; ++fi) {',
                                    '      gen.moveZ(z, latheFinishFeed);',
                                    '      gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheFinishFeed);',
                                    '      gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheFinishFeed);',
                                    '      gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);',
                                    '    }',
                                    '    latheRapidToZ = Math.min(z + latheRoughingDepth, latheRapidToZ);',
                                    '    gen.rapidZ(latheRapidToZ);',
                                    '  }',
                                    '  if (latheTurns.length) {',
                                    '    gen.gcode += "\\n; Turn roughing\\n";',
                                    '    var turnRapidToDiameter = latheRapidToDiameter;',
                                    '    var startX = turnRapidToDiameter - latheRoughingDepth;',
                                    '    while (true) {',
                                    '      var cx = startX, cz = latheRapidToZ;',
                                    '      var turnStartZ = latheStartZ + latheFinishDepth;',
                                    '      var done = false;',
                                    '      for (var ti = 0; ti < latheTurns.length; ti++) {',
                                    '        var turn = latheTurns[ti];',
                                    '        if (cx < turn.startDiameter + latheFinishDepth && turn.startDiameter + latheFinishDepth < startX + latheRoughingDepth)',
                                    '          cx = turn.startDiameter + latheFinishDepth;',
                                    '        if (cx < turn.startDiameter + latheFinishDepth) {',
                                    '          if (ti === 0) { done = true; break; }',
                                    '          gen.moveXDia(cx, latheToolBackSide, latheRoughingFeed);',
                                    '          cz = turnStartZ; gen.moveZ(cz, latheRoughingFeed);',
                                    '          gen.moveXDia(Math.min(cx + latheRoughingDepth, turnRapidToDiameter), latheToolBackSide, latheRoughingFeed);',
                                    '          break;',
                                    '        } else {',
                                    '          gen.moveXDia(cx, latheToolBackSide, latheRoughingFeed);',
                                    '          cz = turnStartZ - turn.length; gen.moveZ(cz, latheRoughingFeed);',
                                    '        }',
                                    '        turnStartZ -= turn.length;',
                                    '      }',
                                    '      if (done) break;',
                                    '      turnRapidToDiameter = Math.min(turnRapidToDiameter, cx + latheRoughingDepth);',
                                    '      startX -= latheRoughingDepth;',
                                    '      gen.moveXDia(turnRapidToDiameter, latheToolBackSide, latheRoughingFeed);',
                                    '      gen.rapidZ(latheRapidToZ);',
                                    '    }',
                                    '    gen.gcode += "\\n; Turn finishing\\n";',
                                    '    gen.rapidXDia(latheTurns[0].startDiameter, latheToolBackSide);',
                                    '    var fz = latheStartZ;',
                                    '    for (var tf = 0; tf < latheTurns.length; tf++) {',
                                    '      gen.moveXDia(latheTurns[tf].startDiameter, latheToolBackSide, latheFinishFeed);',
                                    '      fz -= latheTurns[tf].length; gen.moveZ(fz, latheFinishFeed);',
                                    '    }',
                                    '    gen.moveXDia(latheRapidToDiameter, latheToolBackSide, latheFinishFeed);',
                                    '    gen.rapidZ(latheRapidToZ);',
                                    '  }',
                                    '  gen.gcode += "\\n";',
                                    '}',
                                    '',
                                    'onmessage = function(event) {',
                                    '  var data = event.data;',
                                    '  var settings = data.settings, opIndex = data.opIndex, op = data.op;',
                                    '  var errors = [];',
                                    '  var showAlert = function(msg, lvl) { errors.push({ message: msg, level: lvl }); };',
                                    '  var done = function(gcode) {',
                                    '    if (gcode === false && errors.length) { postMessage(JSON.stringify({ event: "onError", errors: errors })); }',
                                    '    else { postMessage(JSON.stringify({ event: "onDone", gcode: gcode })); }',
                                    '  };',
                                    '  try {',
                                    '    var gen = new LatheGcodeGenerator({ decimal: 2, toolFeedUnits: settings.toolFeedUnits });',
                                    '    gen.gcode = "\\r\\n;" + "\\r\\n; Operation: " + opIndex + "\\r\\n; Type: " + op.type;',
                                    '    if (op.hookOperationStart && op.hookOperationStart.length) gen.gcode += op.hookOperationStart;',
                                    '    if (op.type === "Lathe Conv Face/Turn") latheConvFaceTurn(gen, showAlert, op);',
                                    '    if (op.hookOperationEnd && op.hookOperationEnd.length) gen.gcode += op.hookOperationEnd;',
                                    '    done(gen.gcode);',
                                    '  } catch(e) {',
                                    '    console.error(e);',
                                    '    postMessage(JSON.stringify({ event: "onError", errors: [{ message: e.toString(), level: 10 }] }));',
                                    '  }',
                                    '}'
                                ].join('\n');

                                invokeWebWorker(latheWorkerCode, { settings: settings, opIndex: opIndex, op: op, geometry: geometry, openGeometry: openGeometry, tabGeometry: tabGeometry }, cb, jobIndex);

                            } else {
                                showAlert('Unknown operation ' + op.type, 'warning');
                                cb();
                            }
                        })
                        .catch(function (err) {
                            showAlert(err.message, err.level);
                            QE.end();
                        });
                });
            }
        }

        QE.total = QE.length;
        QE.chunk = 100 / QE.total;

        progress(0);
        QE.on('success', function (result, job) {
            jobIndex++;
            var p = parseInt(jobIndex * QE.chunk);
            progress(p);
        });
        QE.on('end', function () {
            workers.forEach(function (ww) {
                ww.terminate();
            });
        });

        QE.start(function (err) {
            progress(100);
            var elapsed = (new Date().getTime() - starttime) / 1000;
            showAlert('Elapsed: ' + hhmmss(elapsed) + String(Number(elapsed - Math.floor(elapsed)).toFixed(3)).substr(1), 'info');
            done(settings.gcodeStart + gcode.join('\r\n') + settings.gcodeEnd);
        });

        return QE;
    }

    LW.gcode = {
        getGcode: getGcode,
        expandHookGCode: expandHookGCode,
        parseGcode: parseGcode,
        getLaserCutGcode: getLaserCutGcode,
        getLaserCutGcodeFromOp: getLaserCutGcodeFromOp,
        getLaserRasterGcodeFromOp: getLaserRasterGcodeFromOp,
        getLaserRasterMergeGcodeFromOp: getLaserRasterMergeGcodeFromOp,
        getMillGcode: getMillGcode,
        getMillGcodeFromOp: getMillGcodeFromOp,
        getLatheGcodeFromOp: getLatheGcodeFromOp,
        sendAsFile: sendAsFile,
        appendExt: appendExt,
        openDataWindow: openDataWindow,
        clamp: clamp,
        objectHasMatchingFields: objectHasMatchingFields,
        sameArrayContent: sameArrayContent,
        getGenerator: getGenerator,
        getBlobWorker: getBlobWorker,
        captureConsole: captureConsole,
        isObject: isObject,
        deepMerge: deepMerge,
        getDescendantProp: getDescendantProp,
        cast: cast,
        strtr: strtr
    };

})(window);
