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
    crossAngle: { name: 'crossAngle', label: 'Cross Angle', units: 'deg', input: 'number' },
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
    'Laser Hatch Fill': { fields: ['name', 'lineDistance', 'lineAngle', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower'] },
    'Laser Cross Hatch': { fields: ['name', 'lineDistance', 'lineAngle', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower'] },
    'Laser Spiral Fill': { fields: ['name', 'lineDistance', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower'] },
    'Laser Concentric Fill': { fields: ['name', 'lineDistance', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower'] },
    'Laser Stipple': { fields: ['name', 'lineDistance', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower'] },
    'Laser Raster': { fields: ['name', 'laserPowerRange', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower', 'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'diagonal', 'overScan', 'useA', 'aAxisDiameter', 'smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering'] },
    'Laser Raster Merge': { fields: ['name', 'laserPowerRange', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower', 'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'diagonal', 'overScan', 'useA', 'aAxisDiameter', 'smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering'] },
    'Mill Pocket': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'ramp'] },
    'Mill Cut': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'segmentLength', 'ramp'] },
    'Mill Cut Inside': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'segmentLength', 'ramp'] },
    'Mill Cut Outside': { fields: ['name', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'segmentLength', 'ramp'] },
    'Mill V Carve': { fields: ['name', 'direction', 'toolAngle', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate'] },
    'Mill Hatch Fill': { fields: ['name', 'direction', 'margin', 'lineDistance', 'lineAngle', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'ramp'] },
    'Mill Cross Hatch': { fields: ['name', 'direction', 'margin', 'lineDistance', 'lineAngle', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'ramp'] },
    'Mill Spiral Fill': { fields: ['name', 'direction', 'margin', 'lineDistance', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'ramp'] },
    'Mill Concentric Fill': { fields: ['name', 'direction', 'margin', 'lineDistance', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'ramp'] },
    'Mill Stipple': { fields: ['name', 'direction', 'margin', 'lineDistance', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'segmentLength', 'plungeRate', 'cutRate'] },
    'Mill Halftone': { fields: ['name', 'toolAngle', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor'] },
    'Mill Wavy Raster': { fields: ['name', 'toolAngle', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor'] },
    'Mill Heightmap': { fields: ['name', 'toolDiameter', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor'] },
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

  function svgPathToRawPaths(d, unitScale, transform) {
    // unitScale: mm per SVG user unit
    // transform: optional [a,b,c,d,e,f] SVG transform matrix applied before scale
    var paths = [];
    var Snap = window.Snap;
    if (Snap && Snap.parsePathString) {
      try {
        var parsed = Snap.parsePathString(d);
        var cubics = Snap.path.toCubic(parsed);
        var currentPath = [];
        var x = 0, y = 0;
        function addPoint(px, py) {
          if (transform) {
            var tx = transform[0] * px + transform[2] * py + transform[4];
            var ty = transform[1] * px + transform[3] * py + transform[5];
            currentPath.push(tx * unitScale, ty * unitScale);
          } else {
            currentPath.push(px * unitScale, py * unitScale);
          }
        }
        for (var i = 0; i < cubics.length; i++) {
          var seg = cubics[i];
          if (seg[0] === 'M' && seg.length === 3) {
            if (currentPath.length > 0) { paths.push(currentPath); currentPath = []; }
            x = seg[1]; y = seg[2];
            addPoint(x, y);
          } else if (seg[0] === 'C' && seg.length === 7) {
            linearizeCubic(x, y, seg[1], seg[2], seg[3], seg[4], seg[5], seg[6], addPoint);
            x = seg[5]; y = seg[6];
          }
        }
        if (currentPath.length > 0) paths.push(currentPath);
        return paths;
      } catch(e) {
        // fall through
      }
    }
    // Fallback: simple parseSVGPathData for M/L/H/V/C
    var factor = unitScale;
    var tokens = parseSVGPathData(d);
    var currentPath = [];
    var x = 0, y = 0;
    var startX = 0, startY = 0;
    function addPoint(px, py) {
      if (transform) {
        var tx = transform[0] * px + transform[2] * py + transform[4];
        var ty = transform[1] * px + transform[3] * py + transform[5];
        currentPath.push(tx * factor, ty * factor);
      } else {
        currentPath.push(px * factor, py * factor);
      }
    }
    for (var i = 0; i < tokens.length; i++) {
      var cmd = tokens[i].cmd, args = tokens[i].args, j;
      switch (cmd) {
        case 'M': if (currentPath.length > 0) { paths.push(currentPath); currentPath = []; } x = args[0]; y = args[1]; addPoint(x, y); startX = x; startY = y; break;
        case 'm': if (currentPath.length > 0) { paths.push(currentPath); currentPath = []; } x += args[0]; y += args[1]; addPoint(x, y); startX = x; startY = y; break;
        case 'L': for (j = 0; j < args.length; j += 2) { x = args[j]; y = args[j + 1]; addPoint(x, y); } break;
        case 'l': for (j = 0; j < args.length; j += 2) { x += args[j]; y += args[j + 1]; addPoint(x, y); } break;
        case 'H': for (j = 0; j < args.length; j++) { x = args[j]; addPoint(x, y); } break;
        case 'h': for (j = 0; j < args.length; j++) { x += args[j]; addPoint(x, y); } break;
        case 'V': for (j = 0; j < args.length; j++) { y = args[j]; addPoint(x, y); } break;
        case 'v': for (j = 0; j < args.length; j++) { y += args[j]; addPoint(x, y); } break;
        case 'C': for (j = 0; j < args.length; j += 6) { linearizeCubic(x, y, args[j], args[j+1], args[j+2], args[j+3], args[j+4], args[j+5], addPoint); x = args[j+4]; y = args[j+5]; } break;
        case 'c': for (j = 0; j < args.length; j += 6) { linearizeCubic(x, y, x+args[j], y+args[j+1], x+args[j+2], y+args[j+3], x+args[j+4], y+args[j+5], addPoint); x += args[j+4]; y += args[j+5]; } break;
        case 'Z': case 'z': if (currentPath.length >= 2 && (currentPath[currentPath.length-2] !== startX*factor || currentPath[currentPath.length-1] !== startY*factor)) addPoint(startX, startY); break;
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

  function parseSvgTransform(str) {
    if (!str || !str.trim()) return null;
    var result = [1, 0, 0, 1, 0, 0];
    var re = /(\w+)\s*\(([^)]*)\)/g;
    var m;
    while ((m = re.exec(str)) !== null) {
      var fn = m[1];
      var args = m[2].trim().split(/[\s,]+/).map(parseFloat);
      var mat;
      switch (fn) {
        case 'matrix':
          mat = [args[0], args[1], args[2], args[3], args[4], args[5]];
          break;
        case 'translate':
          mat = [1, 0, 0, 1, args[0], args[1] || 0];
          break;
        case 'scale':
          mat = [args[0] || 1, 0, 0, args[1] || args[0] || 1, 0, 0];
          break;
        case 'rotate': {
          var ang = args[0] * Math.PI / 180;
          var cos = Math.cos(ang), sin = Math.sin(ang);
          if (args.length >= 3) {
            var cx = args[1], cy = args[2];
            mat = [cos, sin, -sin, cos, cx - cos * cx + sin * cy, cy - sin * cx - cos * cy];
          } else {
            mat = [cos, sin, -sin, cos, 0, 0];
          }
          break;
        }
        case 'skewX': {
          var t = Math.tan(args[0] * Math.PI / 180);
          mat = [1, 0, t, 1, 0, 0];
          break;
        }
        case 'skewY': {
          var t = Math.tan(args[0] * Math.PI / 180);
          mat = [1, t, 0, 1, 0, 0];
          break;
        }
        default:
          continue;
      }
      result = composeMatrices(result, mat);
    }
    return result;
  }

  function composeMatrices(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
  }

  function parseSVGLength(val) {
    if (!val) return null;
    var m = String(val).trim().match(/^([\d.]+)\s*(mm|cm|in|pt|pc|px)?$/);
    if (!m) return null;
    return { value: parseFloat(m[1]), unit: m[2] || 'px' };
  }

  function svgUnitToMm(val, pxPerInch) {
    if (!val) return null;
    var p = parseSVGLength(val);
    if (!p) return null;
    switch (p.unit) {
      case 'mm': return p.value;
      case 'cm': return p.value * 10;
      case 'in': return p.value * 25.4;
      case 'pt': return p.value * 25.4 / 72;
      case 'pc': return p.value * 12 * 25.4 / 72;
      default: return p.value * 25.4 / (pxPerInch || 96);
    }
  }

  function parseSVGString(svgString, pxPerInch) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(svgString, 'image/svg+xml');
    var tags = [];
    var svg = doc.documentElement;
    var viewBox = svg.getAttribute('viewBox');
    var vb = viewBox ? viewBox.split(/[\s,]+/).map(parseFloat) : null;
    var vbW = vb ? vb[2] : null;
    var vbH = vb ? vb[3] : null;

    // Compute mm per user unit from width/height attributes
    var widthMm = svgUnitToMm(svg.getAttribute('width'), pxPerInch);
    var heightMm = svgUnitToMm(svg.getAttribute('height'), pxPerInch);
    var svgW = vbW || (widthMm ? widthMm : 800);
    var svgH = vbH || (heightMm ? heightMm : 600);

    var mmPerUnit;
    if (vbW && widthMm) {
      mmPerUnit = widthMm / vbW;
    } else if (vbH && heightMm) {
      mmPerUnit = heightMm / vbH;
    } else if (vbW && !widthMm) {
      mmPerUnit = 25.4 / (pxPerInch || 96); // px default
    } else {
      mmPerUnit = 25.4 / (pxPerInch || 96);
    }
    // Convert to mm internal units
    var unitScale = mmPerUnit;

    function walkSvg(el, parentTf) {
      var tagName = el.tagName.toLowerCase();
      var tf = parentTf;
      var tStr = el.getAttribute('transform');
      if (tStr) {
        var m = parseSvgTransform(tStr);
        if (m) tf = composeMatrices(tf, m);
      }
      var leaf = tagName === 'path' || tagName === 'rect' || tagName === 'circle' || tagName === 'ellipse' || tagName === 'line' || tagName === 'polyline' || tagName === 'polygon';
      if (leaf) {
        var stroke = el.getAttribute('stroke') || '#000';
        var fill = el.getAttribute('fill') || '#000';
        var strokeWidth = parseFloat(el.getAttribute('stroke-width')) || 1;
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
          d = 'M' + (cx + r) + ',' + cy;
          for (var step = 1; step <= 36; step++) {
            var a = (step / 36) * Math.PI * 2;
            d += ' L' + (cx + r * Math.cos(a)) + ',' + (cy + r * Math.sin(a));
          }
          d += ' Z';
        } else if (tagName === 'ellipse') {
          var ecx = parseFloat(el.getAttribute('cx')) || 0;
          var ecy = parseFloat(el.getAttribute('cy')) || 0;
          var erx = parseFloat(el.getAttribute('rx')) || 0;
          var ery = parseFloat(el.getAttribute('ry')) || 0;
          d = 'M' + (ecx + erx) + ',' + ecy;
          for (var step = 1; step <= 48; step++) {
            var a = (step / 48) * Math.PI * 2;
            d += ' L' + (ecx + erx * Math.cos(a)) + ',' + (ecy + ery * Math.sin(a));
          }
          d += ' Z';
        } else if (tagName === 'line') {
          var lx1 = parseFloat(el.getAttribute('x1')) || 0;
          var ly1 = parseFloat(el.getAttribute('y1')) || 0;
          var lx2 = parseFloat(el.getAttribute('x2')) || 0;
          var ly2 = parseFloat(el.getAttribute('y2')) || 0;
          d = 'M' + lx1 + ',' + ly1 + ' L' + lx2 + ',' + ly2;
        } else if (tagName === 'polyline' || tagName === 'polygon') {
          var points = el.getAttribute('points') || '';
          d = 'M' + points.trim().split(/[\s,]+/).join(' L');
          if (tagName === 'polygon') d += ' Z';
        }

        if (d) {
          var rawPaths = svgPathToRawPaths(d, unitScale, tf);
          tags.push({
            tagName: tagName,
            rawPaths: rawPaths,
            stroke: stroke,
            fill: fill,
            strokeWidth: strokeWidth
          });
        }
      }
      if (!leaf) {
        for (var ci = 0; ci < el.children.length; ci++) {
          var child = el.children[ci];
          var ctag = child.tagName.toLowerCase();
          if (ctag !== 'defs' && ctag !== 'style' && ctag !== 'script' && ctag !== 'title' && ctag !== 'desc' && ctag !== 'metadata') {
            walkSvg(child, tf);
          }
        }
      }
    }

    walkSvg(svg, [1, 0, 0, 1, 0, 0]);

    return { tags: tags, width: svgW, height: svgH, heightMm: svgH * mmPerUnit };
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
    showEmptyState();
  };

  // ---- Operations ---------------------------------------------------------

  ui.renderOperations = function () {};
  
  function showEmptyState() {
    var $es = $('#lw5-empty-state');
    if (LW.getDocuments().length === 0) {
      if ($es.length) return;
      $('<div id="lw5-empty-state" class="lw5-empty-state"> \
        <div class="lw5-empty-state-content"> \
          <i class="fas fa-file-import" style="font-size:64px;opacity:0.3"></i> \
          <h2>No documents loaded</h2> \
          <p>Drop files here or click to open</p> \
          <button class="lw5-tp-btn lw5-tp-btn-primary" style="font-size:18px;padding:12px 32px" id="lw5-empty-open"> \
            <i class="fas fa-folder-open"></i> Open File \
          </button> \
        </div> \
      </div>').appendTo('#lw5-workspace');
      $('#lw5-empty-state').on('click', function () { document.getElementById('file-input').click(); });
      $('#lw5-empty-state').on('dragover', function (e) { e.preventDefault(); e.stopPropagation(); });
      $('#lw5-empty-state').on('drop', function (e) {
        e.preventDefault(); e.stopPropagation();
        var files = e.originalEvent.dataTransfer.files;
        if (files.length) ui.loadDocument(files);
      });
    } else {
      $es.remove();
    }
  }

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
              var yShift = result.heightMm || 0;
              var docs = [];
              var _si = 0;
              for (var t = 0; t < result.tags.length; t++) {
                var tag = result.tags[t];
                var tagPaths = [];
                for (var p = 0; p < tag.rawPaths.length; p++) {
                  var src = tag.rawPaths[p];
                  var shifted = [];
                  for (var k = 0; k < src.length; k += 2) {
                    shifted.push(src[k], src[k + 1] - yShift);
                  }
                  tagPaths.push(shifted);
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
              console.error('SVG parse error:', err);
              ui.showToast('Error parsing SVG: ' + f.name, 'error');
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

    // Fast path: use computed toolpaths if available
    var toolpaths = typeof LW.getToolpaths === 'function' ? LW.getToolpaths() : [];
    var computedToolpaths = toolpaths.filter(function (tp) { return tp.computed && tp.computed.camPaths && tp.computed.camPaths.length; });
    if (computedToolpaths.length) {
      if (!LW.gcode || !LW.gcode.getGcodeFromToolpaths) {
        ui.showToast('GCode engine not available', 'error');
        return;
      }
      LW.dispatch({ type: 'GCODE_UPDATE', payload: { gcoding: { enable: true, percent: 0 } } });
      setTimeout(function () {
        try {
          var gcode = LW.gcode.getGcodeFromToolpaths(computedToolpaths, settings);
          LW.dispatch({ type: 'GCODE_UPDATE', payload: { content: gcode, dirty: true, gcoding: { enable: false, percent: 100 } } });
          ui.showToast('G-Code generated (' + gcode.split('\n').length + ' lines)', 'success');
          if (typeof onPrinted === 'function') onPrinted(gcode);
        } catch (err) {
          LW.dispatch({ type: 'GCODE_UPDATE', payload: { gcoding: { enable: false, percent: 0 } } });
          ui.showToast('G-Code generation failed: ' + err.message, 'error');
          console.error('gcode generation error:', err);
        }
      }, 50);
      return;
    }

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

  // ---- Toolpath Panel -----------------------------------------------------

  function getToolpathTypeIcon(type) {
    var icons = {
      'none': 'fa-ban',
      'cut_on_line': 'fa-vector-square', 'cut_outside': 'fa-vector-square', 'cut_inside': 'fa-vector-square',
      'laser_fill': 'fa-fill-drip', 'laser_hatch': 'fa-border-all', 'laser_crosshatch': 'fa-border-all',
      'laser_spiral': 'fa-circle', 'laser_concentric': 'fa-circle', 'laser_stipple': 'fa-circle',
      'mill_pocket': 'fa-industry', 'mill_cut': 'fa-cut', 'mill_cut_inside': 'fa-cut', 'mill_cut_outside': 'fa-cut',
      'mill_vcarve': 'fa-gem', 'mill_hatch': 'fa-border-all', 'mill_crosshatch': 'fa-border-all',
      'mill_spiral': 'fa-circle', 'mill_concentric': 'fa-circle', 'mill_stipple': 'fa-circle',
      'raster': 'fa-image', 'raster_merge': 'fa-layer-group',
      'mill_halftone': 'fa-image', 'mill_wavy_raster': 'fa-image', 'mill_heightmap': 'fa-image',
      'engrave': 'fa-paint-brush'
    };
    return icons[type] || 'fa-wrench';
  }

  function renderToolpathPanel() {
    var toolpaths = LW.getToolpaths();
    var $list = $('#lw5-tp-list');
    if (!$list.length) return;
    if (!toolpaths || !toolpaths.length) {
      $list.html('<div class="lw5-tp-empty">Select vector shapes, then click <strong>Add</strong> to create a toolpath</div>');
      return;
    }
    var html = '';
    for (var i = 0; i < toolpaths.length; i++) {
      var tp = toolpaths[i];
      var tpData = tp.toolpath || {};
      var type = tpData.type || 'none';
      var icon = getToolpathTypeIcon(type);
      var typeLabel = type.replace(/_/g, ' ');
      var entityCount = tp.entityIds ? tp.entityIds.length : 0;
      var hasComputed = tp.computed && tp.computed.camPaths;
      var statusClass = hasComputed ? 'done' : '';
      var statusText = hasComputed ? 'ready' : (tp.computed ? 'busy' : '');
      var visibleIcon = tp.visible !== false ? 'fa-eye' : 'fa-eye-slash';
      html +=
        '<div class="lw5-tp-item" data-tp-id="' + tp.id + '">' +
          '<button class="lw5-tp-vis" title="' + (tp.visible !== false ? 'Hide' : 'Show') + '"><i class="fas ' + visibleIcon + '"></i></button>' +
          '<span class="lw5-tp-name">' + (tp.name || 'Toolpath') + '</span>' +
          '<span class="lw5-tp-entity-count">' + entityCount + '</span>' +
          '<span class="lw5-tp-type-icon" title="' + typeLabel + '"><i class="fas ' + icon + '"></i></span>' +
          (statusText ? '<span class="lw5-tp-status ' + statusClass + '">' + statusText + '</span>' : '') +
          '<button class="lw5-tp-up" title="Move up"><i class="fas fa-chevron-up"></i></button>' +
          '<button class="lw5-tp-down" title="Move down"><i class="fas fa-chevron-down"></i></button>' +
          '<button class="lw5-tp-del" title="Delete toolpath"><i class="fas fa-trash"></i></button>' +
        '</div>';
    }
    $list.html(html);
  }

  function initToolpathPanel() {
    // Show the panel
    $('#lw5-tp-panel').show();

    // Add toolpath from selected entities
    $('#lw5-tp-add').on('click', function () {
      var selectedIds = LW.draw && LW.draw.getSelected ? LW.draw.getSelected() : [];
      var docs = LW.getDocuments();
      var vectorIds = selectedIds.filter(function (id) {
        var d = docs.filter(function (x) { return x.id === id; })[0];
        return d && d.rawPaths && d.rawPaths.length && d.type !== 'image';
      });
      if (!vectorIds.length) {
        ui.showToast('Select vector shapes on the canvas first', 'warning');
        return;
      }
      var tp = LW.createToolpath(vectorIds);
      LW.dispatch({ type: 'TOOLPATH_ADD', payload: tp });
      renderToolpathPanel();
      ui.showToast('Toolpath "' + tp.name + '" created', 'info');
      // Open config popup for the new toolpath
      if (window.showToolpathPopup) window.showToolpathPopup(tp, null, null, true);
    });

    // Delegated events on the list
    $('#lw5-tp-list').on('click', '.lw5-tp-item', function (e) {
      // Ignore clicks on buttons
      if ($(e.target).closest('button').length) return;
      var id = $(this).data('tp-id');
      var tp = LW.getToolpaths().filter(function (t) { return t.id === id; })[0];
      if (tp) {
        if (window.showToolpathPopup) window.showToolpathPopup(tp, null, null, true);
      }
    });

    $('#lw5-tp-list').on('click', '.lw5-tp-vis', function () {
      var id = $(this).closest('.lw5-tp-item').data('tp-id');
      var tp = LW.getToolpaths().filter(function (t) { return t.id === id; })[0];
      if (tp) {
        LW.dispatch({ type: 'TOOLPATH_UPDATE', payload: { id: id, changes: { visible: !(tp.visible !== false) } } });
        renderToolpathPanel();
      }
    });

    $('#lw5-tp-list').on('click', '.lw5-tp-del', function () {
      var id = $(this).closest('.lw5-tp-item').data('tp-id');
      LW.dispatch({ type: 'TOOLPATH_REMOVE', payload: id });
      renderToolpathPanel();
    });

    $('#lw5-tp-list').on('click', '.lw5-tp-up', function () {
      var id = $(this).closest('.lw5-tp-item').data('tp-id');
      var tps = LW.getToolpaths();
      var idx = tps.findIndex(function (t) { return t.id === id; });
      if (idx > 0) {
        var ids = tps.map(function (t) { return t.id; });
        ids.splice(idx - 1, 0, ids.splice(idx, 1)[0]);
        LW.dispatch({ type: 'TOOLPATH_REORDER', payload: ids });
        renderToolpathPanel();
      }
    });

    $('#lw5-tp-list').on('click', '.lw5-tp-down', function () {
      var id = $(this).closest('.lw5-tp-item').data('tp-id');
      var tps = LW.getToolpaths();
      var idx = tps.findIndex(function (t) { return t.id === id; });
      if (idx < tps.length - 1) {
        var ids = tps.map(function (t) { return t.id; });
        ids.splice(idx + 1, 0, ids.splice(idx, 1)[0]);
        LW.dispatch({ type: 'TOOLPATH_REORDER', payload: ids });
        renderToolpathPanel();
      }
    });
  }

  // ---- Init ---------------------------------------------------------------

  ui.init = function () {
    initPaneSwitching();
    bindStateEvents();
    bindToolbarButtons();
    initOverlayToggle();
    initTransformBar();
    setupDocDropZone();
    initToolpathPanel();

    LW.on('stateChanged', function () {
      ui.renderDocuments();
      renderToolpathPanel();
    });

    ui.renderDocuments();
    ui.renderOperations();
    ui.renderSettings();
    ui.renderFloatingControls();
    updateGcodeProgress();
    renderToolpathPanel();

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

  function generatePreviewGcode(doc, geometryOverride) {
    var tp = doc.toolpath;
    if (!tp || tp.type === 'none') return '';
    if (!LW.mesh || !LW.cam) return '';
    var mmToClipperScale = LW.mesh.mmToClipperScale || 50000000;
    var scale = 1 / mmToClipperScale;
    var geometry = geometryOverride || (doc.rawPaths ? LW.mesh.rawPathsToClipperPaths(doc.rawPaths, doc.transform2d) : null);
    if (!geometry || !geometry.length) return '';
    var t = tp.type;
    var camPaths;
    try {
      if (t === 'cut_on_line' || t === 'engrave') {
        camPaths = LW.cam.cut(geometry, [], false);
      } else if (t === 'cut_outside' || t === 'laser_cut_outside') {
        if (tp.margin) geometry = LW.mesh.offset(geometry, tp.margin * mmToClipperScale);
        camPaths = LW.cam.cut(geometry, [], false);
      } else if (t === 'cut_inside' || t === 'laser_cut_inside') {
        if (tp.margin) geometry = LW.mesh.offset(geometry, -tp.margin * mmToClipperScale);
        camPaths = LW.cam.cut(geometry, [], false);
      } else if (t === 'pocket' || t === 'laser_fill' || t === 'laser_hatch') {
        camPaths = LW.cam.fillPath(geometry, (tp.lineDistance || 0.1) * mmToClipperScale, tp.lineAngle || 0);
      } else if (t === 'laser_crosshatch') {
        var ld = (tp.lineDistance || 0.1) * mmToClipperScale;
        camPaths = LW.cam.fillPath(geometry, ld, tp.lineAngle || 0).concat(LW.cam.fillPath(geometry, ld, tp.crossAngle || 90));
      } else if (t === 'laser_spiral') {
        camPaths = LW.cam.pocket(geometry, (tp.lineDistance || 0.1) * mmToClipperScale, tp.stepOver || 10, false);
      } else if (t === 'laser_concentric') {
        camPaths = LW.cam.insideOutside(geometry, (tp.lineDistance || 0.1) * mmToClipperScale, true, (tp.cutWidth || 0) * mmToClipperScale, tp.stepOver || 10, false, false);
      } else if (t === 'laser_stipple') {
        camPaths = LW.cam.fillPath(geometry, (tp.lineDistance || 0.1) * mmToClipperScale, tp.lineAngle || 0);
      } else if (t === 'mill_pocket') {
        camPaths = LW.cam.pocket(geometry, (tp.toolDiameter || 3) * mmToClipperScale, tp.stepOver || 10, (tp.direction || 'Conventional') === 'Climb');
      } else if (t === 'mill_cut' || t === 'mill_cut_inside' || t === 'mill_cut_outside') {
        camPaths = LW.cam.cut(geometry, [], (tp.direction || 'Conventional') === 'Climb');
      } else if (t === 'mill_hatch') {
        camPaths = LW.cam.fillPath(geometry, (tp.lineDistance || 0.1) * mmToClipperScale, tp.lineAngle || 0);
      } else if (t === 'mill_crosshatch') {
        var ld = (tp.lineDistance || 0.1) * mmToClipperScale;
        camPaths = LW.cam.fillPath(geometry, ld, tp.lineAngle || 0).concat(LW.cam.fillPath(geometry, ld, tp.crossAngle || 90));
      } else if (t === 'mill_spiral') {
        camPaths = LW.cam.pocket(geometry, (tp.toolDiameter || 3) * mmToClipperScale, tp.stepOver || 10, (tp.direction || 'Conventional') === 'Climb');
      } else if (t === 'mill_concentric') {
        camPaths = LW.cam.insideOutside(geometry, (tp.toolDiameter || 3) * mmToClipperScale, true, (tp.cutWidth || 0) * mmToClipperScale, tp.stepOver || 10, (tp.direction || 'Conventional') === 'Climb', true);
      } else if (t === 'mill_stipple') {
        camPaths = LW.cam.fillPath(geometry, (tp.lineDistance || 0.1) * mmToClipperScale, tp.lineAngle || 0);
      } else {
        return '';
      }
    } catch (e) {
      return '';
    }
    if (!camPaths || !camPaths.length) return '';
    var prec = 3;
    var lines = [];
    for (var i = 0; i < camPaths.length; i++) {
      var pp = camPaths[i].path;
      if (!pp || !pp.length) continue;
      lines.push('G0 X' + (pp[0].X * scale).toFixed(prec) + ' Y' + (pp[0].Y * scale).toFixed(prec));
      for (var j = 1; j < pp.length; j++) {
        lines.push('G1 X' + (pp[j].X * scale).toFixed(prec) + ' Y' + (pp[j].Y * scale).toFixed(prec));
      }
    }
    return lines.join('\n');
  }

  // ---- Calculate progress dialog ------------------------------------------

  var _calcWorker = null;

  function showCalculateDialog() {
    $('#lw5-calc-overlay').remove();
    var html =
      '<div class="lw5-modal-overlay" id="lw5-calc-overlay">' +
        '<div class="lw5-dialog" style="width:300px;text-align:center">' +
          '<div class="lw5-dialog-body" style="flex-direction:column;padding:24px">' +
            '<i class="fas fa-spinner fa-pulse" style="font-size:32px;margin-bottom:16px;color:var(--primary)"></i>' +
            '<div style="font-size:14px;margin-bottom:4px">Calculating Toolpath...</div>' +
            '<div style="font-size:11px;color:var(--text-muted)" id="lw5-calc-status"></div>' +
            '<button class="lw5-btn lw5-btn-xs" id="lw5-calc-cancel" style="margin-top:12px">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    $(html).appendTo(document.body);
    $('#lw5-calc-cancel').on('click', function () { hideCalculateDialog(); });
  }

  function hideCalculateDialog() {
    if (_calcWorker) { _calcWorker.terminate(); _calcWorker = null; }
    $('#lw5-calc-overlay').remove();
  }

  function updateCalcStatus(msg) {
    $('#lw5-calc-status').text(msg);
  }

  // ---- Preview worker ------------------------------------------------------

  function runPreviewWorker(geometry, toolpath, mmToClipperScale, onDone) {
    var basePath = window.location.href.replace(/\/[^/]*$/, '/');
    var libBoot = [
      'var window = self;',
      'importScripts("' + basePath + 'vendors/clipper-lib.js");',
      'importScripts("' + basePath + 'vendors/poly2tri.js");',
      'var Module = { locateFile: function(p) { return "' + basePath + 'dependencies/cam-cpp/" + p; } };',
      'importScripts("' + basePath + 'dependencies/cam-cpp/web-cam-cpp.js");',
      'importScripts("' + basePath + 'js/lw5-mesh.js");',
      'importScripts("' + basePath + 'js/lw5-cam.js");',
      'self.__mesh__ = LW.mesh;',
      'self.__cam__ = LW.cam;',
    ].join('\n');

    var workerCode = [
      'self.onmessage = function(e) {',
      '  var d = e.data;',
      '  function run() {',
      '    var mesh = self.__mesh__;',
      '    var cam = self.__cam__;',
      '    var tp = d.tp;',
      '    var geometry = d.geometry;',
      '    var mm = d.mmToClipperScale;',
      '    var scale = 1 / mm;',
      '    var camPaths;',
      '    try {',
      '      var t = tp.type;',
      '      if (t === "cut_on_line" || t === "engrave") {',
      '        camPaths = cam.cut(geometry, [], false);',
      '      } else if (t === "cut_outside" || t === "laser_cut_outside") {',
      '        if (tp.margin) geometry = mesh.offset(geometry, tp.margin * mm);',
      '        camPaths = cam.cut(geometry, [], false);',
      '      } else if (t === "cut_inside" || t === "laser_cut_inside") {',
      '        if (tp.margin) geometry = mesh.offset(geometry, -tp.margin * mm);',
      '        camPaths = cam.cut(geometry, [], false);',
      '      } else if (t === "pocket" || t === "laser_fill" || t === "laser_hatch") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      } else if (t === "laser_crosshatch") {',
      '        var ld = (tp.lineDistance || 0.1) * mm;',
      '        camPaths = cam.fillPath(geometry, ld, tp.lineAngle || 0).concat(cam.fillPath(geometry, ld, tp.crossAngle || 90));',
      '      } else if (t === "laser_spiral") {',
      '        camPaths = cam.pocket(geometry, (tp.lineDistance || 0.1) * mm, tp.stepOver || 10, false);',
      '      } else if (t === "laser_concentric") {',
      '        camPaths = cam.insideOutside(geometry, (tp.lineDistance || 0.1) * mm, true, (tp.cutWidth || 0) * mm, tp.stepOver || 10, false, false);',
      '      } else if (t === "laser_stipple") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      } else if (t === "mill_pocket") {',
      '        camPaths = cam.pocket(geometry, (tp.toolDiameter || 3) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb");',
      '      } else if (t === "mill_cut" || t === "mill_cut_inside" || t === "mill_cut_outside") {',
      '        camPaths = cam.cut(geometry, [], (tp.direction || "Conventional") === "Climb");',
      '      } else if (t === "mill_hatch") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      } else if (t === "mill_crosshatch") {',
      '        var ld = (tp.lineDistance || 0.1) * mm;',
      '        camPaths = cam.fillPath(geometry, ld, tp.lineAngle || 0).concat(cam.fillPath(geometry, ld, tp.crossAngle || 90));',
      '      } else if (t === "mill_spiral") {',
      '        camPaths = cam.pocket(geometry, (tp.toolDiameter || 3) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb");',
      '      } else if (t === "mill_concentric") {',
      '        camPaths = cam.insideOutside(geometry, (tp.toolDiameter || 3) * mm, true, (tp.cutWidth || 0) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb", true);',
      '      } else if (t === "mill_stipple") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      }',
      '    } catch(e) {',
      '      self.postMessage(JSON.stringify({ event: "onError", error: e.toString() }));',
      '      return;',
      '    }',
      '    if (!camPaths || !camPaths.length) {',
      '      self.postMessage(JSON.stringify({ event: "onDone", gcode: "" }));',
      '      return;',
      '    }',
      '    var lines = [];',
      '    for (var i = 0; i < camPaths.length; i++) {',
      '      var pp = camPaths[i].path;',
      '      if (!pp || !pp.length) continue;',
      '      lines.push("G0 X" + (pp[0].X * scale).toFixed(3) + " Y" + (pp[0].Y * scale).toFixed(3));',
      '      for (var j = 1; j < pp.length; j++) {',
      '        lines.push("G1 X" + (pp[j].X * scale).toFixed(3) + " Y" + (pp[j].Y * scale).toFixed(3));',
      '      }',
      '    }',
      '    self.postMessage(JSON.stringify({ event: "onDone", gcode: lines.join("\\n") }));',
      '  }',
      '  if (typeof Module !== "undefined" && typeof Module._separateTabs === "function") {',
      '    run();',
      '  } else if (typeof Module !== "undefined") {',
      '    var _waitOrig = Module.onRuntimeInitialized;',
      '    Module.onRuntimeInitialized = function() {',
      '      if (_waitOrig) _waitOrig();',
      '      run();',
      '    };',
      '  } else {',
      '    setTimeout(run, 100);',
      '  }',
      '};'
    ].join('\n');

    hideCalculateDialog();
    showCalculateDialog();

    var worker = new Worker(URL.createObjectURL(new Blob([libBoot + '\n' + workerCode])));
    _calcWorker = worker;

    worker.onmessage = function (e) {
      var data = JSON.parse(e.data);
      if (data.event === 'onDone') {
        hideCalculateDialog();
        if (typeof onDone === 'function') onDone(data.gcode);
      } else if (data.event === 'onError') {
        hideCalculateDialog();
        if (typeof onDone === 'function') onDone('');
      }
    };

    worker.postMessage({ tp: toolpath, geometry: geometry, mmToClipperScale: mmToClipperScale });
  }

  // ---- Toolpath worker (returns camPaths polygons, not gcode) --------------

  function runToolpathWorker(geometry, toolpath, mmToClipperScale, onDone) {
    var basePath = window.location.href.replace(/\/[^/]*$/, '/');
    var libBoot = [
      'var window = self;',
      'importScripts("' + basePath + 'vendors/clipper-lib.js");',
      'importScripts("' + basePath + 'vendors/poly2tri.js");',
      'var Module = { locateFile: function(p) { return "' + basePath + 'dependencies/cam-cpp/" + p; } };',
      'importScripts("' + basePath + 'dependencies/cam-cpp/web-cam-cpp.js");',
      'importScripts("' + basePath + 'js/lw5-mesh.js");',
      'importScripts("' + basePath + 'js/lw5-cam.js");',
      'self.__mesh__ = LW.mesh;',
      'self.__cam__ = LW.cam;',
    ].join('\n');

    var workerCode = [
      'self.onmessage = function(e) {',
      '  var d = e.data;',
      '  function run() {',
      '    var mesh = self.__mesh__;',
      '    var cam = self.__cam__;',
      '    var tp = d.tp;',
      '    var geometry = d.geometry;',
      '    var mm = d.mmToClipperScale;',
      '    var camPaths;',
      '    try {',
      '      var t = tp.type;',
      '      if (t === "cut_on_line" || t === "engrave") {',
      '        camPaths = cam.cut(geometry, [], false);',
      '      } else if (t === "cut_outside" || t === "laser_cut_outside") {',
      '        if (tp.margin) geometry = mesh.offset(geometry, tp.margin * mm);',
      '        camPaths = cam.insideOutside(geometry, (tp.toolDiameter || 0.1) * mm, false, (tp.cutWidth || 0) * mm, tp.stepOver || 10, false, false);',
      '      } else if (t === "cut_inside" || t === "laser_cut_inside") {',
      '        if (tp.margin) geometry = mesh.offset(geometry, -tp.margin * mm);',
      '        camPaths = cam.insideOutside(geometry, (tp.toolDiameter || 0.1) * mm, true, (tp.cutWidth || 0) * mm, tp.stepOver || 10, false, false);',
      '      } else if (t === "pocket" || t === "laser_fill" || t === "laser_hatch") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      } else if (t === "laser_crosshatch") {',
      '        var ld = (tp.lineDistance || 0.1) * mm;',
      '        camPaths = cam.fillPath(geometry, ld, tp.lineAngle || 0).concat(cam.fillPath(geometry, ld, tp.crossAngle || 90));',
      '      } else if (t === "laser_spiral") {',
      '        camPaths = cam.pocket(geometry, (tp.lineDistance || 0.1) * mm, tp.stepOver || 10, false);',
      '      } else if (t === "laser_concentric") {',
      '        camPaths = cam.insideOutside(geometry, (tp.lineDistance || 0.1) * mm, true, (tp.cutWidth || 0) * mm, tp.stepOver || 10, false, false);',
      '      } else if (t === "laser_stipple") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      } else if (t === "mill_pocket") {',
      '        camPaths = cam.pocket(geometry, (tp.toolDiameter || 3) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb");',
      '      } else if (t === "mill_cut") {',
      '        camPaths = cam.cut(geometry, [], (tp.direction || "Conventional") === "Climb");',
      '      } else if (t === "mill_cut_outside") {',
      '        if (tp.margin) geometry = mesh.offset(geometry, tp.margin * mm);',
      '        camPaths = cam.insideOutside(geometry, (tp.toolDiameter || 3) * mm, false, (tp.cutWidth || 0) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb", true);',
      '      } else if (t === "mill_cut_inside") {',
      '        if (tp.margin) geometry = mesh.offset(geometry, -tp.margin * mm);',
      '        camPaths = cam.insideOutside(geometry, (tp.toolDiameter || 3) * mm, true, (tp.cutWidth || 0) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb", true);',
      '      } else if (t === "mill_vcarve") {',
      '        camPaths = cam.vCarve ? cam.vCarve(geometry, tp.toolAngle || 45, tp.passDepth || 1) : [];',
      '      } else if (t === "mill_hatch") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      } else if (t === "mill_crosshatch") {',
      '        var ld = (tp.lineDistance || 0.1) * mm;',
      '        camPaths = cam.fillPath(geometry, ld, tp.lineAngle || 0).concat(cam.fillPath(geometry, ld, tp.crossAngle || 90));',
      '      } else if (t === "mill_spiral") {',
      '        camPaths = cam.pocket(geometry, (tp.toolDiameter || 3) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb");',
      '      } else if (t === "mill_concentric") {',
      '        camPaths = cam.insideOutside(geometry, (tp.toolDiameter || 3) * mm, true, (tp.cutWidth || 0) * mm, tp.stepOver || 10, (tp.direction || "Conventional") === "Climb", true);',
      '      } else if (t === "mill_stipple") {',
      '        camPaths = cam.fillPath(geometry, (tp.lineDistance || 0.1) * mm, tp.lineAngle || 0);',
      '      }',
      '    } catch(e) {',
      '      self.postMessage(JSON.stringify({ event: "onError", error: e.toString() }));',
      '      return;',
      '    }',
      '    if (!camPaths || !camPaths.length) camPaths = [];',
      '    self.postMessage(JSON.stringify({ event: "onDone", camPaths: camPaths }));',
      '  }',
      '  if (typeof Module !== "undefined" && typeof Module._separateTabs === "function") {',
      '    run();',
      '  } else if (typeof Module !== "undefined") {',
      '    var _waitOrig = Module.onRuntimeInitialized;',
      '    Module.onRuntimeInitialized = function() {',
      '      if (_waitOrig) _waitOrig();',
      '      run();',
      '    };',
      '  } else {',
      '    setTimeout(run, 100);',
      '  }',
      '};'
    ].join('\n');

    showCalculateDialog();

    var worker = new Worker(URL.createObjectURL(new Blob([libBoot + '\n' + workerCode])));
    _calcWorker = worker;

    worker.onmessage = function (e) {
      var data = JSON.parse(e.data);
      if (data.event === 'onDone') {
        hideCalculateDialog();
        if (typeof onDone === 'function') onDone(data.camPaths || []);
      } else if (data.event === 'onError') {
        hideCalculateDialog();
        if (typeof onDone === 'function') onDone([]);
      }
    };

    worker.postMessage({ tp: toolpath, geometry: geometry, mmToClipperScale: mmToClipperScale });
  }

  function unionDocsGeometry(docIds, transform2d) {
    if (!docIds || docIds.length < 2 || !LW.mesh || !LW.getState) return null;
    var allDocs = LW.getState().documents;
    var geometries = [];
    for (var i = 0; i < docIds.length; i++) {
      var d = allDocs.filter(function (x) { return x.id === docIds[i]; })[0];
      if (!d || !d.rawPaths || !d.rawPaths.length) continue;
      if (d.type === 'image' || (d.dataURL && d.dataURL.indexOf('data:image/') === 0)) continue;
      var g = LW.mesh.rawPathsToClipperPaths(d.rawPaths, transform2d);
      if (g && g.length) geometries.push(g);
    }
    if (geometries.length < 2) return geometries.length === 1 ? geometries[0] : null;
    var combined = LW.mesh.union(geometries[0], geometries[1]);
    for (var i = 2; i < geometries.length; i++) {
      combined = LW.mesh.union(combined, geometries[i]);
    }
    return combined;
  }

  function previewAllToolpaths(retries) {
    if (retries === undefined) retries = 0;
    if (!LW.mesh || !LW.cam) return;
    if (retries > 50) return;
    if (typeof Module === 'undefined' || typeof Module._separateTabs !== 'function') {
      setTimeout(function () { previewAllToolpaths(retries + 1); }, 100);
      return;
    }
    var docs = LW.getState().documents;
    var allGcode = [];
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var tp = doc.toolpath;
      if (!tp || tp.type === 'none') continue;
      if (tp.type === 'raster' || tp.type === 'raster_merge' || tp.type === 'mill_vcarve' || tp.type === 'mill_halftone' || tp.type === 'mill_wavy_raster' || tp.type === 'mill_heightmap') continue;
      if (!doc.rawPaths || !doc.rawPaths.length) continue;
      var g = generatePreviewGcode(doc);
      if (g) allGcode.push(g);
    }
    if (!allGcode.length) return;
    LW.dispatch({ type: 'GCODE_UPDATE', payload: { content: allGcode.join('\n'), dirty: true, gcoding: { enable: false, percent: 100 } } });
  }

  function fallbackFullGenerate(doc) {
    if (typeof window.toolpathToOperation !== 'function' || !LW.gcode || !LW.gcode.getGcode) return;
    var op = window.toolpathToOperation(doc);
    if (!op) return;
    var state = LW.getState();
    LW.gcode.getGcode(state.settings, state.documents, [op], null,
      function () {},
      function (gcode) {
        LW.dispatch({ type: 'GCODE_UPDATE', payload: { content: gcode, dirty: true, gcoding: { enable: false, percent: 100 } } });
      },
      function () {}
    );
  }

  function showToolpathPopup(doc, canvasPos, selectedIds, isToolpath) {
    $('#lw5-toolpath-popup').remove();

    if (!doc) return;

    var toolpathObj = isToolpath ? doc : null;
    var actualDoc = isToolpath ? null : doc;

    var combineIds, combineCount;
    if (toolpathObj) {
      var docs = LW.getDocuments();
      var entityIds = toolpathObj.entityIds || [];
      combineIds = entityIds.length > 1 ? entityIds : null;
      combineCount = entityIds.length;
    } else {
      combineIds = selectedIds && selectedIds.length > 1 ? selectedIds : null;
      combineCount = combineIds ? combineIds.length : 1;
    }

    var tp = toolpathObj ? (toolpathObj.toolpath || {}) : (actualDoc.toolpath || {});
    tp = Object.assign({ type: 'none', power: 0, speed: 0, passes: 0, margin: 0, segmentLength: 1, trimLine: false, dpi: 250, direction: 'top_to_bottom', brightness: 0, contrast: 0, gamma: 1, grayscale: false, dithering: 'none' }, tp);

    var allTypes = ['none', 'engrave', 'cut_on_line', 'cut_outside', 'cut_inside', 'laser_fill', 'laser_cut_inside', 'laser_cut_outside', 'laser_hatch', 'laser_crosshatch', 'laser_spiral', 'laser_concentric', 'laser_stipple', 'mill_pocket', 'mill_cut', 'mill_cut_inside', 'mill_cut_outside', 'mill_vcarve', 'mill_hatch', 'mill_crosshatch', 'mill_spiral', 'mill_concentric', 'mill_stipple', 'raster', 'raster_merge', 'mill_halftone', 'mill_wavy_raster', 'mill_heightmap'];
    var vectorTypes = ['none', 'engrave', 'cut_on_line', 'cut_outside', 'cut_inside', 'laser_fill', 'laser_cut_inside', 'laser_cut_outside', 'laser_hatch', 'laser_crosshatch', 'laser_spiral', 'laser_concentric', 'laser_stipple', 'mill_pocket', 'mill_cut', 'mill_cut_inside', 'mill_cut_outside', 'mill_vcarve', 'mill_hatch', 'mill_crosshatch', 'mill_spiral', 'mill_concentric', 'mill_stipple'];
    var bitmapTypes = ['raster', 'raster_merge', 'mill_halftone', 'mill_wavy_raster', 'mill_heightmap'];
    var isBitmapDoc = actualDoc && (actualDoc.type === 'image' || (actualDoc.dataURL && actualDoc.dataURL.indexOf('data:image/') === 0));
    var types = isBitmapDoc ? bitmapTypes : vectorTypes;
    var typeOptions = types.map(function (t) {
      return '<option value="' + t + '"' + (tp.type === t ? ' selected' : '') + '>' + t.replace(/_/g, ' ') + '</option>';
    }).join('');

    var subtitle = toolpathObj ? toolpathObj.name + ' (' + combineCount + ' shapes)' : (combineCount > 1 ? combineCount + ' vectors selected' : '1 Vector');
    var isRaster = tp.type === 'raster' || tp.type === 'raster_merge' || tp.type === 'mill_halftone' || tp.type === 'mill_wavy_raster' || tp.type === 'mill_heightmap';
    var isMill = tp.type.indexOf('mill_') === 0;
    var isBitmapMill = tp.type === 'mill_halftone' || tp.type === 'mill_wavy_raster' || tp.type === 'mill_heightmap';
    var isVcarve = tp.type === 'mill_vcarve';
    var isFill = tp.type === 'laser_fill' || tp.type === 'laser_hatch' || tp.type === 'laser_crosshatch' || tp.type === 'laser_spiral' || tp.type === 'laser_concentric' || tp.type === 'laser_stipple' || tp.type === 'mill_pocket' || tp.type === 'mill_hatch' || tp.type === 'mill_crosshatch' || tp.type === 'mill_spiral' || tp.type === 'mill_concentric' || tp.type === 'mill_stipple';
    var isCrossHatch = tp.type === 'laser_crosshatch' || tp.type === 'mill_crosshatch';

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
                '<div class="lw5-dialog-section-title">Power &amp; Speed</div>' +
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
              '<div class="lw5-dialog-section">' +
                '<div class="lw5-dialog-section-title">Tool</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Tool Dia</label>' +
                  '<input type="number" id="lw5-pp-toolDia" value="' + (tp.toolDiameter || 0.5) + '" step="0.01" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">mm</span>' +
                '</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Segment Len</label>' +
                  '<input type="number" id="lw5-pp-seg" value="' + tp.segmentLength + '" step="0.5" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">mm  (point spacing)</span>' +
                '</div>' +
              '</div>' +
              '<div class="lw5-dialog-section lw5-pp-fill" style="' + (isFill ? '' : 'display:none') + '">' +
                '<div class="lw5-dialog-section-title">Fill Pattern</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Line Spacing</label>' +
                  '<input type="number" id="lw5-pp-lineDist" value="' + (tp.lineDistance || 0.1) + '" step="0.01" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">mm  (gap between passes)</span>' +
                '</div>' +
                '<div class="lw5-dialog-row">' +
                  '<label>Fill Angle</label>' +
                  '<input type="number" id="lw5-pp-lineAngle" value="' + (tp.lineAngle || 0) + '" step="1" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">deg  (0=horizontal, 90=vertical)</span>' +
                '</div>' +
                '<div class="lw5-dialog-row lw5-pp-crosshatch" style="' + (isCrossHatch ? '' : 'display:none') + '">' +
                  '<label>Cross Hatch</label>' +
                  '<input type="number" id="lw5-pp-crossAngle" value="' + (tp.crossAngle || 90) + '" step="1" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">deg  (2nd pass angle)</span>' +
                '</div>' +
              '</div>' +
              '<div class="lw5-dialog-section lw5-pp-depth" style="' + (isMill ? '' : 'display:none') + '">' +
                '<div class="lw5-dialog-section-title">Depth &amp; Step</div>' +
                '<div class="lw5-dialog-row"><label>Pass Depth</label><input type="number" id="lw5-pp-passDepth" value="' + (tp.passDepth || 1) + '" step="0.1" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">mm</span></div>' +
                '<div class="lw5-dialog-row"><label>Start Z</label><input type="number" id="lw5-pp-millStartZ" value="' + (tp.millStartZ || 0) + '" step="0.1" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">mm</span></div>' +
                '<div class="lw5-dialog-row"><label>End Z</label><input type="number" id="lw5-pp-millEndZ" value="' + (tp.millEndZ || -1) + '" step="0.1" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">mm</span></div>' +
                '<div class="lw5-dialog-row"><label>Step Over</label><input type="number" id="lw5-pp-stepOver" value="' + (tp.stepOver || 10) + '" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">% of tool dia</span></div>' +
                '<div class="lw5-dialog-row"><label>Direction</label><select id="lw5-pp-millDir"><option value="Conventional"' + ((tp.direction || 'Conventional') === 'Conventional' ? ' selected' : '') + '>Conventional</option><option value="Climb"' + (tp.direction === 'Climb' ? ' selected' : '') + '>Climb</option></select></div>' +
                '<div class="lw5-dialog-row lw5-pp-vcarve" style="' + (isVcarve ? '' : 'display:none') + '"><label>Tool Angle</label><input type="number" id="lw5-pp-toolAngle" value="' + (tp.toolAngle || 90) + '" class="lw5-dialog-num" style="width:70px" /><span style="font-size:10px;color:var(--text-muted);margin-left:4px">deg</span></div>' +
              '</div>' +
              '<div style="margin-top:4px">' +
                '<button class="lw5-btn lw5-btn-xs" id="lw5-pp-advanced-toggle" style="width:100%"><i class="fas fa-cog"></i> Advanced</button>' +
                '<div id="lw5-pp-advanced" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' +
                  '<div class="lw5-dialog-section">' +
                    '<div class="lw5-dialog-section-title">Common</div>' +
                    '<div class="lw5-dialog-row"><label>Margin</label><input type="number" id="lw5-pp-margin" value="' + tp.margin + '" step="0.01" class="lw5-dialog-num" style="width:80px" /></div>' +
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
                    '<div class="lw5-dialog-row"><label>Plunge</label><input type="number" id="lw5-pp-plungeRate" value="' + (tp.plungeRate || 300) + '" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label>Rapid Z</label><input type="number" id="lw5-pp-millRapidZ" value="' + (tp.millRapidZ || 10) + '" class="lw5-dialog-num" style="width:80px" /></div>' +
                    '<div class="lw5-dialog-row"><label class="lw5-dialog-check"><input type="checkbox" id="lw5-pp-ramp" ' + (tp.ramp ? 'checked' : '') + ' /> Ramp</label></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          (combineCount > 1
            ? '<div class="lw5-dialog-section"><div class="lw5-dialog-row"><label class="lw5-dialog-check"><input type="checkbox" id="lw5-pp-combine" checked /> Combine ' + combineCount + ' vectors (Clipper union)</label></div></div>'
            : '') +
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
        lineDistance: parseFloat($('#lw5-pp-lineDist').val()) || 0.1,
        lineAngle: parseFloat($('#lw5-pp-lineAngle').val()) || 0,
        crossAngle: parseFloat($('#lw5-pp-crossAngle').val()) || 90,
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
        toolDiameter: parseFloat($('#lw5-pp-toolDia').val()) || 0.5,
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
      if (toolpathObj) {
        LW.dispatch({ type: 'TOOLPATH_UPDATE', payload: { id: toolpathObj.id, changes: { toolpath: newTp, computed: null } } });
      } else if (actualDoc) {
        LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: actualDoc.id, changes: { toolpath: newTp } } });
      }
      if (typeof LW.saveLastToolpath === 'function') LW.saveLastToolpath(newTp);
      // Trigger image filter preview (doc mode only)
      if (actualDoc && actualDoc.type === 'image' && (newTp.type === 'raster' || newTp.type === 'raster_merge')) {
        applyImageFilters(actualDoc.dataURL, newTp, function (filteredUrl) {
          if (filteredUrl) {
            actualDoc._filteredDataURL = filteredUrl;
          }
          // Force canvas redraw
          LW.draw.updateDocuments(LW.getState().documents);
        });
      } else if (actualDoc && actualDoc.type === 'image') {
        delete actualDoc._filteredDataURL;
      }
    }

    // Live update on input changes
    $('#lw5-pp-power').on('input', function () { $('#lw5-pp-power-val').text(this.value + '%'); updateDoc(); });
    $('#lw5-pp-speed').on('input', function () { $('#lw5-pp-speed-val').text(this.value); updateDoc(); });
    $('#lw5-pp-type').on('change', function () {
      var v = $(this).val();
      var isMill = v.indexOf('mill_') === 0;
      var isRaster = v === 'raster' || v === 'raster_merge' || v === 'mill_halftone' || v === 'mill_wavy_raster' || v === 'mill_heightmap';
      var isVcarve = v === 'mill_vcarve';
      var isFill = v === 'laser_fill' || v === 'laser_hatch' || v === 'laser_crosshatch' || v === 'laser_spiral' || v === 'laser_concentric' || v === 'laser_stipple' || v === 'mill_pocket' || v === 'mill_hatch' || v === 'mill_crosshatch' || v === 'mill_spiral' || v === 'mill_concentric' || v === 'mill_stipple';
      var isCrossHatch = v === 'laser_crosshatch' || v === 'mill_crosshatch';
      $('.lw5-pp-depth').toggle(isMill);
      $('.lw5-pp-vcarve').toggle(isVcarve);
      $('.lw5-pp-mill').toggle(isMill);
      $('.lw5-pp-raster').toggle(isRaster);
      $('.lw5-pp-fill').toggle(isFill);
      $('.lw5-pp-crosshatch').toggle(isCrossHatch);
      updateDoc();
    });
    $('#lw5-pp-passes, #lw5-pp-margin, #lw5-pp-seg, #lw5-pp-dpi').on('change', updateDoc);
    $('#lw5-pp-trim, #lw5-pp-grayscale, #lw5-pp-invert, #lw5-pp-diagonal, #lw5-pp-smooth').on('change', updateDoc);
    $('#lw5-pp-dir, #lw5-pp-dither, #lw5-pp-powerRange, #lw5-pp-overscan').on('change', updateDoc);
    $('#lw5-pp-brightness, #lw5-pp-contrast, #lw5-pp-gamma').on('input', updateDoc);
    $('#lw5-pp-toolDia, #lw5-pp-stepOver, #lw5-pp-plungeRate, #lw5-pp-passDepth').on('change', updateDoc);
    $('#lw5-pp-lineDist, #lw5-pp-lineAngle, #lw5-pp-crossAngle').on('change', updateDoc);
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

    // Apply button: save settings, compute toolpath via worker, store result, close
    $('#lw5-pp-apply').on('click', function () {
      updateDoc();
      var tpType = $('#lw5-pp-type').val();

      if (toolpathObj) {
        // === Toolpath mode: dispatch worker, store computed cam paths ===
        var docs = LW.getDocuments();
        var entityIds = toolpathObj.entityIds || [];
        var geometries = [];
        for (var ei = 0; ei < entityIds.length; ei++) {
          var d = docs.filter(function (x) { return x.id === entityIds[ei]; })[0];
          if (d && d.rawPaths && d.rawPaths.length && d.type !== 'image') {
            var g = LW.mesh.rawPathsToClipperPaths(d.rawPaths, d.transform2d);
            if (g && g.length) geometries.push(g);
          }
        }
        if (geometries.length) {
          var doCombine = $('#lw5-pp-combine').length === 0 || $('#lw5-pp-combine').is(':checked');
          var combinedGeometry;
          if (doCombine && geometries.length > 1) {
            combinedGeometry = LW.mesh.xor(geometries[0], geometries[1]);
            for (var gi = 2; gi < geometries.length; gi++) {
              combinedGeometry = LW.mesh.xor(combinedGeometry, geometries[gi]);
            }
          } else {
            combinedGeometry = geometries[0] || [];
            for (var gi = 1; gi < geometries.length; gi++) {
              combinedGeometry = combinedGeometry.concat(geometries[gi]);
            }
          }
          var mmToClipperScale = LW.mesh.mmToClipperScale || 50000000;
          var tpForWorker = {
            type: tpType,
            margin: parseFloat($('#lw5-pp-margin').val()) || 0,
            lineDistance: parseFloat($('#lw5-pp-lineDist').val()) || 0.1,
            lineAngle: parseFloat($('#lw5-pp-lineAngle').val()) || 0,
            crossAngle: parseFloat($('#lw5-pp-crossAngle').val()) || 90,
            stepOver: parseFloat($('#lw5-pp-stepOver').val()) || 10,
            cutWidth: parseFloat($('#lw5-pp-cutWidth').val()) || 0,
            toolDiameter: parseFloat($('#lw5-pp-toolDia').val()) || 3,
            direction: ($('#lw5-pp-millDir').length ? $('#lw5-pp-millDir').val() : 'Conventional'),
            toolAngle: parseFloat($('#lw5-pp-toolAngle').val()) || 90,
            passDepth: parseFloat($('#lw5-pp-passDepth').val()) || 1
          };
          // Set computing flag
          LW.dispatch({ type: 'TOOLPATH_UPDATE', payload: { id: toolpathObj.id, changes: { computed: { busy: true } } } });
          renderToolpathPanel();
          runToolpathWorker(combinedGeometry, tpForWorker, mmToClipperScale, function (camPaths) {
            LW.dispatch({ type: 'TOOLPATH_UPDATE', payload: { id: toolpathObj.id, changes: { computed: { camPaths: camPaths, type: tpType, time: Date.now() } } } });
            renderToolpathPanel();
            // Generate preview gcode from computed cam paths for overlay
            if (camPaths && camPaths.length) {
              var scale = 1 / mmToClipperScale;
              var lines = [];
              for (var pi = 0; pi < camPaths.length; pi++) {
                var pp = camPaths[pi].path;
                if (!pp || !pp.length) continue;
                lines.push('G0 X' + (pp[0].X * scale).toFixed(3) + ' Y' + (pp[0].Y * scale).toFixed(3));
                for (var pj = 1; pj < pp.length; pj++) {
                  lines.push('G1 X' + (pp[pj].X * scale).toFixed(3) + ' Y' + (pp[pj].Y * scale).toFixed(3));
                }
              }
              LW.dispatch({ type: 'GCODE_UPDATE', payload: { content: lines.join('\n'), dirty: true, gcoding: { enable: false, percent: 100 } } });
            }
          });
        }
      } else if (actualDoc) {
        // === Document mode: existing behavior ===
        var typeColors = {
          none: '#999999',
          cut_on_line: '#e81123', cut_outside: '#0078d4', cut_inside: '#ffb900',
          laser_fill: '#107c10', laser_cut_inside: '#ffb900', laser_cut_outside: '#0078d4',
          laser_hatch: '#2e8b57', laser_crosshatch: '#3cb371', laser_spiral: '#20b2aa', laser_concentric: '#48d1cc', laser_stipple: '#66cdaa',
          pocket: '#107c10', raster: '#881798', raster_merge: '#cc33cc',
          engrave: '#666666',
          mill_pocket: '#8b4513', mill_cut: '#d2691e', mill_cut_inside: '#d2691e', mill_cut_outside: '#d2691e',
          mill_vcarve: '#a0522d', mill_hatch: '#cd853f', mill_crosshatch: '#daa520', mill_spiral: '#b8860b', mill_concentric: '#bc8f8f', mill_stipple: '#deb887',
          mill_halftone: '#9932cc', mill_wavy_raster: '#8b008b', mill_heightmap: '#9400d3'
        };
        var color = typeColors[tpType] || '#666666';
        LW.dispatch({ type: 'DOCUMENT_UPDATE', payload: { id: actualDoc.id, changes: { strokeColor: color } } });
        previewAllToolpaths();
      }
      $popup.remove();
    });

    $(document).on('keydown.lw5pp', function (e) {
      if (e.key === 'Escape') { $popup.remove(); $(document).off('keydown.lw5pp'); }
    });
  }

  // Expose these globally
  window.showFileList = showFileList;
  window.previewAllToolpaths = previewAllToolpaths;
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
    // DXF uses Y-up, canvas uses Y-down — negate Y to match canvas
    function negateY(arr) {
      for (var i = 1; i < arr.length; i += 2) arr[i] = -arr[i];
      return arr;
    }
    switch (entity.type) {
      case 'LINE':
        if (entity.vertices && entity.vertices.length >= 2) {
          paths.push(negateY([entity.vertices[0].x, entity.vertices[0].y, entity.vertices[1].x, entity.vertices[1].y]));
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
          paths.push(negateY(pts));
        }
        break;
      case 'CIRCLE':
        if (entity.center && entity.radius) {
          paths.push(negateY(approxCircle(entity.center.x, entity.center.y, entity.radius)));
        }
        break;
      case 'ARC':
        if (entity.center && entity.radius) {
          var sa = (entity.startAngle || 0) * Math.PI / 180;
          var ea = (entity.endAngle || 360) * Math.PI / 180;
          paths.push(negateY(approxArc(entity.center.x, entity.center.y, entity.radius, sa, ea)));
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
          paths.push(negateY(pts));
        }
        break;
      case 'POINT':
        if (entity.position) {
          paths.push(negateY([entity.position.x, entity.position.y]));
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
    var $bar = $('#lw5-transform-bar');
    if (!selectedIds || selectedIds.length === 0) {
      $bar.css('opacity', 0.35);
      $('#tf-x, #tf-y, #tf-w, #tf-h, #tf-rot').val('').prop('disabled', true);
      $('#tf-lock').removeClass('active');
      return;
    }
    var docs = LW.getState().documents;
    $bar.css('opacity', 1);
    if (selectedIds.length === 1) {
      var doc = docs.filter(function (d) { return d.id === selectedIds[0]; })[0];
      if (!doc) { $bar.css('opacity', 0.35); $('#tf-x, #tf-y, #tf-w, #tf-h, #tf-rot').val('').prop('disabled', true); return; }
      var tf = doc.transform2d || [1, 0, 0, 1, 0, 0];
      var ext = extractTransform(tf);
      var b = getDocLocalBounds(doc);
      if (!b) { $bar.css('opacity', 0.35); $('#tf-x, #tf-y, #tf-w, #tf-h, #tf-rot').val('').prop('disabled', true); return; }
      var bw = b.x2 - b.x1, bh = b.y2 - b.y1;
      var w = bw * ext.sx, h = bh * ext.sy;
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
      if (!ok) { $('#lw5-transform-bar').css('opacity', 0.35); $('#tf-x, #tf-y, #tf-w, #tf-h, #tf-rot').val('').prop('disabled', true); return; }
      $('#lw5-transform-bar').css('opacity', 1);
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
