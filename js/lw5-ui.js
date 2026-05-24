(function () {
  'use strict';

  var LW = window.LW = window.LW || {};
  var ui = LW.ui = LW.ui || {};
  var $ = window.$;

  // ---- Constants ----------------------------------------------------------

  var DOCUMENT_FILETYPES = '.png,.jpg,.jpeg,.bmp,.gif,.gcode,.g,.svg,.dxf,.tap,.gc,.nc';

  var OPERATION_FIELDS = {
    name: { name: 'name', label: 'Name', input: 'string' },
    filterFillColor: { name: 'filterFillColor', label: 'Filter Fill', input: 'string' },
    filterStrokeColor: { name: 'filterStrokeColor', label: 'Filter Stroke', input: 'string' },
    direction: { name: 'direction', label: 'Direction', input: 'select', options: ['Conventional', 'Climb'] },
    laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: 'number', min: 0, max: 100 },
    laserPowerRange: { name: 'laserPowerRange', label: 'Laser Power Range', units: '%', input: 'range', min: 0, max: 100 },
    laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: 'number', min: 0 },
    lineDistance: { name: 'lineDistance', label: 'Line Distance', units: 'mm', input: 'number', min: 0 },
    lineAngle: { name: 'lineAngle', label: 'Line Angle', units: 'deg', input: 'number' },
    toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: 'number', min: 0 },
    toolAngle: { name: 'toolAngle', label: 'Tool Angle', units: 'deg', input: 'number', min: 0, max: 180 },
    margin: { name: 'margin', label: 'Margin', units: 'mm', input: 'number' },
    passes: { name: 'passes', label: 'Passes', input: 'number', min: 1 },
    cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: 'number' },
    stepOver: { name: 'stepOver', label: 'Step Over', units: '%', input: 'number', min: 0, max: 100 },
    passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: 'number' },
    millRapidZ: { name: 'millRapidZ', label: 'Rapid Z', units: 'mm', input: 'number' },
    millStartZ: { name: 'millStartZ', label: 'Start Z', units: 'mm', input: 'number' },
    millEndZ: { name: 'millEndZ', label: 'End Z', units: 'mm', input: 'number' },
    startHeight: { name: 'startHeight', label: 'Start Height', units: 'mm', input: 'number' },
    segmentLength: { name: 'segmentLength', label: 'Segment', units: 'mm', input: 'number' },
    ramp: { name: 'ramp', label: 'Ramp Plunge', input: 'toggle' },
    plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: 'number' },
    cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: 'number' },
    toolSpeed: { name: 'toolSpeed', label: 'Tool Speed (0=Off)', units: 'rpm', input: 'number' },
    useA: { name: 'useA', label: 'Use A Axis', input: 'toggle' },
    aAxisDiameter: { name: 'aAxisDiameter', label: 'A Diameter', units: 'mm', input: 'number' },
    useBlower: { name: 'useBlower', label: 'Use Air Assist', input: 'toggle' },
    smoothing: { name: 'smoothing', label: 'Smoothing', input: 'toggle' },
    brightness: { name: 'brightness', label: 'Brightness', input: 'number', min: -255, max: 255 },
    contrast: { name: 'contrast', label: 'Contrast', input: 'number', min: -255, max: 255 },
    gamma: { name: 'gamma', label: 'Gamma', input: 'number', min: 0, max: 7.99 },
    grayscale: { name: 'grayscale', label: 'Grayscale', input: 'select', options: ['none', 'average', 'luma', 'luma-601', 'luma-709', 'luma-240', 'desaturation', 'decomposition-min', 'decomposition-max', 'red-chanel', 'green-chanel', 'blue-chanel'] },
    shadesOfGray: { name: 'shadesOfGray', label: 'Shades', input: 'number', min: 2, max: 256 },
    invertColor: { name: 'invertColor', label: 'Invert Color', input: 'toggle' },
    trimLine: { name: 'trimLine', label: 'Trim Pixels', input: 'toggle' },
    joinPixel: { name: 'joinPixel', label: 'Join Pixels', input: 'toggle' },
    burnWhite: { name: 'burnWhite', label: 'Burn White', input: 'toggle' },
    verboseGcode: { name: 'verboseGcode', label: 'Verbose GCode', input: 'toggle' },
    diagonal: { name: 'diagonal', label: 'Diagonal', input: 'toggle' },
    dithering: { name: 'dithering', label: 'Dithering', input: 'toggle' },
    overScan: { name: 'overScan', label: 'Over Scan', units: 'mm', input: 'number' },
    latheToolBackSide: { name: 'latheToolBackSide', label: 'Tool Back Side', input: 'toggle' },
    latheRapidToDiameter: { name: 'latheRapidToDiameter', label: 'Rapid To Diameter', units: 'mm', input: 'number' },
    latheRapidToZ: { name: 'latheRapidToZ', label: 'Rapid To Z', units: 'mm', input: 'number' },
    latheStartZ: { name: 'latheStartZ', label: 'Start Z', units: 'mm', input: 'number' },
    latheRoughingFeed: { name: 'latheRoughingFeed', label: 'Roughing Feed', units: 'mm/min', input: 'number' },
    latheRoughingDepth: { name: 'latheRoughingDepth', label: 'Roughing Depth', units: 'mm', input: 'number' },
    latheFinishFeed: { name: 'latheFinishFeed', label: 'Finish Feed', units: 'mm/min', input: 'number' },
    latheFinishDepth: { name: 'latheFinishDepth', label: 'Finish Depth', units: 'mm', input: 'number' },
    latheFinishExtraPasses: { name: 'latheFinishExtraPasses', label: 'Finish Extra Passes', input: 'number' },
    latheFace: { name: 'latheFace', label: 'Face', input: 'toggle' },
    latheFaceEndDiameter: { name: 'latheFaceEndDiameter', label: 'Face End Diameter', units: 'mm', input: 'number' }
  };

  var OPERATION_GROUPS = {
    'Filters': { collapsible: false, fields: ['smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering'] },
    'Macros': { collapsible: true, fields: ['hookOperationStart', 'hookOperationEnd', 'hookPassStart', 'hookPassEnd'] }
  };

  var OPERATION_TYPES = {
    'Laser Cut': { fields: ['name', 'laserPower', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength'] },
    'Laser Cut Inside': { fields: ['name', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength'] },
    'Laser Cut Outside': { fields: ['name', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength'] },
    'Laser Fill Path': { fields: ['name', 'lineDistance', 'lineAngle', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower'] },
    'Laser Raster': { fields: ['name', 'laserPowerRange', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower', 'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'diagonal', 'overScan', 'useA', 'aAxisDiameter', 'smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering'] },
    'Laser Raster Merge': { fields: ['name', 'laserPowerRange', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower', 'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'diagonal', 'overScan', 'useA', 'aAxisDiameter', 'smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering'] },
    'Mill Pocket': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'ramp'] },
    'Mill Cut': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'segmentLength', 'ramp'] },
    'Mill Cut Inside': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'segmentLength', 'ramp'] },
    'Mill Cut Outside': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'segmentLength', 'ramp'] },
    'Mill V Carve': { fields: ['name', 'direction', 'toolAngle', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate'] },
    'Lathe Conv Face/Turn': { fields: ['name', 'latheToolBackSide', 'latheRapidToDiameter', 'latheRapidToZ', 'latheStartZ', 'latheRoughingFeed', 'latheRoughingDepth', 'latheFinishFeed', 'latheFinishDepth', 'latheFinishExtraPasses', 'latheFace', 'latheFaceEndDiameter'] }
  };

  var OPERATION_TYPE_LIST = Object.keys(OPERATION_TYPES);
  var OPERATION_TYPE_DISPLAY = {};
  OPERATION_TYPE_LIST.forEach(function (t) { OPERATION_TYPE_DISPLAY[t] = t; });

  var settingsFields = [
    { id: 'machineWidth', label: 'Machine Width', type: 'number', section: 'Machine', group: 'Dimensions', units: 'mm' },
    { id: 'machineHeight', label: 'Machine Height', type: 'number', section: 'Machine', group: 'Dimensions', units: 'mm' },
    { id: 'showMachine', label: 'Show Machine', type: 'toggle', section: 'Machine', group: 'Origin' },
    { id: 'machineBottomLeftX', label: 'Machine Left X', type: 'number', section: 'Machine', group: 'Origin', units: 'mm' },
    { id: 'machineBottomLeftY', label: 'Machine Bottom Y', type: 'number', section: 'Machine', group: 'Origin', units: 'mm' },
    { id: 'machineBeamDiameter', label: 'Beam Diameter', type: 'number', section: 'Machine', group: 'Tool Head', units: 'mm' },
    { id: 'machineZEnabled', label: 'Z Stage Enable', type: 'toggle', section: 'Machine', group: 'Z Stage' },
    { id: 'machineZToolOffset', label: 'Tool Offset', type: 'number', section: 'Machine', group: 'Z Stage', units: 'mm' },
    { id: 'machineZStartHeight', label: 'Default Start Height', type: 'number', section: 'Machine', group: 'Z Stage', units: 'mm' },
    { id: 'machineAEnabled', label: 'A Axis Enable', type: 'toggle', section: 'Machine', group: 'A Axis' },
    { id: 'machineBlowerEnabled', label: 'Air Assist', type: 'toggle', section: 'Machine', group: 'Air Assist' },
    { id: 'machineBlowerGcodeOn', label: 'Gcode AA ON', type: 'textarea', section: 'Machine', group: 'Air Assist', rows: 3 },
    { id: 'machineBlowerGcodeOff', label: 'Gcode AA OFF', type: 'textarea', section: 'Machine', group: 'Air Assist', rows: 3 },
    { id: 'pxPerInch', label: 'PX Per Inch', type: 'number', section: 'Files', group: 'SVG', units: 'pxpi' },
    { id: 'forcePxPerInch', label: 'Force PX Per Inch', type: 'toggle', section: 'Files', group: 'SVG' },
    { id: 'dpiBitmap', label: 'Bitmap DPI', type: 'number', section: 'Files', group: 'Bitmaps', units: 'dpi' },
    { id: 'gcodeGenerator', label: 'GCode Generator', type: 'select', section: 'GCode', group: 'Generator', options: ['default', 'marlin'] },
    { id: 'gcodeStart', label: 'Gcode Start', type: 'textarea', section: 'GCode', group: 'GCode', rows: 5 },
    { id: 'gcodeEnd', label: 'Gcode End', type: 'textarea', section: 'GCode', group: 'GCode', rows: 5 },
    { id: 'gcodeHoming', label: 'Gcode Homing', type: 'textarea', section: 'GCode', group: 'GCode', rows: 5 },
    { id: 'gcodeToolOn', label: 'Tool ON', type: 'textarea', section: 'GCode', group: 'GCode', rows: 5 },
    { id: 'gcodeToolOff', label: 'Tool OFF', type: 'textarea', section: 'GCode', group: 'GCode', rows: 5 },
    { id: 'gcodeLaserIntensity', label: 'Laser Intensity', type: 'text', section: 'GCode', group: 'GCode' },
    { id: 'gcodeLaserIntensitySeparateLine', label: 'Intensity Separate Line', type: 'toggle', section: 'GCode', group: 'GCode' },
    { id: 'gcodeSMinValue', label: 'PWM Min S value', type: 'number', section: 'GCode', group: 'GCode' },
    { id: 'gcodeSMaxValue', label: 'PWM Max S value', type: 'number', section: 'GCode', group: 'GCode', defaultValue: 1000 },
    { id: 'gcodeCheckSizePower', label: 'Check-Size Power', type: 'number', section: 'GCode', group: 'GCode', units: '%' },
    { id: 'gcodeToolTestPower', label: 'Tool Test Power', type: 'number', section: 'GCode', group: 'GCode', units: '%' },
    { id: 'gcodeToolTestDuration', label: 'Tool Test duration', type: 'number', section: 'GCode', group: 'GCode', units: 'ms' },
    { id: 'gcodeConcurrency', label: 'Generation Threads', type: 'number', section: 'GCode', group: 'Performance' },
    { id: 'gcodeCurvePrecision', label: 'Curve Precision', type: 'number', section: 'GCode', group: 'Performance' },
    { id: 'toolFeedUnits', label: 'Feed Units', type: 'select', section: 'App', group: 'General', options: ['mm/s', 'mm/min'] },
    { id: 'toolGridWidth', label: 'Grid Width', type: 'number', section: 'App', group: 'Grid', units: 'mm' },
    { id: 'toolGridHeight', label: 'Grid Height', type: 'number', section: 'App', group: 'Grid', units: 'mm' },
    { id: 'toolGridMinorSpacing', label: 'Minor Spacing', type: 'number', section: 'App', group: 'Grid', units: 'mm' },
    { id: 'toolGridMajorSpacing', label: 'Major Spacing', type: 'number', section: 'App', group: 'Grid', units: 'mm' },
    { id: 'toolUseNumpad', label: 'Use Numpad', type: 'toggle', section: 'App', group: 'General' },
    { id: 'toolUseGamepad', label: 'Use Gamepad', type: 'toggle', section: 'App', group: 'General' },
    { id: 'toolCreateEmptyOps', label: 'Create Empty Ops', type: 'toggle', section: 'App', group: 'General' },
    { id: 'toolDisplayCache', label: 'Display Cache', type: 'toggle', section: 'App', group: 'General' },
    { id: 'toolImagePosition', label: 'Raster Image Position', type: 'select', section: 'App', group: 'General', options: ['TL', 'TR', 'C', 'BL', 'BR'] }
  ];

  // ---- Helpers ------------------------------------------------------------

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getDocIcon(type) {
    switch (type) {
      case 'svg': return 'fa-vector-square';
      case 'dxf': return 'fa-draw-polygon';
      case 'image': return 'fa-image';
      case 'gcode': return 'fa-file-code';
      default: return 'fa-file';
    }
  }

  function docTypeFromName(name) {
    var ext = name.split('.').pop().toLowerCase();
    if (ext === 'svg') return 'svg';
    if (ext === 'dxf') return 'dxf';
    if (['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'].indexOf(ext) !== -1) return 'image';
    if (['gcode', 'g', 'gc', 'nc', 'tap'].indexOf(ext) !== -1) return 'gcode';
    return 'unknown';
  }

  function parseSVGPathData(d) {
    var re = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    var tokens = [];
    var m;
    while ((m = re.exec(d)) !== null) {
      var cmd = m[1];
      var nums = m[2].trim().split(/[\s,]+/).filter(function (s) { return s !== ''; }).map(parseFloat);
      tokens.push({ cmd: cmd, args: nums });
    }
    return tokens;
  }

  function svgPathToRawPaths(d, pxPerInch) {
    var factor = 2540 / ((pxPerInch || 96) * 100);
    var tokens = parseSVGPathData(d);
    var x = 0, y = 0;
    var startX = 0, startY = 0;
    var currentPath = [];
    var paths = [];

    function addPoint(px, py) {
      currentPath.push(px * factor, py * factor);
    }

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      var cmd = t.cmd;
      var args = t.args;
      var j;

      switch (cmd) {
        case 'M':
          if (currentPath.length > 0) { paths.push(currentPath); currentPath = []; }
          x = args[0]; y = args[1];
          addPoint(x, y);
          startX = x; startY = y;
          break;
        case 'm':
          if (currentPath.length > 0) { paths.push(currentPath); currentPath = []; }
          x += args[0]; y += args[1];
          addPoint(x, y);
          startX = x; startY = y;
          break;
        case 'L':
          for (j = 0; j < args.length; j += 2) { x = args[j]; y = args[j + 1]; addPoint(x, y); }
          break;
        case 'l':
          for (j = 0; j < args.length; j += 2) { x += args[j]; y += args[j + 1]; addPoint(x, y); }
          break;
        case 'H':
          for (j = 0; j < args.length; j++) { x = args[j]; addPoint(x, y); }
          break;
        case 'h':
          for (j = 0; j < args.length; j++) { x += args[j]; addPoint(x, y); }
          break;
        case 'V':
          for (j = 0; j < args.length; j++) { y = args[j]; addPoint(x, y); }
          break;
        case 'v':
          for (j = 0; j < args.length; j++) { y += args[j]; addPoint(x, y); }
          break;
        case 'C':
          for (j = 0; j < args.length; j += 6) {
            var c1x = args[j], c1y = args[j + 1], c2x = args[j + 2], c2y = args[j + 3];
            x = args[j + 4]; y = args[j + 5];
            linearizeCubic(x, y, c1x, c1y, c2x, c2y, x, y, addPoint);
          }
          break;
        case 'c':
          for (j = 0; j < args.length; j += 6) {
            var dx1 = args[j], dy1 = args[j + 1], dx2 = args[j + 2], dy2 = args[j + 3];
            var dx = args[j + 4], dy = args[j + 5];
            linearizeCubic(x + dx, y + dy, x + dx1, y + dy1, x + dx2, y + dy2, x + dx, y + dy, addPoint);
            x += dx; y += dy;
          }
          break;
        case 'S':
          for (j = 0; j < args.length; j += 4) {
            c2x = args[j]; c2y = args[j + 1]; x = args[j + 2]; y = args[j + 3];
            addPoint(x, y);
          }
          break;
        case 's':
          for (j = 0; j < args.length; j += 4) {
            x += args[j + 2]; y += args[j + 3];
            addPoint(x, y);
          }
          break;
        case 'Q':
          for (j = 0; j < args.length; j += 4) {
            x = args[j + 2]; y = args[j + 3];
            addPoint(x, y);
          }
          break;
        case 'q':
          for (j = 0; j < args.length; j += 4) {
            x += args[j + 2]; y += args[j + 3];
            addPoint(x, y);
          }
          break;
        case 'Z':
        case 'z':
          if (currentPath.length >= 2 && (currentPath[currentPath.length - 2] !== startX * factor || currentPath[currentPath.length - 1] !== startY * factor)) {
            addPoint(startX, startY);
          }
          break;
        case 'A':
        case 'a':
          for (j = 0; j < args.length; j += 7) {
            x = args[j + 5]; y = args[j + 6];
            addPoint(x, y);
          }
          break;
      }
    }
    if (currentPath.length > 0) paths.push(currentPath);
    return paths;
  }

  function linearizeCubic(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, addPoint) {
    var numSegments = 10;
    var prevX = p1x, prevY = p1y;
    for (var i = 1; i <= numSegments; i++) {
      var t = i / numSegments;
      var u = 1 - t;
      var x = u * u * u * p1x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * p2x;
      var y = u * u * u * p1y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * p2y;
      addPoint(x, y);
    }
  }

  function parseSVGString(svgString, pxPerInch) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(svgString, 'image/svg+xml');
    var tags = [];
    var svg = doc.documentElement;
    var viewBox = svg.getAttribute('viewBox');
    var svgW, svgH;
    if (viewBox) {
      var vb = viewBox.split(/[\s,]+/).map(parseFloat);
      svgW = vb[2];
      svgH = vb[3];
    } else {
      svgW = parseFloat(svg.getAttribute('width')) || 800;
      svgH = parseFloat(svg.getAttribute('height')) || 600;
    }

    var elements = svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var tagName = el.tagName.toLowerCase();
      var rawPaths;
      var stroke = el.getAttribute('stroke') || '#000';
      var fill = el.getAttribute('fill') || '#000';
      var strokeWidth = parseFloat(el.getAttribute('stroke-width')) || 1;
      var transform = el.getAttribute('transform') || '';
      var d = '';

      if (tagName === 'path') {
        d = el.getAttribute('d') || '';
      } else if (tagName === 'rect') {
        var rx = parseFloat(el.getAttribute('x')) || 0;
        var ry = parseFloat(el.getAttribute('y')) || 0;
        var rw = parseFloat(el.getAttribute('width')) || 0;
        var rh = parseFloat(el.getAttribute('height')) || 0;
        d = 'M' + rx + ',' + ry + ' L' + (rx + rw) + ',' + ry + ' L' + (rx + rw) + ',' + (ry + rh) + ' L' + rx + ',' + (ry + rh) + ' Z';
      } else if (tagName === 'circle') {
        var cx = parseFloat(el.getAttribute('cx')) || 0;
        var cy = parseFloat(el.getAttribute('cy')) || 0;
        var r = parseFloat(el.getAttribute('r')) || 0;
        d = approxCircle(cx, cy, r);
      } else if (tagName === 'ellipse') {
        var ecx = parseFloat(el.getAttribute('cx')) || 0;
        var ecy = parseFloat(el.getAttribute('cy')) || 0;
        var erx = parseFloat(el.getAttribute('rx')) || 0;
        var ery = parseFloat(el.getAttribute('ry')) || 0;
        d = approxEllipse(ecx, ecy, erx, ery);
      } else if (tagName === 'line') {
        var lx1 = parseFloat(el.getAttribute('x1')) || 0;
        var ly1 = parseFloat(el.getAttribute('y1')) || 0;
        var lx2 = parseFloat(el.getAttribute('x2')) || 0;
        var ly2 = parseFloat(el.getAttribute('y2')) || 0;
        d = 'M' + lx1 + ',' + ly1 + ' L' + lx2 + ',' + ly2;
      } else if (tagName === 'polyline' || tagName === 'polygon') {
        var points = el.getAttribute('points') || '';
        d = 'M' + points.replace(/\s+/g, ' ').trim().split(' ').map(function (p, idx) {
          return idx === 0 ? p : p;
        }).join(' L');
        if (tagName === 'polygon') d += ' Z';
      }

      if (d) {
        rawPaths = svgPathToRawPaths(d, pxPerInch);
        tags.push({
          tagName: tagName,
          d: d,
          rawPaths: rawPaths,
          stroke: stroke,
          fill: fill,
          strokeWidth: strokeWidth,
          transform: transform
        });
      }
    }

    return {
      tags: tags,
      width: svgW,
      height: svgH
    };
  }

  function approxCircle(cx, cy, r) {
    var steps = 36;
    var d = 'M' + (cx + r) + ',' + cy;
    for (var i = 1; i <= steps; i++) {
      var a = (i / steps) * Math.PI * 2;
      d += ' L' + (cx + r * Math.cos(a)) + ',' + (cy + r * Math.sin(a));
    }
    d += ' Z';
    return d;
  }

  function approxEllipse(cx, cy, rx, ry) {
    var steps = 48;
    var d = 'M' + (cx + rx) + ',' + cy;
    for (var i = 1; i <= steps; i++) {
      var a = (i / steps) * Math.PI * 2;
      d += ' L' + (cx + rx * Math.cos(a)) + ',' + (cy + ry * Math.sin(a));
    }
    d += ' Z';
    return d;
  }

  function promisedImage(dataURL) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function (e) { reject(e); };
      img.src = dataURL;
    });
  }

  // ---- Toast --------------------------------------------------------------

  var toastContainer;

  ui.showToast = function (msg, type) {
    type = type || 'info';
    if (!toastContainer || !toastContainer.parent().length) {
      toastContainer = $('<div class="lw5-notification"></div>').appendTo('body');
    }
    var $toast = $('<div class="lw5-toast ' + type + '">' + msg + '</div>').appendTo(toastContainer).hide().fadeIn(200);
    setTimeout(function () {
      $toast.fadeOut(300, function () { $toast.remove(); });
    }, 3000);
  };

  // ---- Dialogs ------------------------------------------------------------

  function makeModalBackdrop() {
    var $bd = $('.lw5-modal-backdrop');
    if (!$bd.length) {
      $bd = $('<div class="lw5-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999"></div>').appendTo('body');
    }
    return $bd;
  }

  function makeModal(content) {
    var $bd = makeModalBackdrop();
    var $modal = $(
      '<div class="lw5-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);z-index:10000;min-width:320px;max-width:480px;box-shadow:0 8px 32px rgba(0,0,0,0.4)"></div>'
    ).html(content).appendTo('body');
    var close = function () {
      $modal.remove();
      if (!$('.lw5-modal').length) $bd.remove();
    };
    $modal.find('.lw5-modal-close').on('click', close);
    return { modal: $modal, close: close, backdrop: $bd };
  }

  ui.alert = function (message) {
    var dlg = makeModal(
      '<div class="lw5-modal-content" style="padding:16px">' +
        '<div class="lw5-modal-body" style="margin-bottom:12px;color:var(--text-primary)">' + message + '</div>' +
        '<div class="lw5-modal-footer" style="text-align:right">' +
          '<button class="lw5-btn lw5-btn-primary lw5-modal-close">OK</button>' +
        '</div>' +
      '</div>'
    );
    dlg.modal.find('.lw5-btn-primary').on('click', dlg.close);
  };

  ui.confirm = function (message, callback) {
    var dlg = makeModal(
      '<div class="lw5-modal-content" style="padding:16px">' +
        '<div class="lw5-modal-body" style="margin-bottom:12px;color:var(--text-primary)">' + message + '</div>' +
        '<div class="lw5-modal-footer" style="text-align:right;display:flex;gap:4px;justify-content:flex-end">' +
          '<button class="lw5-btn lw5-modal-cancel">Cancel</button>' +
          '<button class="lw5-btn lw5-btn-primary lw5-modal-confirm">OK</button>' +
        '</div>' +
      '</div>'
    );
    dlg.modal.find('.lw5-modal-confirm').on('click', function () { dlg.close(); if (callback) callback(true); });
    dlg.modal.find('.lw5-modal-cancel').on('click', function () { dlg.close(); if (callback) callback(false); });
  };

  ui.prompt = function (message, placeholder, callback) {
    var dlg = makeModal(
      '<div class="lw5-modal-content" style="padding:16px">' +
        '<div class="lw5-modal-body" style="margin-bottom:12px">' +
          '<label style="display:block;margin-bottom:6px;color:var(--text-primary)">' + message + '</label>' +
          '<input type="text" class="lw5-modal-input" value="' + (placeholder || '') + '" style="width:100%;padding:6px 8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-family:var(--font-mono)"/>' +
        '</div>' +
        '<div class="lw5-modal-footer" style="text-align:right;display:flex;gap:4px;justify-content:flex-end">' +
          '<button class="lw5-btn lw5-modal-cancel">Cancel</button>' +
          '<button class="lw5-btn lw5-btn-primary lw5-modal-confirm">OK</button>' +
        '</div>' +
      '</div>'
    );
    dlg.modal.find('.lw5-modal-confirm').on('click', function () {
      var val = dlg.modal.find('.lw5-modal-input').val();
      dlg.close();
      if (callback) callback(val);
    });
    dlg.modal.find('.lw5-modal-cancel').on('click', function () { dlg.close(); if (callback) callback(null); });
    dlg.modal.find('.lw5-modal-input').on('keydown', function (e) {
      if (e.key === 'Enter') { dlg.modal.find('.lw5-modal-confirm').trigger('click'); }
    }).focus().select();
  };

  ui.showGcodeModal = function (gcode) {
    var dlg = makeModal(
      '<div class="lw5-modal-header"><span>G-Code</span><span class="lw5-modal-close"><i class="fas fa-times"></i></span></div>' +
      '<div class="lw5-modal-body"><pre>' + escHtml(gcode) + '</pre></div>'
    );
    dlg.modal.css({ width: '80vw', maxWidth: '900px' });
    dlg.modal.find('.lw5-modal-close').on('click', dlg.close);
    $(document).on('keydown.gcodeModal', function (e) { if (e.key === 'Escape') { dlg.close(); $(document).off('keydown.gcodeModal'); } });
  };

  // ---- Document Tree ------------------------------------------------------

  ui.renderDocuments = function () {
    // File list is now shown via showFileList() modal on demand
  };

  // ---- Operations ---------------------------------------------------------

  ui.renderOperations = function () {};

  function setupDocDropZone() {
    // File drop handled on the canvas
  }

  function renderField(op, fieldDef, opIndex) {
    var fieldName = fieldDef.name;
    var val = op[fieldName];
    if (val === undefined || val === null) val = '';
    var units = fieldDef.units || '';
    var label = fieldDef.label || fieldName;
    var inputHtml = '';
    var dataAttrs = ' data-op-index="' + opIndex + '" data-field="' + fieldName + '"';

    switch (fieldDef.input) {
      case 'string':
        inputHtml = '<input type="text" value="' + escHtml(String(val)) + '"' + dataAttrs + ' />';
        break;
      case 'number':
        inputHtml = '<input type="number" step="any" value="' + val + '"' + dataAttrs + ' />';
        break;
      case 'range':
        inputHtml = '<input type="range" min="' + (fieldDef.min || 0) + '" max="' + (fieldDef.max || 100) + '" step="' + (fieldDef.step || 1) + '" value="' + val + '"' + dataAttrs + ' />';
        break;
      case 'toggle':
        var checked = val ? ' checked' : '';
        inputHtml = '<input type="checkbox"' + checked + dataAttrs + ' />';
        break;
      default:
        inputHtml = '<input type="text" value="' + escHtml(String(val)) + '"' + dataAttrs + ' />';
    }

    return (
      '<div class="lw5-op-field">' +
        '<label>' + escHtml(label) + '</label>' +
        inputHtml +
        (units ? '<span style="color:var(--text-muted);font-size:10px;min-width:30px;text-align:right">' + escHtml(units) + '</span>' : '') +
      '</div>'
    );
  }

  // ---- Settings -----------------------------------------------------------

  ui.renderSettings = function () {
    var settings = LW.getState().settings;
    var $form = $('#settings-panel');

    var html = '';
    var sections = {};

    for (var i = 0; i < settingsFields.length; i++) {
      var sf = settingsFields[i];
      if (!sections[sf.section]) sections[sf.section] = {};
      if (!sections[sf.section][sf.group]) sections[sf.section][sf.group] = [];
      sections[sf.section][sf.group].push(sf);
    }

    var sectionOrder = ['Machine', 'Files', 'GCode', 'App'];
    for (var s = 0; s < sectionOrder.length; s++) {
      var sec = sectionOrder[s];
      var groups = sections[sec];
      if (!groups) continue;

      html += '<div class="lw5-settings-section" style="margin-bottom:8px">';
      html += '<div style="font-weight:600;text-transform:uppercase;font-size:11px;color:var(--accent);margin-bottom:4px">' + escHtml(sec) + '</div>';

      var groupKeys = Object.keys(groups);
      for (var g = 0; g < groupKeys.length; g++) {
        var grp = groupKeys[g];
        var fields = groups[grp];

        html += '<div class="lw5-settings-group" style="margin-bottom:6px;padding:6px 8px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">';
        html += '<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">' + escHtml(grp) + '</div>';

        for (var f = 0; f < fields.length; f++) {
          var field = fields[f];
          html += renderSettingField(field, settings);
        }

        html += '</div>';
      }
      html += '</div>';
    }

    $form.html(html);

    $form.find('input[type="number"], input[type="text"]').on('change', function () {
      var id = $(this).data('id');
      var val = $(this).val();
      if ($(this).attr('type') === 'number') val = parseFloat(val) || 0;
      var ch = {};
      ch[id] = val;
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });

    $form.find('textarea').on('change', function () {
      var id = $(this).data('id');
      var ch = {};
      ch[id] = $(this).val();
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });

    $form.find('select').on('change', function () {
      var id = $(this).data('id');
      var ch = {};
      ch[id] = $(this).val();
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });

    $form.find('input[type="checkbox"]').on('change', function () {
      var id = $(this).data('id');
      var ch = {};
      ch[id] = $(this).prop('checked');
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });
  };

  function renderSettingField(field, settings) {
    var val = settings[field.id];
    if (val === undefined || val === null) val = field.defaultValue !== undefined ? field.defaultValue : '';
    var valueAttr = escHtml(String(val));
    var html = '';

    switch (field.type) {
      case 'number':
        html =
          '<div class="lw5-field">' +
            '<label>' + escHtml(field.label) + (field.units ? ' <span style="color:var(--text-muted);font-weight:normal">(' + escHtml(field.units) + ')</span>' : '') + '</label>' +
            '<input type="number" step="any" value="' + valueAttr + '" data-id="' + field.id + '" />' +
          '</div>';
        break;
      case 'text':
        html =
          '<div class="lw5-field">' +
            '<label>' + escHtml(field.label) + '</label>' +
            '<input type="text" value="' + valueAttr + '" data-id="' + field.id + '" />' +
          '</div>';
        break;
      case 'textarea':
        html =
          '<div class="lw5-field">' +
            '<label>' + escHtml(field.label) + '</label>' +
            '<textarea data-id="' + field.id + '" rows="' + (field.rows || 3) + '">' + valueAttr + '</textarea>' +
          '</div>';
        break;
      case 'toggle':
        var checked = val ? ' checked' : '';
        html =
          '<div class="lw5-field lw5-field-checkbox">' +
            '<input type="checkbox" data-id="' + field.id + '"' + checked + ' />' +
            '<label>' + escHtml(field.label) + '</label>' +
          '</div>';
        break;
      case 'select':
        var opts = field.options || [];
        var selectHtml = '<select data-id="' + field.id + '">';
        for (var o = 0; o < opts.length; o++) {
          var sel = val === opts[o] ? ' selected' : '';
          selectHtml += '<option value="' + escHtml(opts[o]) + '"' + sel + '>' + escHtml(opts[o]) + '</option>';
        }
        selectHtml += '</select>';
        html =
          '<div class="lw5-field">' +
            '<label>' + escHtml(field.label) + '</label>' +
            selectHtml +
          '</div>';
        break;
    }
    return html;
  }

  // ---- Floating Controls --------------------------------------------------

  ui.renderFloatingControls = function () {};

  // ---- Document Loading ---------------------------------------------------

  ui.loadDocument = function (files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var type = docTypeFromName(file.name);
      var reader = new FileReader();

      if (type === 'svg') {
        reader.onload = (function (f) {
          return function (e) {
            try {
              var result = parseSVGString(e.target.result, LW.getState().settings.pxPerInch || 96);
              var docs = [];
              var _si = 0;
              for (var t = 0; t < result.tags.length; t++) {
                var tag = result.tags[t];
                var tagPaths = [];
                for (var p = 0; p < tag.rawPaths.length; p++) {
                  tagPaths.push(tag.rawPaths[p]);
                }
                if (tagPaths.length > 0) {
                  var svgStroke = tag.stroke || '#000000';
                  svgStroke = ensureVisible(svgStroke);
                  var toolpathType = LW.detectToolpathType(svgStroke);
                  var fillColor = parseFillColor(tag.fill);
                  docs.push({
                    id: uuid(),
                    name: f.name.replace(/\.svg$/i, '') + ' (' + (++_si) + ')',
                    type: 'svg',
                    visible: true,
                    selected: false,
                    transform2d: [1, 0, 0, 1, 0, 0],
                    fillColor: fillColor,
                    strokeColor: svgStroke,
                    strokeWidth: parseFloat(tag.strokeWidth) || 1,
                    rawPaths: tagPaths,
                    toolpath: LW.defaultToolpath(toolpathType)
                  });
                }
              }
              if (docs.length === 0) {
                ui.showToast('No supported entities found in ' + f.name, 'warning');
              } else {
                LW.dispatch({ type: 'DOCUMENT_ADD_MULTIPLE', payload: docs });
                ui.showToast('Loaded ' + docs.length + ' entities from ' + f.name, 'success');
              }
            } catch (err) {
              console.error('DXF parse error:', err);
              ui.showToast('Error parsing DXF: ' + f.name, 'error');
            }
          };
        })(file);
        reader.readAsText(file);
      } else if (type === 'dxf') {
        reader.onload = (function (f) {
          return function (e) {
            try {
              var parser = new DxfParser();
              var dxf = parser.parseSync(e.target.result);
              if (!dxf || !dxf.entities || dxf.entities.length === 0) {
                ui.showToast('No entities found in ' + f.name, 'warning');
                return;
              }
              var docs = [];
              var _si = 0;
              for (var ei = 0; ei < dxf.entities.length; ei++) {
                var ent = dxf.entities[ei];
                var rawPaths = dxfEntityToPaths(ent);
                if (rawPaths.length === 0) continue;
                var color = ent.color ? intToHex(ent.color) : '#000000';
                // Default white/light to black for visibility
                color = ensureVisible(color);
                var toolpathType = LW.detectToolpathType(color);
                docs.push({
                  id: uuid(),
                  name: f.name.replace(/\.dxf$/i, '') + ' (' + (++_si) + ')',
                  type: 'svg',
                  visible: true,
                  selected: false,
                  transform2d: [1, 0, 0, 1, 0, 0],
                  fillColor: [0, 0, 0, 0],
                  strokeColor: color,
                  strokeWidth: 1,
                  rawPaths: rawPaths,
                  toolpath: LW.defaultToolpath(toolpathType)
                });
              }
              if (docs.length === 0) {
                ui.showToast('No supported entities in ' + f.name, 'warning');
              } else {
                LW.dispatch({ type: 'DOCUMENT_ADD_MULTIPLE', payload: docs });
                ui.showToast('Loaded ' + docs.length + ' entities from ' + f.name, 'success');
              }
            } catch (err) {
              console.error('DXF parse error:', err);
              ui.showToast('Error parsing DXF: ' + f.name, 'error');
            }
          };
        })(file);
        reader.readAsText(file);
      } else if (type === 'image') {
        reader.onload = (function (f) {
          return function (e) {
            promisedImage(e.target.result).then(function (img) {
              var doc = {
                id: uuid(),
                name: f.name,
                type: 'image',
                visible: true,
                selected: false,
                transform2d: [1, 0, 0, 1, 0, 0],
                fillColor: [0, 0, 0, 0],
                dataURL: e.target.result,
                originalPixels: [img.width, img.height],
                expanded: false,
                children: [],
                toolpath: LW.defaultToolpath('raster')
              };
              LW.dispatch({ type: 'DOCUMENT_ADD', payload: doc });
              ui.showToast('Loaded: ' + f.name, 'success');
            }).catch(function (err) {
              console.error('Image load error:', err);
              ui.showToast('Error loading image: ' + f.name, 'error');
            });
          };
        })(file);
        reader.readAsDataURL(file);
      } else if (type === 'gcode') {
        reader.onload = (function (f) {
          return function (e) {
            LW.dispatch({ type: 'GCODE_UPDATE', payload: e.target.result });
            ui.showToast('Loaded GCode: ' + f.name, 'success');
          };
        })(file);
        reader.readAsText(file);
      } else {
        reader.onload = (function (f) {
          return function (e) {
            var doc = {
              id: uuid(),
              name: f.name,
              type: 'unknown',
              visible: true,
              selected: false,
              transform2d: [1, 0, 0, 1, 0, 0],
              fillColor: [0, 0, 0, 0],
              dataURL: e.target.result,
              expanded: false,
              children: [],
              toolpath: LW.defaultToolpath('engrave')
            };
            LW.dispatch({ type: 'DOCUMENT_ADD', payload: doc });
            ui.showToast('Loaded: ' + f.name, 'success');
          };
        })(file);
        reader.readAsDataURL(file);
      }
    }
  };

  // ---- GCode Generation ---------------------------------------------------

  ui.generateGcode = function (onPrinted) {
    var state = LW.getState();
    var settings = state.settings;
    var documents = state.documents;
    var operations = state.operations;

    if (!operations.length) {
      ui.showToast('No operations to generate G-Code', 'warning');
      return;
    }

    if (!documents.length && !settings.toolCreateEmptyOps) {
      ui.showToast('No documents loaded', 'warning');
      return;
    }

    if (!LW.gcode || !LW.gcode.getGcode) {
      ui.showToast('GCode engine not available', 'error');
      return;
    }

    LW.dispatch({ type: 'GCODE_UPDATE', payload: { gcoding: { enable: true, percent: 0 } } });

    var interval = setInterval(function () {
      LW.emit('stateChanged', { type: 'GCODE_UPDATE', state: LW.getState() });
    }, 200);

    var onProgress = function (threads) {
      var percent = 0;
      if (Array.isArray(threads)) {
        percent = (threads.reduce(function (a, b) { return a + b; }, 0) / threads.length).toFixed(2);
      } else {
        percent = threads.toFixed(2);
      }
      LW.dispatch({ type: 'GCODE_UPDATE', payload: { gcoding: { enable: true, percent: Number(percent) } } });
    };

    var onComplete = function (gcode) {
      clearInterval(interval);
      LW.dispatch({ type: 'GCODE_UPDATE', payload: { content: gcode, dirty: true, gcoding: { enable: false, percent: 100 } } });
      ui.showToast('G-Code generated (' + gcode.split('\n').length + ' lines)', 'success');
      if (typeof onPrinted === 'function') onPrinted(gcode);
    };

    var onLog = function (msg, level) {
      if (typeof LW.commandHistory !== 'undefined' && LW.commandHistory.write) {
        LW.commandHistory.write(msg, level);
      }
      if (level === 'danger') {
        ui.showToast(msg, 'error');
        console.error('GCode error:', msg);
      }
    };

    // Defer heavy work so progress bar renders before blocking
    setTimeout(function () {
      try {
        LW.ui._currentQE = LW.gcode.getGcode(settings, documents, operations, null, onLog, onComplete, onProgress);
      } catch (err) {
        clearInterval(interval);
        LW.dispatch({ type: 'GCODE_UPDATE', payload: { gcoding: { enable: false, percent: 0 } } });
        ui.showToast('G-Code generation failed: ' + err.message, 'error');
        console.error('gcode generation error:', err);
      }
    }, 50);
  };

  ui.stopGcode = function () {
    if (LW.ui._currentQE) {
      try { LW.ui._currentQE.end(); } catch (e) { /* ignore */ }
      LW.ui._currentQE = null;
    }
    LW.dispatch({ type: 'GCODE_UPDATE', payload: { gcoding: { enable: false, percent: 0 } } });
  };

  // ---- Pane Switching (side panel tabs) -----------------------------------

  function initPaneSwitching() {
    $('.lw5-stab').on('click', function () {
      var $btn = $(this);
      if ($btn.hasClass('active')) return;
      $('.lw5-stab').removeClass('active');
      $btn.addClass('active');
      var tabId = $btn.data('stab');
      $('.lw5-stab-content').removeClass('active');
      $('#stab-' + tabId).addClass('active');
    });
  }

  // ---- Event Binding & Initialization -------------------------------------

  function bindStateEvents() {
    LW.on('DOCUMENT_ADD', function () {
      LW.draw.updateDocuments(LW.getState().documents);
      $('#lw5-toolpath-popup').remove();
    });
    LW.on('DOCUMENT_ADD_MULTIPLE', function () { LW.draw.updateDocuments(LW.getState().documents); });
    LW.on('DOCUMENT_REMOVE', function () {
      LW.draw.updateDocuments(LW.getState().documents);
      $('#lw5-toolpath-popup').remove();
    });
    LW.on('DOCUMENT_UPDATE', function () { LW.draw.updateDocuments(LW.getState().documents); });

    LW.on('UNDO', function () {
      $('#lw5-toolpath-popup').remove();
      LW.draw.updateDocuments(LW.getState().documents);
      if (window.showTransformBar) window.showTransformBar(LW.draw.getSelected ? LW.draw.getSelected() : []);
    });
    LW.on('REDO', function () {
      $('#lw5-toolpath-popup').remove();
      LW.draw.updateDocuments(LW.getState().documents);
      if (window.showTransformBar) window.showTransformBar(LW.draw.getSelected ? LW.draw.getSelected() : []);
    });
    LW.on('CLEAR_DESIGN', function () {
      $('#lw5-toolpath-popup').remove();
      LW.draw.updateDocuments(LW.getState().documents);
      if (window.showTransformBar) window.showTransformBar([]);
    });

    LW.on('SETTINGS_SET', function () { ui.renderSettings(); });
    LW.on('SETTINGS_REPLACE', function () { ui.renderSettings(); });

    LW.on('stateChanged', function (data) {
      if (data.type === 'GCODE_UPDATE' || data.type === 'GCODE_CLEAR') {
        updateGcodeProgress();
        if (LW.gcodeOverlay) {
          var gcode = LW.getState().gcode;
          if (gcode.content) {
            LW.gcodeOverlay.parse(gcode.content, function (segments) {
              if (LW.draw) LW.draw.updateGcode(segments);
            });
          } else if (LW.draw) {
            LW.draw.updateGcode(null);
          }
        }
      }
    });
  }

  function initOverlayToggle() {
    $('#toggle-overlay').on('change', function () {
      var v = $(this).is(':checked');
      if (LW.gcodeOverlay) LW.gcodeOverlay.setVisible(v);
      if (LW.draw) LW.draw.setGcodeOverlayVisible(v);
    });
  }

  function updateGcodeProgress() {
    var gcoding = LW.getState().gcode.gcoding;
    var $progress = $('#gcode-progress');
    if (gcoding && gcoding.enable) {
      $progress.html(
        '<div class="lw5-progress"><div class="lw5-progress-bar" style="width:' + gcoding.percent + '%"></div></div>' +
        '<div class="lw5-progress-label">Generating G-Code... ' + gcoding.percent + '%</div>' +
        '<button class="lw5-btn lw5-btn-sm lw5-btn-danger" id="btn-stop-gcode" style="margin-top:4px"><i class="fas fa-hand-paper"></i> Stop</button>'
      ).show();
      $('#btn-stop-gcode').on('click', function () { ui.stopGcode(); });
    } else {
      $progress.empty().hide();
    }
  }

  function bindToolbarButtons() {
    // File button opens file picker (handled in app.js)
    // and add button triggers file input
    $('#file-input').on('change', function (e) {
      ui.loadDocument(e.target.files);
      this.value = '';
    });

    $('#gcode-file-input').on('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        LW.dispatch({ type: 'GCODE_UPDATE', payload: ev.target.result });
        ui.showToast('Loaded GCode: ' + file.name, 'success');
      };
      reader.readAsText(file);
      this.value = '';
    });

    $('#btn-generate').on('click', function () {
        if (LW.printDialog) { LW.printDialog.open(); }
        else { ui.generateGcode(); }
    });

    $(document).on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            if (LW.printDialog) { LW.printDialog.open(); }
        }
    });

    $('#btn-view-gcode').on('click', function () {
      var gcode = LW.getState().gcode.content;
      if (!gcode) { ui.showToast('No G-Code to view', 'warning'); return; }
      ui.showGcodeModal(gcode);
    });

    $('#btn-save-gcode').on('click', function () {
      var gcode = LW.getState().gcode.content;
      if (!gcode) { ui.showToast('No G-Code to save', 'warning'); return; }
      ui.prompt('Save as', 'output.gcode', function (name) {
        if (name) {
          if (!name.match(/\.(gcode|gcode|nc|gc)$/i)) name += '.gcode';
          var blob = new Blob([gcode], { type: 'text/plain' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    });

    $('#btn-load-gcode').on('click', function () { $('#gcode-file-input').trigger('click'); });

    $('#gcode-file-input').on('change', function (e) {
      if (e.target.files.length) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          LW.dispatch({ type: 'GCODE_UPDATE', payload: ev.target.result });
          ui.showToast('Loaded G-Code file', 'success');
        };
        reader.readAsText(e.target.files[0]);
      }
      this.value = '';
    });

    $('#btn-clear-gcode').on('click', function () {
      LW.dispatch({ type: 'GCODE_CLEAR' });
      ui.showToast('G-Code cleared', 'info');
    });

    $('#btn-select-all').on('click', function () {
      LW.getState().documents.forEach(function (d) {
        LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: d.id, changes: { selected: true } } });
      });
    });

    $('#btn-select-none').on('click', function () {
      LW.getState().documents.forEach(function (d) {
        LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: d.id, changes: { selected: false } } });
      });
    });

    $('#btn-clone').on('click', function () {
      var state = LW.getState();
      state.documents.filter(function (d) { return d.selected; }).forEach(function (d) {
        var clone = JSON.parse(JSON.stringify(d));
        clone.id = uuid();
        clone.name = d.name.replace(/(\.[^.]+)$/, '_copy$1');
        clone.selected = false;
        LW.dispatch({ type: 'DOCUMENT_ADD', payload: clone });
      });
    });

    $('#btn-remove-selected').on('click', function () {
      var state = LW.getState();
      state.documents.filter(function (d) { return d.selected; }).slice().forEach(function (d) {
        LW.dispatch({ type: 'DOCUMENT_REMOVE', payload: d.id });
      });
    });
  }

  // ---- Settings Modal Helper ----------------------------------------------

  ui.renderSettingsInto = function ($container) {
    var settings = LW.getState().settings;
    var html = '<div class="lw5-form">';

    var sections = {};
    for (var idx = 0; idx < settingsFields.length; idx++) {
      var sf = settingsFields[idx];
      if (!sections[sf.section]) sections[sf.section] = {};
      if (!sections[sf.section][sf.group]) sections[sf.section][sf.group] = [];
      sections[sf.section][sf.group].push(sf);
    }

    var sectionOrder = ['Machine', 'Files', 'GCode', 'App'];
    for (var s = 0; s < sectionOrder.length; s++) {
      var sec = sectionOrder[s];
      var groups = sections[sec];
      if (!groups) continue;

      html += '<div class="lw5-settings-section" style="margin-bottom:12px">';
      html += '<div style="font-weight:600;text-transform:uppercase;font-size:11px;color:var(--accent);margin-bottom:6px">' + escHtml(sec) + '</div>';

      var groupKeys = Object.keys(groups);
      for (var g = 0; g < groupKeys.length; g++) {
        var grp = groupKeys[g];
        var fields = groups[grp];

        html += '<div class="lw5-settings-group" style="margin-bottom:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">';
        html += '<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">' + escHtml(grp) + '</div>';

        for (var f = 0; f < fields.length; f++) {
          var field = fields[f];
          html += renderSettingField(field, settings);
        }

        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    $container.html(html);

    $container.find('input[type="number"], input[type="text"]').on('change', function () {
      var id = $(this).data('id');
      var val = $(this).val();
      if ($(this).attr('type') === 'number') val = parseFloat(val) || 0;
      var ch = {};
      ch[id] = val;
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });

    $container.find('textarea').on('change', function () {
      var id = $(this).data('id');
      var ch = {};
      ch[id] = $(this).val();
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });

    $container.find('select').on('change', function () {
      var id = $(this).data('id');
      var ch = {};
      ch[id] = $(this).val();
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });

    $container.find('input[type="checkbox"]').on('change', function () {
      var id = $(this).data('id');
      var ch = {};
      ch[id] = $(this).prop('checked');
      LW.dispatch({ type: 'SETTINGS_UPDATE', payload: ch });
    });
  };

  // ---- Init ---------------------------------------------------------------

  ui.init = function () {
    initPaneSwitching();
    bindStateEvents();
    bindToolbarButtons();
    initOverlayToggle();
    initTransformBar();
    setupDocDropZone();

    LW.on('stateChanged', function () {
      ui.renderDocuments();
    });

    ui.renderDocuments();
    ui.renderOperations();
    ui.renderSettings();
    ui.renderFloatingControls();
    updateGcodeProgress();

    if (typeof marked !== 'undefined' && window.marked) {
      var releaseInfo = document.getElementById('release-info');
      if (releaseInfo) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'data/RELEASE.md', true);
        xhr.onload = function () {
          if (xhr.status === 200) {
            releaseInfo.innerHTML = marked.parse(xhr.responseText);
          }
        };
        xhr.send();
      }
    }

    ui.showToast('LaserWeb5 loaded', 'info');
  };

  function showFileList() {
    // Remove any existing file list overlay first
    $('#lw5-filelist-overlay').remove();
    var docs = LW.getState().documents;
    var html =
      '<div class="lw5-modal-overlay" id="lw5-filelist-overlay">' +
        '<div class="lw5-modal" style="width:520px;max-width:96vw;max-height:80vh;display:flex;flex-direction:column">' +
          '<div class="lw5-modal-header">' +
            '<span>Loaded Files <span style="color:var(--text-muted);font-weight:normal">(' + docs.length + ')</span></span>' +
            '<button class="lw5-modal-close" id="lw5-filelist-close">&times;</button>' +
          '</div>' +
          '<div class="lw5-modal-body" style="flex:1;overflow-y:auto;padding:8px">' +
            '<button class="lw5-btn lw5-btn-sm lw5-btn-primary" id="lw5-filelist-add" style="width:100%;margin-bottom:8px"><i class="fas fa-plus"></i> Add Files</button>';

    if (docs.length === 0) {
      html += '<div class="lw5-empty" style="text-align:center;padding:32px 16px;color:var(--text-muted)">No files loaded. Click <strong>Add Files</strong> or drag SVG/DXF/images onto the canvas.</div>';
    }

    for (var i = 0; i < docs.length; i++) {
      var d = docs[i];
      var name = d.name || 'Unnamed';
      var type = d.toolpath ? d.toolpath.type : 'none';
      var typeIcon = type === 'cut_on_line' ? 'fa-vector-square' :
                     type === 'cut_outside' ? 'fa-vector-square' :
                     type === 'cut_inside' ? 'fa-vector-square' :
                     type === 'pocket' || type === 'laser_fill' ? 'fa-fill-drip' :
                     type === 'mill_pocket' ? 'fa-industry' :
                     type === 'mill_cut' || type === 'mill_cut_inside' || type === 'mill_cut_outside' ? 'fa-cut' :
                     type === 'mill_vcarve' ? 'fa-gem' :
                     type === 'raster' ? 'fa-image' :
                     type === 'raster_merge' ? 'fa-layer-group' :
                     type === 'none' ? 'fa-ban' : 'fa-paint-brush';
      var typeColor = type === 'cut_on_line' ? '#e81123' :
                      type === 'cut_outside' ? '#0078d4' :
                      type === 'cut_inside' ? '#ffb900' :
                      type === 'pocket' || type === 'laser_fill' ? '#107c10' :
                      type === 'mill_pocket' ? '#8b4513' :
                      type === 'mill_cut' || type === 'mill_cut_inside' || type === 'mill_cut_outside' ? '#d2691e' :
                      type === 'mill_vcarve' ? '#a0522d' :
                      type === 'raster' ? '#881798' :
                      type === 'raster_merge' ? '#cc33cc' :
                      type === 'none' ? '#999' : '#666';
      html +=
        '<div class="lw5-filelist-item" data-doc-id="' + d.id + '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--radius-sm);cursor:pointer;transition:background .15s">' +
          '<i class="fas ' + typeIcon + '" style="color:' + typeColor + ';width:16px;text-align:center"></i>' +
          '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">' + escHtml(name) + '</span>' +
          '<span style="font-size:10px;color:var(--text-muted);background:var(--bg-tertiary);padding:1px 6px;border-radius:3px">' + type + '</span>' +
          '<button class="lw5-btn lw5-btn-xs lw5-btn-danger lw5-filelist-remove" data-doc-id="' + d.id + '" style="border-radius:50%;width:24px;height:24px;padding:0" title="Remove">&times;</button>' +
        '</div>';
    }

    html +=
          '</div>' +
        '</div>' +
      '</div>';

    var $overlay = $(html).appendTo(document.body);

    $overlay.on('click', function (e) {
      if (e.target === $overlay[0]) $overlay.remove();
    });
    $overlay.on('click', '#lw5-filelist-close', function () { $overlay.remove(); });

    $overlay.on('click', '#lw5-filelist-add', function () {
      document.getElementById('file-input').click();
      $overlay.remove();
    });

    $overlay.on('click', '.lw5-filelist-item', function (e) {
      if ($(e.target).hasClass('lw5-filelist-remove')) return;
      $overlay.remove();
      // Select the clicked document
      var id = $(this).data('doc-id');
      LW.dispatch({ type: 'DOCUMENT_SELECT', payload: id });
      LW.draw.updateDocuments(LW.getState().documents);
      if (window.showTransformBar) window.showTransformBar([id]);
    });

    $overlay.on('click', '.lw5-filelist-remove', function (e) {
      e.stopPropagation();
      var id = $(this).data('doc-id');
      LW.dispatch({ type: 'DOCUMENT_REMOVE', payload: id });
      $overlay.remove();
    });
  }

  function showToolpathPopup(doc, canvasPos) {
    $('#lw5-toolpath-popup').remove();

    if (!doc) return;
    var tp = doc.toolpath || { type: 'none', power: 0, speed: 0, passes: 0, margin: 0, segmentLength: 1, trimLine: false, dpi: 250, direction: 'top_to_bottom', brightness: 0, contrast: 0, gamma: 1, grayscale: false, dithering: 'none' };

    var types = ['none', 'engrave', 'cut_on_line', 'cut_outside', 'cut_inside', 'laser_fill', 'laser_cut_inside', 'laser_cut_outside', 'mill_pocket', 'mill_cut', 'mill_cut_inside', 'mill_cut_outside', 'mill_vcarve', 'raster', 'raster_merge'];
    var typeOptions = types.map(function (t) {
      return '<option value="' + t + '"' + (tp.type === t ? ' selected' : '') + '>' + t.replace(/_/g, ' ') + '</option>';
    }).join('');

    var docType = doc.type === 'image' ? 'Bitmap' : 'Vector';
    var subtitle = '1 ' + docType;
    var isRaster = tp.type === 'raster' || tp.type === 'raster_merge';
    var isMill = tp.type.indexOf('mill_') === 0;
    var isVcarve = tp.type === 'mill_vcarve';

    var html =
      '<div class="lw5-modal-overlay" id="lw5-toolpath-popup">' +
        '<div class="lw5-dialog" style="width:400px">' +
          '<div class="lw5-dialog-header">' +
            '<i class="fas fa-wrench lw5-dialog-icon"></i>' +
            '<div class="lw5-dialog-header-text">' +
              '<span class="lw5-dialog-title">Toolpath Options</span>' +
              '<span class="lw5-dialog-subtitle" id="lw5-pp-subtitle">' + subtitle + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="lw5-dialog-body" style="flex-direction:column">' +
            '<div class="lw5-dialog-settings" style="width:auto;min-width:0;border-right:none">' +
              '<div class="lw5-dialog-section">' +
                '<div class="lw5-dialog-section-title">Operation</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Type</label>' +
                  '<select id="lw5-pp-type" style="flex:1">' + typeOptions + '</select>' +
                '</div>' +
              '</div>' +
              '<div class="lw5-dialog-section">' +
                '<div class="lw5-dialog-section-title">Laser</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Power</label>' +
                  '<input type="range" class="lw5-dialog-range" id="lw5-pp-power" min="0" max="100" value="' + tp.power + '" />' +
                  '<span class="lw5-dialog-range-val" id="lw5-pp-power-val">' + tp.power + '%</span>' +
                '</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Speed</label>' +
                  '<input type="range" class="lw5-dialog-range" id="lw5-pp-speed" min="1" max="500" value="' + tp.speed + '" />' +
                  '<span class="lw5-dialog-range-val" id="lw5-pp-speed-val">' + tp.speed + '</span>' +
                '</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Passes</label>' +
                  '<input type="number" id="lw5-pp-passes" value="' + tp.passes + '" min="1" max="99" class="lw5-dialog-num" />' +
                '</div>' +
              '</div>' +
              '<div class="lw5-dialog-section lw5-pp-depth" style="' + (isMill ? '' : 'display:none') + '">' +
                '<div class="lw5-dialog-section-title">Depth</div>' +
                '<div class="lw5-dialog-row"><label>Pass Depth</label><input type="number" id="lw5-pp-passDepth" value="' + (tp.passDepth || 1) + '" step="0.1" class="lw5-dialog-num" style="width:80px" /></div>' +
                '<div class="lw5-dialog-row"><label>Start Z</label><input type="number" id="lw5-pp-millStartZ" value="' + (tp.millStartZ || 0) + '" step="0.1" class="lw5-dialog-num" style="width:80px" /></div>' +
                '<div class="lw5-dialog-row"><label>End Z</label><input type="number" id="lw5-pp-millEndZ" value="' + (tp.millEndZ || -1) + '" step="0.1" class="lw5-dialog-num" style="width:80px" /></div>' +
                '<div class="lw5-dialog-row lw5-pp-vcarve" style="' + (isVcarve ? '' : 'display:none') + '"><label>Tool Angle</label><input type="number" id="lw5-pp-toolAngle" value="' + (tp.toolAngle || 90) + '" class="lw5-dialog-num" style="width:80px" /></div>' +
              '</div>' +
              '<div style="margin-top:4px">' +
                '<button class="lw5-btn lw5-btn-xs" id="lw5-pp-advanced-toggle" style="width:100%"><i class="fas fa-cog"></i> Advanced</button>' +
                '<div id="lw5-pp-advanced" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' +
                  '<div class="lw5-dialog-section">' +
                    '<div class="lw5-dialog-section-title">Common</div>' +
                    '<div class="lw5-dialog-row"><label>Kerf</label><input type="number" id="lw5-pp-margin" value="' + tp.margin + '" step="0.01" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label>Segment Len</label><input type="number" id="lw5-pp-seg" value="' + tp.segmentLength + '" step="0.5" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label class="lw5-dialog-check"><input type="checkbox" id="lw5-pp-trim" ' + (tp.trimLine ? 'checked' : '') + ' /> Trim Line</label></div>' +
                  '</div>' +
                   '<div class="lw5-dialog-section lw5-pp-raster" style="' + (isRaster ? '' : 'display:none') + '">' +
                    '<div class="lw5-dialog-section-title">Raster</div>' +
                    '<div class="lw5-dialog-row"><label>DPI</label><input type="number" id="lw5-pp-dpi" value="' + tp.dpi + '" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label>Direction</label><select id="lw5-pp-dir"><option value="top_to_bottom"' + (tp.direction === 'top_to_bottom' ? ' selected' : '') + '>Top to Bottom</option><option value="bottom_to_top"' + (tp.direction === 'bottom_to_top' ? ' selected' : '') + '>Bottom to Top</option></select></div>' +
                    '<div class="lw5-dialog-row"><label>Pwr Range</label><input type="number" id="lw5-pp-powerRange" value="' + (tp.laserPowerRange || 100) + '" class="lw5-dialog-num" style="width:80px" /><span style="font-size:11px;color:var(--text-muted)">%</span></div>' +
                    '<div class="lw5-dialog-row"><label>Brightness</label><input type="range" class="lw5-dialog-range" id="lw5-pp-brightness" min="-100" max="100" value="' + tp.brightness + '" /></div>' +
                    '<div class="lw5-dialog-row"><label>Contrast</label><input type="range" class="lw5-dialog-range" id="lw5-pp-contrast" min="-100" max="100" value="' + tp.contrast + '" /></div>' +
                    '<div class="lw5-dialog-row"><label>Gamma</label><input type="range" class="lw5-dialog-range" id="lw5-pp-gamma" min="0.1" max="3" step="0.1" value="' + tp.gamma + '" /></div>' +
                    '<div class="lw5-dialog-row"><label class="lw5-dialog-check"><input type="checkbox" id="lw5-pp-grayscale" ' + (tp.grayscale ? 'checked' : '') + ' /> Grayscale</label><label class="lw5-dialog-check" style="margin-left:16px"><input type="checkbox" id="lw5-pp-invert" ' + (tp.invertColor ? 'checked' : '') + ' /> Invert</label></div>' +
                    '<div class="lw5-dialog-row"><label>Dithering</label><select id="lw5-pp-dither"><option value="none"' + (tp.dithering === 'none' ? ' selected' : '') + '>None</option><option value="floyd"' + (tp.dithering === 'floyd' ? ' selected' : '') + '>Floyd-Steinberg</option><option value="ordered"' + (tp.dithering === 'ordered' ? ' selected' : '') + '>Ordered</option></select></div>' +
                    '<div class="lw5-dialog-row"><label class="lw5-dialog-check"><input type="checkbox" id="lw5-pp-diagonal" ' + (tp.diagonal ? 'checked' : '') + ' /> Diagonal</label><label class="lw5-dialog-check" style="margin-left:16px"><input type="checkbox" id="lw5-pp-smooth" ' + (tp.smoothing ? 'checked' : '') + ' /> Smooth</label></div>' +
                    '<div class="lw5-dialog-row"><label>Overscan</label><input type="number" id="lw5-pp-overscan" value="' + (tp.overScan || 0) + '" step="0.5" class="lw5-dialog-num" style="width:80px" /><span style="font-size:11px;color:var(--text-muted)">mm</span></div>' +
                  '</div>' +
                  '<div class="lw5-dialog-section lw5-pp-mill" style="' + (isMill ? '' : 'display:none') + '">' +
                    '<div class="lw5-dialog-section-title">Tool</div>' +
                    '<div class="lw5-dialog-row"><label>Diameter</label><input type="number" id="lw5-pp-toolDia" value="' + (tp.toolDiameter || 3) + '" step="0.1" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label>Step Over</label><input type="number" id="lw5-pp-stepOver" value="' + (tp.stepOver || 10) + '" class="lw5-dialog-num" style="width:80px" /><span style="font-size:11px;color:var(--text-muted)">%</span></div>' +
                    '<div class="lw5-dialog-row"><label>Plunge</label><input type="number" id="lw5-pp-plungeRate" value="' + (tp.plungeRate || 300) + '" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label>Rapid Z</label><input type="number" id="lw5-pp-millRapidZ" value="' + (tp.millRapidZ || 10) + '" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label>Direction</label><select id="lw5-pp-millDir"><option value="Conventional"' + ((tp.direction || 'Conventional') === 'Conventional' ? ' selected' : '') + '>Conventional</option><option value="Climb"' + (tp.direction === 'Climb' ? ' selected' : '') + '>Climb</option></select></div>' +
                    '<div class="lw5-dialog-row"><label class="lw5-dialog-check"><input type="checkbox" id="lw5-pp-ramp" ' + (tp.ramp ? 'checked' : '') + ' /> Ramp</label></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="lw5-dialog-footer">' +
            '<div class="lw5-dialog-footer-left">' +
              '<span id="lw5-pp-job-details"></span>' +
            '</div>' +
            '<div class="lw5-dialog-footer-right">' +
              '<button class="lw5-btn lw5-btn-primary" id="lw5-pp-apply"><i class="fas fa-check"></i> Apply</button>' +
              '<button class="lw5-btn" id="lw5-pp-cancel">Cancel</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var $popup = $(html).appendTo(document.body);

    function updateDoc() {
      var newTp = {
        type: $('#lw5-pp-type').val(),
        power: parseFloat($('#lw5-pp-power').val()),
        speed: parseFloat($('#lw5-pp-speed').val()),
        passes: parseInt($('#lw5-pp-passes').val()) || 1,
        margin: parseFloat($('#lw5-pp-margin').val()) || 0,
        segmentLength: parseFloat($('#lw5-pp-seg').val()) || 1,
        trimLine: $('#lw5-pp-trim').is(':checked'),
        dpi: parseInt($('#lw5-pp-dpi').val()) || 250,
        direction: $('#lw5-pp-dir').val() || 'top_to_bottom',
        laserPowerRange: parseInt($('#lw5-pp-powerRange').val()) || 100,
        brightness: parseFloat($('#lw5-pp-brightness').val()) || 0,
        contrast: parseFloat($('#lw5-pp-contrast').val()) || 0,
        gamma: parseFloat($('#lw5-pp-gamma').val()) || 1,
        grayscale: $('#lw5-pp-grayscale').is(':checked'),
        invertColor: $('#lw5-pp-invert').is(':checked'),
        dithering: $('#lw5-pp-dither').val() || 'none',
        diagonal: $('#lw5-pp-diagonal').is(':checked'),
        smoothing: $('#lw5-pp-smooth').is(':checked'),
        overScan: parseFloat($('#lw5-pp-overscan').val()) || 0,
        toolDiameter: parseFloat($('#lw5-pp-toolDia').val()) || 3,
        stepOver: parseFloat($('#lw5-pp-stepOver').val()) || 10,
        plungeRate: parseFloat($('#lw5-pp-plungeRate').val()) || 300,
        passDepth: parseFloat($('#lw5-pp-passDepth').val()) || 1,
        millRapidZ: parseFloat($('#lw5-pp-millRapidZ').val()) || 10,
        millStartZ: parseFloat($('#lw5-pp-millStartZ').val()) || 0,
        millEndZ: parseFloat($('#lw5-pp-millEndZ').val()) || -1,
        toolAngle: parseFloat($('#lw5-pp-toolAngle').val()) || 90,
        ramp: $('#lw5-pp-ramp').is(':checked')
      };
      var $millDir = $('#lw5-pp-millDir');
      if ($millDir.length) newTp.direction = $millDir.val();
      LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: doc.id, changes: { toolpath: newTp } } });
      // Trigger image filter preview
      if (doc.type === 'image' && (newTp.type === 'raster' || newTp.type === 'raster_merge')) {
        applyImageFilters(doc.dataURL, newTp, function (filteredUrl) {
          if (filteredUrl) {
            doc._filteredDataURL = filteredUrl;
          } else {
            delete doc._filteredDataURL;
          }
          // Force canvas redraw
          LW.draw.updateDocuments(LW.getState().documents);
        });
      } else if (doc.type === 'image') {
        delete doc._filteredDataURL;
      }
    }

    // Live update on input changes
    $('#lw5-pp-power').on('input', function () { $('#lw5-pp-power-val').text(this.value + '%'); updateDoc(); });
    $('#lw5-pp-speed').on('input', function () { $('#lw5-pp-speed-val').text(this.value); updateDoc(); });
    $('#lw5-pp-type').on('change', function () {
      var v = $(this).val();
      var isMill = v.indexOf('mill_') === 0;
      var isRaster = v === 'raster' || v === 'raster_merge';
      var isVcarve = v === 'mill_vcarve';
      $('.lw5-pp-depth').toggle(isMill);
      $('.lw5-pp-vcarve').toggle(isVcarve);
      $('.lw5-pp-mill').toggle(isMill);
      $('.lw5-pp-raster').toggle(isRaster);
      updateDoc();
    });
    $('#lw5-pp-passes, #lw5-pp-margin, #lw5-pp-seg, #lw5-pp-dpi').on('change', updateDoc);
    $('#lw5-pp-trim, #lw5-pp-grayscale, #lw5-pp-invert, #lw5-pp-diagonal, #lw5-pp-smooth').on('change', updateDoc);
    $('#lw5-pp-dir, #lw5-pp-dither, #lw5-pp-powerRange, #lw5-pp-overscan').on('change', updateDoc);
    $('#lw5-pp-brightness, #lw5-pp-contrast, #lw5-pp-gamma').on('input', updateDoc);
    $('#lw5-pp-toolDia, #lw5-pp-stepOver, #lw5-pp-plungeRate, #lw5-pp-passDepth').on('change', updateDoc);
    $('#lw5-pp-millRapidZ, #lw5-pp-millStartZ, #lw5-pp-millEndZ, #lw5-pp-millDir').on('change', updateDoc);
    $('#lw5-pp-toolAngle').on('change', updateDoc);
    $('#lw5-pp-ramp').on('change', updateDoc);

    // Add a "Material" picker button in the popup header
    var $matBtn = $('<button class="lw5-btn lw5-btn-xs" style="margin-left:8px" title="Apply material from database"><i class="fas fa-database"></i> Material</button>').appendTo($popup.find('.lw5-dialog-header-text'));
    $matBtn.on('click', function () { showMaterialPicker(doc); });

    $('#lw5-pp-advanced-toggle').on('click', function () {
      var $adv = $('#lw5-pp-advanced');
      $adv.toggle();
    });

    // Close handlers
    $('#lw5-pp-cancel').on('click', function () { $popup.remove(); });
    $popup.on('click', function (e) { if (e.target === this) $popup.remove(); });

    // Apply button: save current values, set stroke color, close
    $('#lw5-pp-apply').on('click', function () {
      updateDoc();
      var typeColors = {
        none: '#999999',
        cut_on_line: '#e81123', cut_outside: '#0078d4', cut_inside: '#ffb900',
        laser_fill: '#107c10', laser_cut_inside: '#ffb900', laser_cut_outside: '#0078d4',
        pocket: '#107c10', raster: '#881798', raster_merge: '#cc33cc',
        engrave: '#666666',
        mill_pocket: '#8b4513', mill_cut: '#d2691e', mill_cut_inside: '#d2691e', mill_cut_outside: '#d2691e',
        mill_vcarve: '#a0522d'
      };
      var tpType = $('#lw5-pp-type').val();
      var color = typeColors[tpType] || '#666666';
      LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: doc.id, changes: { strokeColor: color } } });
      $popup.remove();
    });

    $(document).on('keydown.lw5pp', function (e) {
      if (e.key === 'Escape') { $popup.remove(); $(document).off('keydown.lw5pp'); }
    });
  }

  // Expose these globally
  window.showFileList = showFileList;
  window.showToolpathPopup = showToolpathPopup;
  window.showTransformBar = showTransformBar;
  window.showMaterialEditor = showMaterialEditor;

  // ---- Utility ------------------------------------------------------------

  function escHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function intToHex(colorIndex) {
    var acadColors = [
      '#000000','#FF0000','#FFFF00','#00FF00','#00FFFF','#0000FF','#FF00FF','#FFFFFF','#414141','#808080',
      '#FF0000','#FFAAAA','#BD0000','#BD7E7E','#810000','#815555','#550000','#553636','#FF3F00','#FFBFAA',
      '#BD2E00','#BD8E7E','#7E1E00','#7E5E55','#551400','#553F36','#FF7F00','#FFD4AA','#BD5E00','#BD9B7E',
      '#7E3F00','#7E6855','#552A00','#554636','#FFBF00','#FFEAAA','#BD8E00','#BDA87E','#7E5E00','#7E7055',
      '#553F00','#554B36','#BFFF00','#EAFFAA','#8EBD00','#A8BD7E','#5E7E00','#707E55','#3F5500','#4B5536',
      '#00FF00','#AAFFAA','#00BD00','#7EBD7E','#007E00','#557E55','#005500','#365536','#00FF3F','#AAFFBF',
      '#00BD2E','#7EBD8E','#007E1E','#557E5E','#005514','#36553F','#00FF7F','#AAFFD4','#00BD5E','#7EBD9B',
      '#007E3F','#557E68','#00552A','#365546','#00FFBF','#AAFFEA','#00BD8E','#7EBDA8','#007E5E','#557E70',
      '#00553F','#36554B','#00FFFF','#AAFFFF','#00BDBD','#7EBDBD','#007E7E','#557E7E','#005555','#365555',
      '#003FFF','#AABFFF','#002EBD','#7E8EBD','#001E7E','#555E7E','#001455','#363F55','#007FFF','#AAD4FF',
      '#005EBD','#7E9BBD','#003F7E','#55687E','#002A55','#364655','#00BFFF','#AAEAFF','#008EBD','#7EA8BD',
      '#005E7E','#55707E','#003F55','#364B55','#0000FF','#AAAAFF','#0000BD','#7E7EBD','#00007E','#55557E',
      '#000055','#363655','#3F00FF','#BFAAFF','#2E00BD','#8E7EBD','#1E007E','#5E557E','#140055','#3F3655',
      '#7F00FF','#D4AAFF','#5E00BD','#9B7EBD','#3F007E','#68557E','#2A0055','#463655','#BF00FF','#EAAAFF',
      '#8E00BD','#A87EBD','#5E007E','#70557E','#3F0055','#4B3655','#FF00FF','#FFAAFF','#BD00BD','#BD7EBD',
      '#7E007E','#7E557E','#550055','#553655','#FF00BF','#FFAAEA','#BD008E','#BD7EA8','#7E005E','#7E5570',
      '#55003F','#55364B','#FF007F','#FFAAD4','#BD005E','#BD7E9B','#7E003F','#7E5568','#55002A','#553646',
      '#FF003F','#FFAABF','#BD002E','#BD7E8E','#7E001E','#7E555E','#550014','#55363F','#333333','#505050',
      '#696969','#828282','#9E9E9E','#BABABA','#D6D6D6','#F2F2F2'
    ];
    return acadColors[colorIndex % acadColors.length] || '#ffffff';
  }

  function dxfEntityToPaths(entity) {
    var paths = [];
    function approxCircle(cx, cy, r, steps) {
      steps = steps || 36;
      var pts = [];
      for (var i = 0; i <= steps; i++) {
        var a = (i / steps) * Math.PI * 2;
        pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      return pts;
    }
    function approxArc(cx, cy, r, startAng, endAng, steps) {
      steps = steps || 36;
      var pts = [];
      var sweep = endAng - startAng;
      if (sweep < 0) sweep += Math.PI * 2;
      for (var i = 0; i <= steps; i++) {
        var a = startAng + (i / steps) * sweep;
        pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      return pts;
    }
    switch (entity.type) {
      case 'LINE':
        if (entity.vertices && entity.vertices.length >= 2) {
          paths.push([entity.vertices[0].x, entity.vertices[0].y, entity.vertices[1].x, entity.vertices[1].y]);
        }
        break;
      case 'LWPOLYLINE':
      case 'POLYLINE':
        if (entity.vertices && entity.vertices.length > 0) {
          var pts = [];
          for (var i = 0; i < entity.vertices.length; i++) {
            pts.push(entity.vertices[i].x, entity.vertices[i].y);
          }
          if (entity.closed) pts.push(entity.vertices[0].x, entity.vertices[0].y);
          paths.push(pts);
        }
        break;
      case 'CIRCLE':
        if (entity.center && entity.radius) {
          paths.push(approxCircle(entity.center.x, entity.center.y, entity.radius));
        }
        break;
      case 'ARC':
        if (entity.center && entity.radius) {
          var sa = (entity.startAngle || 0) * Math.PI / 180;
          var ea = (entity.endAngle || 360) * Math.PI / 180;
          paths.push(approxArc(entity.center.x, entity.center.y, entity.radius, sa, ea));
        }
        break;
      case 'ELLIPSE':
        if (entity.center && entity.majorAxisEndPoint) {
          var mx = entity.majorAxisEndPoint.x || 0;
          var my = entity.majorAxisEndPoint.y || 0;
          var rx = Math.sqrt(mx * mx + my * my);
          var ry = rx * (entity.minorAxisRatio || 1);
          var angle = Math.atan2(my, mx);
          var steps = 48;
          var pts = [];
          for (var i = 0; i <= steps; i++) {
            var a = (i / steps) * Math.PI * 2;
            var cosA = Math.cos(a), sinA = Math.sin(a);
            var ex = entity.center.x + rx * cosA * Math.cos(angle) - ry * sinA * Math.sin(angle);
            var ey = entity.center.y + rx * cosA * Math.sin(angle) + ry * sinA * Math.cos(angle);
            pts.push(ex, ey);
          }
          paths.push(pts);
        }
        break;
      case 'POINT':
        if (entity.position) {
          paths.push([entity.position.x, entity.position.y]);
        }
        break;
    }
    return paths;
  }

  function parseFillColor(fill) {
    if (!fill || fill === 'none') return [0, 0, 0, 0];
    var rgb = LW.hexToRgb ? LW.hexToRgb(fill) : null;
    if (rgb) return [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
    return [0, 0, 0, 0];
  }

  // --- Numeric Transform Bar ---
  function getDocLocalBounds(doc) {
    if (doc.rawPaths) {
      var b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
      for (var pi = 0; pi < doc.rawPaths.length; pi++) {
        var p = doc.rawPaths[pi];
        if (!p || p.length < 2) continue;
        for (var j = 0; j < p.length; j += 2) {
          if (p[j] < b.x1) b.x1 = p[j];
          if (p[j] > b.x2) b.x2 = p[j];
          if (p[j + 1] < b.y1) b.y1 = p[j + 1];
          if (p[j + 1] > b.y2) b.y2 = p[j + 1];
        }
      }
      return (b.x1 === Infinity) ? null : b;
    } else if (doc.type === 'image') {
      var iw = doc._imgW || (doc.originalPixels ? doc.originalPixels[0] : null);
      var ih = doc._imgH || (doc.originalPixels ? doc.originalPixels[1] : null);
      if (iw == null || ih == null) return null;
      return { x1: 0, y1: 0, x2: iw, y2: ih };
    }
    return null;
  }

  function extractTransform(tf) {
    if (!tf) tf = [1, 0, 0, 1, 0, 0];
    var sx = Math.sqrt(tf[0] * tf[0] + tf[1] * tf[1]);
    var sy = Math.sqrt(tf[2] * tf[2] + tf[3] * tf[3]);
    var rot = Math.atan2(tf[1], tf[0]) * 180 / Math.PI;
    return { x: tf[4], y: tf[5], sx: sx, sy: sy, rot: rot };
  }

  function buildTransform(x, y, sx, sy, rotDeg) {
    var rad = rotDeg * Math.PI / 180;
    var c = Math.cos(rad), s = Math.sin(rad);
    return [sx * c, sx * s, -sy * s, sy * c, x, y];
  }

  function showTransformBar(selectedIds) {
    if (!selectedIds || selectedIds.length === 0) {
      $('#lw5-transform-bar').hide();
      return;
    }
    var docs = LW.getState().documents;
    if (selectedIds.length === 1) {
      var doc = docs.filter(function (d) { return d.id === selectedIds[0]; })[0];
      if (!doc) { $('#lw5-transform-bar').hide(); return; }
      var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];
      var ext = extractTransform(tf);
      var b = getDocLocalBounds(doc);
      if (!b) { $('#lw5-transform-bar').hide(); return; }
      var bw = b.x2 - b.x1, bh = b.y2 - b.y1;
      var w = bw * ext.sx, h = bh * ext.sy;
      $('#lw5-transform-bar').show();
      $('#tf-x').val(ext.x.toFixed(1)).prop('disabled', false);
      $('#tf-y').val(ext.y.toFixed(1)).prop('disabled', false);
      $('#tf-w').val(w.toFixed(1)).prop('disabled', false);
      $('#tf-h').val(h.toFixed(1)).prop('disabled', false);
      $('#tf-rot').val(ext.rot.toFixed(1)).prop('disabled', false);
      $('#tf-lock').data('bbox-aspect', (bw && bh) ? (bw / bh) : 1);
    } else {
      // Multi-select: show combined bounds
      var ids = {};
      selectedIds.forEach(function (id) { ids[id] = true; });
      var gb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
      var ok = false;
      docs.forEach(function (d) {
        if (!ids[d.id]) return;
        var b = LW.draw.getDocBounds ? LW.draw.getDocBounds(d) : null;
        if (!b) return;
        ok = true;
        if (b.x1 < gb.x1) gb.x1 = b.x1;
        if (b.y1 < gb.y1) gb.y1 = b.y1;
        if (b.x2 > gb.x2) gb.x2 = b.x2;
        if (b.y2 > gb.y2) gb.y2 = b.y2;
      });
      if (!ok) { $('#lw5-transform-bar').hide(); return; }
      $('#lw5-transform-bar').show();
      $('#tf-x').val(((gb.x1 + gb.x2) / 2).toFixed(1)).prop('disabled', false);
      $('#tf-y').val(((gb.y1 + gb.y2) / 2).toFixed(1)).prop('disabled', false);
      $('#tf-w').val((gb.x2 - gb.x1).toFixed(1)).prop('disabled', false);
      $('#tf-h').val((gb.y2 - gb.y1).toFixed(1)).prop('disabled', false);
      $('#tf-rot').val('0').prop('disabled', true);
      $('#tf-lock').data('bbox-aspect', (gb.x2 - gb.x1) / (gb.y2 - gb.y1));
    }
  }

  function initTransformBar() {
    var updating = false;
    function onTfChange() {
      if (updating) return;
      updating = true;
      var selectedIds = LW.draw.getSelected ? LW.draw.getSelected() : [];
      if (selectedIds.length === 0) { updating = false; return; }
      var docs = LW.getState().documents;
      var newX = parseFloat($('#tf-x').val());
      var newY = parseFloat($('#tf-y').val());
      var newW = parseFloat($('#tf-w').val());
      var newH = parseFloat($('#tf-h').val());
      var newRot = parseFloat($('#tf-rot').val());
      var locked = $('#tf-lock').hasClass('active');
      var isSingle = selectedIds.length === 1;
      if (!isSingle && isNaN(newX)) { updating = false; return; }
      docs.forEach(function (doc) {
        if (selectedIds.indexOf(doc.id) < 0) return;
        var tf = (doc.transform2d || [1, 0, 0, 1, 0, 0]).slice();
        var ext = extractTransform(tf);
        var b = isSingle ? getDocLocalBounds(doc) : null;
        var bw = b ? (b.x2 - b.x1) : 0, bh = b ? (b.y2 - b.y1) : 0;
        if (isSingle) {
          if (isNaN(newX)) newX = ext.x;
          if (isNaN(newY)) newY = ext.y;
          if (isNaN(newW) || bw === 0) newW = bw * ext.sx;
          if (isNaN(newH) || bh === 0) newH = bh * ext.sy;
          if (isNaN(newRot)) newRot = ext.rot;
          if (locked && bw && bh) {
            var aspect = bw / bh;
            newH = newW / aspect;
            $('#tf-h').val(newH.toFixed(1));
          }
          var newSx = bw ? (newW / bw) : 1;
          var newSy = bh ? (newH / bh) : 1;
          var newTf = buildTransform(newX, newY, newSx, newSy, newRot);
          LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: doc.id, changes: { transform2d: newTf } } });
        } else {
          // Multi-select: adjust position relative to group center
          var dx = isNaN(newX) ? 0 : newX - ext.x;
          var dy = isNaN(newY) ? 0 : newY - ext.y;
          if (dx !== 0 || dy !== 0) {
            LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: doc.id, changes: { transform2d: [tf[0], tf[1], tf[2], tf[3], tf[4] + dx, tf[5] + dy] } } });
          }
        }
      });
      updating = false;
    }
    $('#tf-x, #tf-y, #tf-w, #tf-h, #tf-rot').on('change', onTfChange);
    $('#tf-x, #tf-y, #tf-w, #tf-h, #tf-rot').on('input', onTfChange);
    $('#tf-lock').on('click', function () { $(this).toggleClass('active'); });
  }

  // --- Image Filter Preview ---
  function applyImageFilters(dataURL, tp, callback) {
    if (!dataURL) { callback(null); return; }
    var needApply = tp.brightness || tp.contrast || tp.gamma !== 1 || tp.grayscale || tp.invertColor || tp.smoothing;
    if (!needApply) { callback(null); return; }
    var maxDim = 800;
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = maxDim * h / w; w = maxDim; }
        else { w = maxDim * w / h; h = maxDim; }
        w = Math.round(w); h = Math.round(h);
      }
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var imageData = ctx.getImageData(0, 0, w, h);
      var d = imageData.data;
      var len = d.length;
      // Brightness (range -100 to 100 → factor)
      if (tp.brightness) {
        var b = tp.brightness * 2.55; // map -100..100 to -255..255
        for (var i = 0; i < len; i += 4) {
          d[i] += b; d[i + 1] += b; d[i + 2] += b;
        }
      }
      // Contrast
      if (tp.contrast) {
        var cf = (259 * (tp.contrast * 2.55 + 255)) / (255 * (259 - tp.contrast * 2.55));
        for (var i = 0; i < len; i += 4) {
          d[i] = cf * (d[i] - 128) + 128;
          d[i + 1] = cf * (d[i + 1] - 128) + 128;
          d[i + 2] = cf * (d[i + 2] - 128) + 128;
        }
      }
      // Gamma
      if (tp.gamma !== 1 && tp.gamma > 0) {
        var gInv = 1 / tp.gamma;
        for (var i = 0; i < len; i += 4) {
          d[i] = 255 * Math.pow(d[i] / 255, gInv);
          d[i + 1] = 255 * Math.pow(d[i + 1] / 255, gInv);
          d[i + 2] = 255 * Math.pow(d[i + 2] / 255, gInv);
        }
      }
      // Grayscale
      if (tp.grayscale) {
        for (var i = 0; i < len; i += 4) {
          var gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = d[i + 1] = d[i + 2] = gray;
        }
      }
      // Invert
      if (tp.invertColor) {
        for (var i = 0; i < len; i += 4) {
          d[i] = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
      }
      // Clamp
      for (var i = 0; i < len; i += 4) {
        if (d[i] < 0) d[i] = 0; if (d[i] > 255) d[i] = 255;
        if (d[i + 1] < 0) d[i + 1] = 0; if (d[i + 1] > 255) d[i + 1] = 255;
        if (d[i + 2] < 0) d[i + 2] = 0; if (d[i + 2] > 255) d[i + 2] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      callback(c.toDataURL());
    };
    img.src = dataURL;
  }

  // --- Material Database ---
  function showMaterialPicker(doc) {
    var materials = LW.getState().materialDatabase;
    if (!materials || materials.length === 0) {
      $('#lw5-material-editor').remove();
      var html =
        '<div class="lw5-modal-overlay" id="lw5-material-editor">' +
          '<div class="lw5-dialog" style="width:480px;max-height:80vh">' +
            '<div class="lw5-dialog-header"><i class="fas fa-database lw5-dialog-icon"></i><div class="lw5-dialog-header-text"><span class="lw5-dialog-title">Material Database</span><span class="lw5-dialog-subtitle">No materials yet. Add one to get started.</span></div></div>' +
            '<div class="lw5-dialog-body" style="flex-direction:column;padding:16px">' +
              '<button class="lw5-btn lw5-btn-primary" id="lw5-mat-add-first"><i class="fas fa-plus"></i> Add Current Settings as Material</button>' +
            '</div>' +
            '<div class="lw5-dialog-footer"><div class="lw5-dialog-footer-right"><button class="lw5-btn" id="lw5-mat-close">Close</button></div></div>' +
          '</div>' +
        '</div>';
      $(html).appendTo(document.body);
      $('#lw5-mat-add-first').on('click', function () { addMaterialFromDoc(doc); $('#lw5-material-editor').remove(); });
      $('#lw5-mat-close').on('click', function () { $('#lw5-material-editor').remove(); });
      return;
    }
    // Show picker with list of materials
    var listHtml = materials.map(function (m) {
      return '<div class="lw5-mat-item" data-id="' + m.id + '">' +
        '<span class="lw5-mat-name">' + escHtml(m.name || 'Unnamed') + '</span>' +
        '<span class="lw5-mat-type">' + escHtml(m.toolpathType || '') + '</span>' +
        '<button class="lw5-mat-apply btn-xs" title="Apply to document"><i class="fas fa-check"></i></button>' +
        '<button class="lw5-mat-delete btn-xs" title="Delete"><i class="fas fa-trash"></i></button>' +
      '</div>';
    }).join('');
    var html2 =
      '<div class="lw5-modal-overlay" id="lw5-material-editor">' +
        '<div class="lw5-dialog" style="width:520px;max-height:80vh">' +
          '<div class="lw5-dialog-header"><i class="fas fa-database lw5-dialog-icon"></i><div class="lw5-dialog-header-text"><span class="lw5-dialog-title">Material Database</span><span class="lw5-dialog-subtitle">' + materials.length + ' material(s)</span></div></div>' +
          '<div class="lw5-dialog-body" style="flex-direction:column;padding:0">' +
            '<div id="lw5-mat-list" style="max-height:300px;overflow-y:auto;padding:4px 0">' + listHtml + '</div>' +
          '</div>' +
          '<div class="lw5-dialog-footer">' +
            '<div class="lw5-dialog-footer-left">' +
              '<button class="lw5-btn lw5-btn-xs" id="lw5-mat-add"><i class="fas fa-plus"></i> Add Current</button>' +
            '</div>' +
            '<div class="lw5-dialog-footer-right">' +
              '<button class="lw5-btn" id="lw5-mat-close">Close</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    $(html2).appendTo(document.body);
    $('#lw5-mat-add').on('click', function () { addMaterialFromDoc(doc); $('#lw5-material-editor').remove(); });
    $('#lw5-mat-close').on('click', function () { $('#lw5-material-editor').remove(); });
    $('#lw5-mat-list').on('click', '.lw5-mat-apply', function () {
      var id = $(this).closest('.lw5-mat-item').data('id');
      var mat = materials.filter(function (m) { return m.id === id; })[0];
      if (mat && doc) {
        LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: doc.id, changes: { toolpath: JSON.parse(JSON.stringify(mat.toolpath)) } } });
        $('#lw5-material-editor').remove();
        $('#lw5-toolpath-popup').remove();
      }
    });
    $('#lw5-mat-list').on('click', '.lw5-mat-delete', function () {
      var id = $(this).closest('.lw5-mat-item').data('id');
      LW.dispatch({ type: 'MATERIAL_REMOVE', payload: id });
      $('#lw5-material-editor').remove();
    });
  }

  function showMaterialEditor() {
    var materials = LW.getState().materialDatabase;
    var listHtml = (materials && materials.length) ? materials.map(function (m) {
      return '<div class="lw5-mat-item" data-id="' + m.id + '">' +
        '<span class="lw5-mat-name">' + escHtml(m.name || 'Unnamed') + '</span>' +
        '<span class="lw5-mat-type">' + escHtml(m.toolpathType || '') + '</span>' +
        '<div class="lw5-mat-actions">' +
          '<button class="lw5-mat-edit lw5-btn lw5-btn-xs" title="Edit"><i class="fas fa-pen"></i></button>' +
          '<button class="lw5-mat-delete lw5-btn lw5-btn-xs" title="Delete"><i class="fas fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }).join('') : '<div style="padding:24px;text-align:center;color:var(--text-muted)">No materials yet. Add one from a document\'s toolpath popup.</div>';
    $('#lw5-material-editor').remove();
    var html =
      '<div class="lw5-modal-overlay" id="lw5-material-editor">' +
        '<div class="lw5-dialog" style="width:520px;max-height:80vh">' +
          '<div class="lw5-dialog-header"><i class="fas fa-database lw5-dialog-icon"></i><div class="lw5-dialog-header-text"><span class="lw5-dialog-title">Material Database</span><span class="lw5-dialog-subtitle">' + ((materials && materials.length) ? materials.length + ' material(s)' : '') + '</span></div></div>' +
          '<div class="lw5-dialog-body" style="flex-direction:column;padding:0">' +
            '<div id="lw5-mat-list" style="max-height:400px;overflow-y:auto;padding:4px 0">' + listHtml + '</div>' +
          '</div>' +
          '<div class="lw5-dialog-footer">' +
            '<div class="lw5-dialog-footer-left">' +
              '<button class="lw5-btn lw5-btn-xs" id="lw5-mat-export" title="Export as JSON"><i class="fas fa-download"></i> Export</button>' +
            '</div>' +
            '<div class="lw5-dialog-footer-right">' +
              '<button class="lw5-btn" id="lw5-mat-close">Close</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    $(html).appendTo(document.body);
    $('#lw5-mat-close').on('click', function () { $('#lw5-material-editor').remove(); });
    $('#lw5-mat-export').on('click', function () {
      var blob = new Blob([JSON.stringify(materials, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'laserweb-materials.json'; a.click();
      URL.revokeObjectURL(url);
    });
    $('#lw5-mat-list').on('click', '.lw5-mat-delete', function () {
      var id = $(this).closest('.lw5-mat-item').data('id');
      LW.dispatch({ type: 'MATERIAL_REMOVE', payload: id });
      $('#lw5-material-editor').remove();
    });
    $('#lw5-mat-list').on('click', '.lw5-mat-edit', function () {
      var id = $(this).closest('.lw5-mat-item').data('id');
      var mat = materials.filter(function (m) { return m.id === id; })[0];
      if (!mat) return;
      var newName = prompt('Material name:', mat.name || '');
      if (newName) {
        LW.dispatch({ type: 'MATERIAL_UPDATE', payload: { id: id, changes: { name: newName } } });
        $('#lw5-material-editor').remove();
      }
    });
  }

  function addMaterialFromDoc(doc) {
    if (!doc) return;
    var name = prompt('Material name:', doc.name || 'My Material');
    if (!name) return;
    var mat = {
      id: uuid(),
      name: name,
      toolpathType: doc.toolpath ? doc.toolpath.type : 'none',
      toolpath: JSON.parse(JSON.stringify(doc.toolpath || {}))
    };
    LW.dispatch({ type: 'MATERIAL_ADD', payload: mat });
  }

  function ensureVisible(hex) {
    if (!hex || hex === 'none') return '#000000';
    // Named colors
    var named = { white: '#000000', black: '#000000', gray: '#000000', grey: '#000000',
      lightgray: '#000000', lightgrey: '#000000', gainsboro: '#000000', silver: '#000000' };
    var key = hex.toLowerCase().replace(/[^a-z]/g, '');
    if (named[key]) return named[key];
    var rgb = LW.hexToRgb ? LW.hexToRgb(hex) : null;
    if (!rgb) return hex;
    // Perceived luminance: 0.299R + 0.587G + 0.114B
    var lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    return lum > 160 ? '#000000' : hex;
  }

})();
