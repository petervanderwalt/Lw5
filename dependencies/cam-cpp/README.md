# cam-cpp — C++ CAM module for LaserWeb5

Compiled to WebAssembly via Emscripten. Provides V-Carve and Separate-Tabs operations.

## Prerequisites

- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (`emsdk` installed and available)
- Boost 1.62.0 headers (automatic download via build script)

## Build

```
build.bat
```

Output: `../vendors/web-cam-cpp.js` + `../vendors/web-cam-cpp.wasm`

## Files

| Path | Description |
|------|-------------|
| `src/cam.cpp`, `cam.h` | Core types and C-path conversion |
| `src/vCarve.cpp` | V-Carve via Voronoi diagram |
| `src/separateTabs.cpp` | Tab-separation algorithm |
| `src/FlexScan.h` | Scanline edge intersection |
| `src/offset.h` | Polygon offset |
| `build.bat` | Emscripten build command |
| `post.js` | Heap view exports (appended to module) |
