(function() {
  var orig = Module.onRuntimeInitialized;
  Module.onRuntimeInitialized = function() {
    if (orig) orig();
    Module.HEAPU32 = HEAPU32;
    Module.HEAP8 = HEAP8;
    Module.HEAP32 = HEAP32;
    Module.HEAPU8 = HEAPU8;
    Module.HEAPU16 = HEAPU16;
    Module.HEAPF32 = HEAPF32;
    Module.HEAPF64 = HEAPF64;
  };
})();
