(function () {
  'use strict';

  var LW = window.LW = window.LW || {};
  LW.RasterToGcode = LW.RasterToGcode || (window.RasterToGcode && window.RasterToGcode.RasterToGcode);
  var LS_KEY = 'LaserWeb5';
  var MAX_UNDO = 50;

  // IndexedDB helper for storing large image dataURLs (beyond localStorage's ~5MB limit)
  var IDB = (function () {
    var db = null;
    var queue = [];
    function ensure(cb) {
      if (db) { cb(db); return; }
      queue.push(cb);
      if (queue.length > 1) return;
      var req = indexedDB.open('LaserWeb5_Images', 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore('images', { keyPath: 'id' });
      };
      req.onsuccess = function () {
        db = req.result;
        queue.forEach(function (fn) { fn(db); });
        queue = [];
      };
      req.onerror = function () { console.warn('IDB open failed'); };
    }
    return {
      put: function (id, dataURL) {
        ensure(function (db) {
          var tx = db.transaction('images', 'readwrite');
          tx.objectStore('images').put({ id: id, dataURL: dataURL });
        });
      },
      get: function (id, cb) {
        ensure(function (db) {
          var tx = db.transaction('images');
          var req = tx.objectStore('images').get(id);
          req.onsuccess = function () { cb(req.result ? req.result.dataURL : null); };
          req.onerror = function () { cb(null); };
        });
      },
      remove: function (id) {
        ensure(function (db) {
          var tx = db.transaction('images', 'readwrite');
          tx.objectStore('images').delete(id);
        });
      }
    };
  })();

  var defaultSettings = {
    machineWidth: 400,
    machineHeight: 400,
    machineBottomLeftX: 0,
    machineBottomLeftY: 0,
    showMachine: true,
    machineBeamDiameter: 0.15,
    dpiBitmap: 300,
    toolFeedUnits: 'mm/min',
    gcodeSMaxValue: 1000,
    gcodeSMinValue: 0,
    gcodeLaserIntensity: '',
    gcodeLaserIntensitySeparateLine: false,
    gcodeStart: '',
    gcodeEnd: '',
    gcodeConcurrency: 1,
    toolGridWidth: 500,
    toolGridHeight: 500,
    toolGridMinorSpacing: 10,
    toolGridMajorSpacing: 50,
    macros: {},
    gcodeHoming: '$H\nG92 X0 Y0 Z0',
    gcodeToolOn: 'M3',
    gcodeToolOff: 'M5',
    gcodeCheckSizePower: 10,
    jogStepsize: 10,
    jogFeedXY: 3000,
    jogFeedZ: 500,
    connectVia: 'USB',
    connectPort: '',
    connectBaud: '115200',
    connectIP: '',
    comServerIP: 'localhost:8000',
    comServerSecure: false,
    machineZEnabled: false,
    machineAEnabled: false,
    machineZProbeOffset: 0,
    machineXYProbeOffset: 0,
    toolDisplayCache: false,
    toolCreateEmptyOps: false,
    toolImagePosition: 'C',
    toolVideoDevice: null,
    toolVideoResolution: null,
    toolUseNumpad: false,
    toolUseGamepad: false,
    uiFcDrag: null,
    gcodeToolTestPower: 10,
    gcodeToolTestDuration: 100,
    comAccumulatedJobTime: 0,
    comInterfaces: [],
    comPorts: [],
    comServerVersion: 'not connected',
    __latestRelease: null,
    showGcode: true,
    showLaser: false,
    showDocuments: true,
    showCursor: false,
    showRotary: false,
    rotaryDiameter: 50,
    g0Rate: 1000,
    simTime: 0,
    workOffsetX: 0,
    workOffsetY: 0
  };

  var defaultCamera = {
    eye: [0, 0, 500],
    center: [0, 0, 0],
    up: [0, 1, 0],
    fovy: 0.7,
    showPerspective: false
  };

  var defaultWorkspace = {
    width: 400,
    height: 400,
    showDocuments: true,
    showGcode: true,
    showLaser: false,
    showCursor: false,
    showRotary: false,
    initialZoom: false,
    cursorPos: [0, 0, 0],
    g0Rate: 1000,
    simTime: 0,
    rotaryDiameter: 50,
    workOffsetX: 0,
    workOffsetY: 0
  };

  // --- Event system ---
  var _events = {};

  LW.on = function (event, callback) {
    if (!_events[event]) _events[event] = [];
    _events[event].push(callback);
    return function () { LW.off(event, callback); };
  };

  LW.off = function (event, callback) {
    if (!_events[event]) return;
    _events[event] = _events[event].filter(function (cb) { return cb !== callback; });
  };

  LW.emit = function (event, data) {
    if (!_events[event]) return;
    _events[event].forEach(function (cb) {
      try { cb(data); } catch (e) { console.error(e); }
    });
  };

  // --- Undo ---
  var _undoStack = [];
  var _redoStack = [];

  function pushUndo() {
    _redoStack = [];
    _undoStack.push(JSON.stringify(LW.State));
    if (_undoStack.length > MAX_UNDO) _undoStack.shift();
  }

  // --- Persistence ---
  function loadPersisted() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }

  function savePersisted() {
    try {
      var docs = LW.State.documents.map(function (d) {
        if (d.type === 'image' && d.dataURL) {
          IDB.put(d.id, d.dataURL);
          var clone = Object.assign({}, d);
          delete clone.dataURL;
          return clone;
        }
        return d;
      });
      localStorage.setItem(LS_KEY, JSON.stringify({
        settings: LW.State.settings,
        documents: docs,
        machineProfiles: LW.State.machineProfiles,
        materialDatabase: LW.State.materialDatabase,
        profiles: LW.State.profiles
      }));
    } catch (e) { console.warn('Failed to persist state', e); }
  }

  // --- State initialization ---
  var persisted = loadPersisted();
  var pSettings = persisted.settings || {};
  var pDocuments = persisted.documents || [];

  LW.State = {
    documents: pDocuments,
    toolpaths: [],
    operations: [],
    currentOperation: null,
    settings: Object.assign({}, defaultSettings, pSettings),
    workspace: Object.assign({}, defaultWorkspace),
    camera: Object.assign({}, defaultCamera),
    gcode: { content: '', dirty: false, gcoding: { enable: false, percent: 0 } },
    machineProfiles: Array.isArray(persisted.machineProfiles) ? persisted.machineProfiles.slice() : [],
    materialDatabase: Array.isArray(persisted.materialDatabase) ? persisted.materialDatabase.slice() : [],
    profiles: persisted.profiles || { machines: null, currentMachineId: null },
    splitters: {}
  };

  // Async load image dataURLs from IndexedDB after state init
  (function () {
    var pending = pDocuments.filter(function (d) { return d.type === 'image'; });
    if (!pending.length) return;
    var loaded = 0;
    pending.forEach(function (d) {
      IDB.get(d.id, function (dataURL) {
        if (dataURL) {
          d.dataURL = dataURL;
        }
        loaded++;
        if (loaded === pending.length) {
          if (typeof LW.emit === 'function') LW.emit('stateChanged', { state: LW.State });
        }
      });
    });
  })();

  // Helper to apply attrs pattern (for SETTINGS_SET_ATTRS, CAMERA_SET_ATTRS etc.)
  function applyAttrs(obj, attrs) {
    if (attrs && typeof attrs === 'object') {
      Object.keys(attrs).forEach(function (k) {
        obj[k] = attrs[k];
      });
    }
  }

  // --- Dispatch ---
  LW.dispatch = function (action) {
    if (!action || !action.type) {
      console.warn('Invalid action', action);
      return;
    }

    var type = action.type;
    var payload = action.payload;
    var prev = LW.getState();

    if (type !== 'UNDO' && type !== 'REDO' && type !== 'RESET_STATE') {
      pushUndo();
    }

    switch (type) {
      // --- Settings ---
      case 'SETTINGS_UPDATE':
      case 'SETTINGS_SET':
        Object.assign(LW.State.settings, payload);
        savePersisted();
        break;

      case 'SETTINGS_SET_ATTRS':
        if (payload && payload.attrs) {
          applyAttrs(LW.State.settings, payload.attrs);
          savePersisted();
        }
        break;

      case 'SETTINGS_REPLACE':
        LW.State.settings = Object.assign({}, defaultSettings, payload);
        savePersisted();
        break;

      // --- Documents ---
      case 'DOCUMENT_ADD':
        LW.State.documents.push(payload);
        savePersisted();
        break;

      case 'DOCUMENT_ADD_MULTIPLE':
        if (Array.isArray(payload)) {
          payload.forEach(function (d) { LW.State.documents.push(d); });
        }
        savePersisted();
        break;

      case 'DOCUMENT_REMOVE':
        IDB.remove(payload);
        LW.State.documents = LW.State.documents.filter(function (d) { return d.id !== payload; });
        savePersisted();
        break;

      case 'DOCUMENT_SELECT':
        LW.State.documents.forEach(function (d) { d.selected = (d.id === payload); });
        break;

      case 'DOCUMENT_UPDATE':
        {
          var dIdx = LW.State.documents.findIndex(function (d) { return d.id === payload.id; });
          if (dIdx !== -1) Object.assign(LW.State.documents[dIdx], payload.changes);
          savePersisted();
        }
        break;

      case 'DOCUMENT_REMOVE_SELECTED':
        LW.State.documents.forEach(function (d) { if (d.selected) IDB.remove(d.id); });
        LW.State.documents = LW.State.documents.filter(function (d) { return !d.selected; });
        savePersisted();
        break;

      // --- Toolpaths ---
      case 'TOOLPATH_ADD':
        if (payload) { payload.order = LW.State.toolpaths.length; LW.State.toolpaths.push(payload); }
        break;

      case 'TOOLPATH_REMOVE':
        LW.State.toolpaths = LW.State.toolpaths.filter(function (t) { return t.id !== payload; });
        break;

      case 'TOOLPATH_UPDATE':
        {
          var tIdx = LW.State.toolpaths.findIndex(function (t) { return t.id === payload.id; });
          if (tIdx !== -1) Object.assign(LW.State.toolpaths[tIdx], payload.changes);
        }
        break;

      case 'TOOLPATH_REORDER':
        if (Array.isArray(payload)) {
          payload.forEach(function (id, i) {
            var t = LW.State.toolpaths.find(function (tp) { return tp.id === id; });
            if (t) t.order = i;
          });
          LW.State.toolpaths.sort(function (a, b) { return a.order - b.order; });
        }
        break;

      // --- Operations ---
      case 'OPERATION_ADD':
        LW.State.operations.push(payload);
        break;

      case 'OPERATION_REMOVE':
        LW.State.operations = LW.State.operations.filter(function (o) { return o.id !== payload; });
        break;

      case 'OPERATION_UPDATE':
        {
          var oIdx = LW.State.operations.findIndex(function (o) { return o.id === payload.id; });
          if (oIdx !== -1) Object.assign(LW.State.operations[oIdx], payload.changes);
          // When type changes to mill/lathe, populate missing fields with defaults
          if (payload.changes && payload.changes.type) {
            var op_ = oIdx !== -1 && LW.State.operations[oIdx];
            if (op_) {
              var t = op_.type;
              if (t && t.indexOf('Mill ') === 0) {
                if (op_.millRapidZ === undefined) op_.millRapidZ = 10;
                if (op_.millStartZ === undefined) op_.millStartZ = 0;
                if (op_.millEndZ === undefined) op_.millEndZ = -1;
                if (op_.passDepth === undefined) op_.passDepth = 1;
                if (op_.plungeRate === undefined) op_.plungeRate = 300;
                if (op_.cutRate === undefined) op_.cutRate = 500;
                if (op_.toolDiameter === undefined) op_.toolDiameter = 3;
                if (op_.stepOver === undefined) op_.stepOver = 10;
                if (op_.segmentLength === undefined) op_.segmentLength = 0.1;
                if (op_.direction === undefined) op_.direction = 'Conventional';
                if (op_.ramp === undefined) op_.ramp = false;
                if (op_.toolSpeed === undefined) op_.toolSpeed = 0;
                if (op_.cutWidth === undefined) op_.cutWidth = 0;
                if (op_.margin === undefined) op_.margin = 0;
              }
              if (t && t.indexOf('Lathe ') === 0) {
                if (op_.latheRapidToDiameter === undefined) op_.latheRapidToDiameter = 50;
                if (op_.latheRapidToZ === undefined) op_.latheRapidToZ = 10;
                if (op_.latheStartZ === undefined) op_.latheStartZ = 0;
                if (op_.latheRoughingFeed === undefined) op_.latheRoughingFeed = 500;
                if (op_.latheRoughingDepth === undefined) op_.latheRoughingDepth = 0.5;
                if (op_.latheFinishFeed === undefined) op_.latheFinishFeed = 300;
                if (op_.latheFinishDepth === undefined) op_.latheFinishDepth = 0.1;
                if (op_.latheFinishExtraPasses === undefined) op_.latheFinishExtraPasses = 0;
                if (op_.latheFace === undefined) op_.latheFace = false;
                if (op_.latheFaceEndDiameter === undefined) op_.latheFaceEndDiameter = 0;
                if (op_.cutRate === undefined) op_.cutRate = 500;
              }
              // Laser defaults if switching to laser type
              if (t && t.indexOf('Laser ') === 0) {
                if (op_.laserPower === undefined) op_.laserPower = 100;
                if (op_.passes === undefined) op_.passes = 1;
                if (op_.passDepth === undefined) op_.passDepth = 1;
                if (op_.cutRate === undefined) op_.cutRate = 500;
                if (op_.laserDiameter === undefined) op_.laserDiameter = 0.15;
                if (op_.segmentLength === undefined) op_.segmentLength = 0.01;
                if (op_.lineDistance === undefined) op_.lineDistance = 0.1;
                if (op_.lineAngle === undefined) op_.lineAngle = 0;
                if (op_.grayscale === undefined) op_.grayscale = 'none';
                if (op_.smoothing === undefined) op_.smoothing = 2;
                if (op_.brightness === undefined) op_.brightness = 0;
                if (op_.contrast === undefined) op_.contrast = 0;
                if (op_.gamma === undefined) op_.gamma = 1;
                if (op_.shadesOfGray === undefined) op_.shadesOfGray = 256;
                if (op_.invertColor === undefined) op_.invertColor = false;
                if (op_.dithering === undefined) op_.dithering = 'none';
                if (op_.laserPowerRange === undefined) op_.laserPowerRange = 100;
                else if (typeof op_.laserPowerRange === 'object') op_.laserPowerRange = op_.laserPowerRange.max || 100;
                if (op_.trimLine === undefined) op_.trimLine = 1;
                if (op_.joinPixel === undefined) op_.joinPixel = 1;
                if (op_.burnWhite === undefined) op_.burnWhite = true;
                if (op_.verboseGcode === undefined) op_.verboseGcode = false;
                if (op_.diagonal === undefined) op_.diagonal = false;
                if (op_.overScan === undefined) op_.overScan = 0;
              }
            }
          }
        }
        break;

      case 'SET_CURRENT_OPERATION':
        LW.State.currentOperation = payload;
        break;

      // --- Workspace ---
      case 'WORKSPACE_UPDATE':
      case 'WORKSPACE_SET_ATTRS':
        if (payload && payload.attrs) {
          applyAttrs(LW.State.workspace, payload.attrs);
        } else if (payload) {
          Object.assign(LW.State.workspace, payload);
        }
        break;

      case 'WORKSPACE_RESET':
        LW.State.workspace = Object.assign({}, defaultWorkspace, { width: LW.State.workspace.width, height: LW.State.workspace.height });
        break;

      // --- Camera ---
      case 'CAMERA_UPDATE':
        Object.assign(LW.State.camera, payload);
        break;

      case 'CAMERA_SET_ATTRS':
        if (payload && payload.attrs) {
          applyAttrs(LW.State.camera, payload.attrs);
        }
        break;

      case 'CAMERA_ZOOM_AREA':
        // Placeholder - zoom to area
        break;

      // --- GCode ---
      case 'GCODE_UPDATE':
      case 'SET_GCODE':
        if (typeof payload === 'string') {
          LW.State.gcode.content = payload;
          LW.State.gcode.dirty = true;
        } else if (payload && typeof payload === 'object') {
          if (payload.content !== undefined) {
            LW.State.gcode.content = payload.content;
            LW.State.gcode.dirty = true;
          }
          if (payload.gcoding !== undefined) {
            LW.State.gcode.gcoding = payload.gcoding;
          }
        }
        break;

      case 'GCODE_CLEAR':
        LW.State.gcode = { content: '', dirty: false, gcoding: { enable: false, percent: 0 } };
        break;

      case 'GENERATING_GCODE':
        if (payload && payload.enable !== undefined) {
          LW.State.gcode.gcoding.enable = payload.enable;
          if (payload.percent !== undefined) {
            LW.State.gcode.gcoding.percent = payload.percent;
          }
        }
        break;

      // --- Machine Profiles ---
      case 'MACHINE_PROFILE_ADD':
        LW.State.machineProfiles.push(payload);
        savePersisted();
        break;

      case 'MACHINE_PROFILE_REMOVE':
        LW.State.machineProfiles = LW.State.machineProfiles.filter(function (p) { return p.id !== payload; });
        savePersisted();
        break;

      case 'MACHINE_PROFILE_UPDATE':
        {
          var mpIdx = LW.State.machineProfiles.findIndex(function (p) { return p.id === payload.id; });
          if (mpIdx !== -1) Object.assign(LW.State.machineProfiles[mpIdx], payload.changes);
          savePersisted();
        }
        break;

      // --- Material Database ---
      case 'MATERIAL_ADD':
        LW.State.materialDatabase.push(payload);
        savePersisted();
        break;

      case 'MATERIAL_REMOVE':
        LW.State.materialDatabase = LW.State.materialDatabase.filter(function (m) { return m.id !== payload; });
        savePersisted();
        break;

      case 'MATERIAL_UPDATE':
        {
          var mIdx = LW.State.materialDatabase.findIndex(function (m) { return m.id === payload.id; });
          if (mIdx !== -1) Object.assign(LW.State.materialDatabase[mIdx], payload.changes);
          savePersisted();
        }
        break;

      // --- Splitters ---
      case 'SPLITTER_SET':
        LW.State.splitters[payload.key] = payload.value;
        break;

      case 'SPLITTER_REMOVE':
        delete LW.State.splitters[payload];
        break;

      case 'PROFILES_UPDATE':
        if (payload.machines) LW.State.profiles.machines = payload.machines;
        if (payload.currentMachineId) LW.State.profiles.currentMachineId = payload.currentMachineId;
        savePersisted();
        break;

      // --- General ---
      case 'LOAD_STATE':
        Object.assign(LW.State, payload);
        savePersisted();
        break;

      case 'RESET_STATE':
        LW.State.settings = Object.assign({}, defaultSettings);
        LW.State.machineProfiles = [];
        LW.State.materialDatabase = [];
        _undoStack = [];
        savePersisted();
        break;

      case 'UNDO':
        if (_undoStack.length > 0) {
          _redoStack.push(JSON.stringify(LW.State));
          LW.State = JSON.parse(_undoStack.pop());
          savePersisted();
        }
        break;

      case 'REDO':
        if (_redoStack.length > 0) {
          _undoStack.push(JSON.stringify(LW.State));
          LW.State = JSON.parse(_redoStack.pop());
          savePersisted();
        }
        break;

      case 'CLEAR_DESIGN':
        LW.State.documents = [];
        savePersisted();
        break;

      case 'LOADED':
        // After loading persisted state
        break;

      default:
        _undoStack.pop();
        console.warn('Unknown action type:', type);
        return;
    }

    LW.emit(type, payload);
    LW.emit('stateChanged', { type: type, state: LW.getState(), prev: prev });
  };

  LW.getState = function () { return LW.State; };
  LW.getSettings = function () { return LW.State.settings; };
  LW.getDocuments = function () { return LW.State.documents; };
  LW.getOperations = function () { return LW.State.operations; };
  LW.getToolpaths = function () { return LW.State.toolpaths; };

  LW.createToolpath = function (entityIds) {
    var tp = LW.defaultToolpath('none');
    return {
      id: 'tp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: 'Toolpath ' + (LW.State.toolpaths.length + 1),
      entityIds: entityIds || [],
      visible: true,
      enabled: true,
      order: LW.State.toolpaths.length,
      toolpath: tp,
      computed: null
    };
  };

  // ---- Color Detection for Toolpath Types ----------------------------------

  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return null;
    var c = hex.replace('#', '');
    if (c.length < 6) return null;
    return {
      r: parseInt(c.substr(0, 2), 16),
      g: parseInt(c.substr(2, 2), 16),
      b: parseInt(c.substr(4, 2), 16)
    };
  }

  LW.detectToolpathType = function (strokeColor) {
    var c = hexToRgb(strokeColor);
    if (!c) return 'engrave';
    var r = c.r, g = c.g, b = c.b;
    if (r > 100 && r > g * 1.3 && r > b * 1.3) return 'cut_on_line';
    if (g > 100 && g > r * 1.3 && g > b * 1.3) return 'pocket';
    if (b > 100 && b > r * 1.3 && b > g * 1.3) return 'cut_outside';
    if (r > 100 && g > 100 && b < 100 && Math.abs(r - g) < 80) return 'cut_inside';
    return 'none';
  };

  LW.defaultToolpath = function (type) {
    var last = loadLastToolpath();
    var base = {
      enabled: type !== 'none',
      type: type || 'none',
      power: last.power !== undefined ? last.power : 80,
      speed: last.speed !== undefined ? last.speed : 300,
      passes: last.passes !== undefined ? last.passes : 1,
      margin: last.margin !== undefined ? last.margin : 0,
      segmentLength: last.segmentLength !== undefined ? last.segmentLength : 0.5,
      trimLine: last.trimLine !== undefined ? last.trimLine : 1,
      joinPixel: 1,
      burnWhite: true,
      dpi: last.dpi !== undefined ? last.dpi : 250,
      direction: last.direction !== undefined ? last.direction : 'horizontal',
      brightness: 0,
      contrast: 0,
      gamma: 1,
      grayscale: 'none',
      shadesOfGray: 64,
      invertColor: false,
      dithering: false,
      diagonal: false,
      overScan: last.overScan !== undefined ? last.overScan : 0,
      // Tool diameter — used as beam spot (laser) or cutter diameter (mill)
      toolDiameter: last.toolDiameter !== undefined ? last.toolDiameter : 0.5,
      stepOver: last.stepOver !== undefined ? last.stepOver : 10,
      plungeRate: last.plungeRate !== undefined ? last.plungeRate : 300,
      ramp: false,
      toolSpeed: last.toolSpeed !== undefined ? last.toolSpeed : 0,
      cutWidth: 0,
      millRapidZ: 10,
      millStartZ: 0,
      millEndZ: -1,
      toolAngle: 90,
      passDepth: last.passDepth !== undefined ? last.passDepth : 1
    };
    if (type === 'cut_on_line' || type === 'cut_outside' || type === 'cut_inside' ||
        type === 'laser_cut_inside' || type === 'laser_cut_outside') {
      base.power = 95;
      base.speed = 200;
      base.passes = 1;
    } else if (type === 'pocket' || type === 'laser_fill') {
      base.power = 80;
      base.speed = 300;
      base.passes = 1;
      base.margin = 0.5;
    } else if (type.indexOf('mill_') === 0) {
      base.power = 0;
      base.speed = 300;
      base.passes = 1;
      base.toolDiameter = 6.35;
    } else if (type === 'raster_merge' || type === 'raster') {
      base.passes = 1;
    }
    return base;
  };

  // Persist last-used toolpath values so they survive page reloads
  var LAST_TP_KEY = 'LaserWeb5_lastToolpath';
  function loadLastToolpath() {
    try {
      var raw = localStorage.getItem(LAST_TP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  LW.saveLastToolpath = function (tp) {
    try {
      localStorage.setItem(LAST_TP_KEY, JSON.stringify(tp));
    } catch (e) { /* ignore */ }
  };

  // Compatibility: GlobalStore for old code
  LW.GlobalStore = function () { return { getState: LW.getState }; };

})();
