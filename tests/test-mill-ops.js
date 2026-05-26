// Node.js test harness for mill bitmap gcode generation
// Simulates browser environment and runs lw5-mill-*.js functions

var vm = require('vm');
var fs = require('fs');
var path = require('path');

function loadBrowserScript(filePath, sandbox) {
    var code = fs.readFileSync(filePath, 'utf8');
    vm.runInNewContext(code, sandbox, { filename: filePath });
}

// Create a sandbox with fake window/LW objects
var sandbox = {
    window: {},
    self: {},
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    console: console,
    Uint8ClampedArray: Uint8ClampedArray
};
sandbox.window.LW = sandbox.window.LW || {};
sandbox.self.LW = sandbox.self.LW || {};

// Load the mill gcode modules
loadBrowserScript(path.join(__dirname, '..', 'js', 'lw5-mill-halftone.js'), sandbox);
loadBrowserScript(path.join(__dirname, '..', 'js', 'lw5-mill-wavy.js'), sandbox);
loadBrowserScript(path.join(__dirname, '..', 'js', 'lw5-mill-heightmap.js'), sandbox);

var LW = sandbox.window.LW;

// Simulate a simple grayscale gradient image 4x4 pixels
function createTestImageData(w, h) {
    var data = new Uint8ClampedArray(w * h * 4);
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var idx = (y * w + x) * 4;
            var val = Math.round((x / Math.max(w-1,1)) * 255); // horizontal gradient
            data[idx] = val;
            data[idx + 1] = val;
            data[idx + 2] = val;
            data[idx + 3] = 255;
        }
    }
    return { width: w, height: h, data: data };
}

// Test each function
console.log('=== Mill Halftone ===');
var hfGcode = LW.millHalftone(createTestImageData(4, 4), {
    cellSize: 1,
    safeZ: 5,
    startZ: 0,
    maxDepth: -2,
    plungeFeed: 200,
    decimal: 2,
    offsetX: 0,
    offsetY: 0,
    direction: 'top_to_bottom',
    invert: false
});
console.log(hfGcode);
console.log('Lines:', hfGcode.split('\n').length);

console.log('\n=== Mill Wavy Raster ===');
var wvGcode = LW.millWavy(createTestImageData(4, 4), {
    cellSize: 1,
    safeZ: 5,
    startZ: 0,
    maxDepth: -2,
    plungeFeed: 200,
    cutFeed: 400,
    decimal: 2,
    offsetX: 0,
    offsetY: 0,
    direction: 'top_to_bottom',
    invert: false
});
console.log(wvGcode);
console.log('Lines:', wvGcode.split('\n').length);

console.log('\n=== Mill Heightmap ===');
var hmGcode = LW.millHeightmap(createTestImageData(4, 4), {
    cellSize: 1,
    safeZ: 5,
    startZ: 0,
    maxDepth: -3,
    plungeFeed: 200,
    cutFeed: 400,
    decimal: 2,
    offsetX: 10,
    offsetY: 20,
    stepOverPx: 1,
    direction: 'top_to_bottom',
    invert: false
});
console.log(hmGcode);
console.log('Lines:', hmGcode.split('\n').length);

// Verify gcode
function verifyGcode(label, gcode) {
    var lines = gcode.split('\n').filter(function(l) { return l.trim() && !l.trim().startsWith(';'); });
    var hasG0 = lines.some(function(l) { return /^G0\s/.test(l.trim()); });
    var hasG1 = lines.some(function(l) { return /^G1\s/.test(l.trim()); });
    var hasZ = lines.some(function(l) { return /\bZ[\d\.\-]+/.test(l); });
    var hasXY = lines.some(function(l) { return /\bX[\d\.\-]+/.test(l) && /\bY[\d\.\-]+/.test(l); });
    console.log('\nVerification:', label);
    console.log('  Has G0 moves:', hasG0);
    console.log('  Has G1 moves:', hasG1);
    console.log('  Has Z coords:', hasZ);
    console.log('  Has XY coords:', hasXY);
    console.log('  Total lines:', lines.length, '(non-comment)');
    return hasG0 && hasG1 && hasZ && hasXY && lines.length > 0;
}

var pass = true;
pass = verifyGcode('Mill Halftone', hfGcode) && pass;
pass = verifyGcode('Mill Wavy', wvGcode) && pass;
pass = verifyGcode('Mill Heightmap', hmGcode) && pass;

console.log('\n' + (pass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'));
process.exit(pass ? 0 : 1);
