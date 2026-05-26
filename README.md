# Lw5

## Operation Types Reference

Lw5 supports **25 operation types** across four categories: Laser, Mill, Bitmap/Raster, and Lathe. Operations are assigned per-document and dispatched to the appropriate gcode generator at print time. Vector-only and bitmap-only types are filtered in the toolpath dropdown based on document type.

### Legend

| Column | Meaning |
|--------|---------|
| Type | Operation name as shown in UI |
| Internal ID | `toolpath.type` value stored on the document |
| Compatible | Document types this operation applies to |
| Generator | Backend that produces the gcode |

### Laser Operations

| Type | Internal ID | Compatible | Generator | Description |
|------|-------------|------------|-----------|-------------|
| Laser Cut | `cut_on_line` / `engrave` | vector | Worker (cam.cut) | Trace paths with configurable power/speed. Single-line follow. |
| Laser Cut Inside | `cut_inside` / `laser_cut_inside` | vector | Worker (cam.insideOutside) | Offset inward from path boundary. Uses laser diameter for kerf. |
| Laser Cut Outside | `cut_outside` / `laser_cut_outside` | vector | Worker (cam.insideOutside) | Offset outward from path boundary. |
| Laser Fill Path | `laser_fill` | vector | Worker (cam.fillPath) | Fill enclosed shapes with parallel hatch lines at configurable angle and spacing. |
| Laser Hatch Fill | `laser_hatch` | vector | Worker (cam.fillPath) | Same algorithm as Fill Path — parallel line fill. |
| Laser Cross Hatch | `laser_crosshatch` | vector | Worker (fillPath × 2) | Two layers of parallel lines: primary angle + cross angle (default 90° offset). |
| Laser Spiral Fill | `laser_spiral` | vector | Worker (cam.pocket) | Offset-contour fill from boundary inward (pocket-style). |
| Laser Concentric Fill | `laser_concentric` | vector | Worker (cam.insideOutside) | Concentric offset paths from boundary. Separate operation from Spiral. |
| Laser Stipple | `laser_stipple` | vector | Worker (cam.fillPath) | Dot-fill approximation via short hatch segments. |

### Mill Operations (2.5D / 3-axis)

| Type | Internal ID | Compatible | Generator | Description |
|------|-------------|------------|-----------|-------------|
| Mill Pocket | `mill_pocket` | vector | Worker (cam.pocket) | Clear enclosed area with step-over passes. Conventional or climb. |
| Mill Cut | `mill_cut` | vector | Worker (cam.cut) | Trace open/closed paths with Z-depth passes. Ramp plunge optional. |
| Mill Cut Inside | `mill_cut_inside` | vector | Worker (cam.insideOutside) | Offset inward, then cut with step-over. |
| Mill Cut Outside | `mill_cut_outside` | vector | Worker (cam.insideOutside) | Offset outward, then cut with step-over. |
| Mill V Carve | `mill_vcarve` | vector | C++ Wasm (vCarve) | V-bit engraving. Depth varies with path width based on tool angle. Uses Emscripten-compiled C++ module. |
| Mill Hatch Fill | `mill_hatch` | vector | Worker (cam.fillPath) | Parallel line hatching with Z depth, step-over per pass. |
| Mill Cross Hatch | `mill_crosshatch` | vector | Worker (fillPath × 2) | Two-angle hatching with Z depth. |
| Mill Spiral Fill | `mill_spiral` | vector | Worker (cam.pocket) | Offset-contour pocket with Z depth passes. |
| Mill Concentric Fill | `mill_concentric` | vector | Worker (cam.insideOutside) | Concentric offset paths with Z depth. |
| Mill Stipple | `mill_stipple` | vector | Worker (cam.fillPath) | Plunge-dot pattern fill with Z depth. |

### Bitmap / Raster Operations

| Type | Internal ID | Compatible | Generator | Description |
|------|-------------|------------|-----------|-------------|
| Laser Raster | `raster` | bitmap | Worker (RasterToGcode) | Laser engraving. Pixel brightness → laser power. Supports dithering, gamma, DPI. |
| Laser Raster Merge | `raster_merge` | bitmap | Main thread (WebGL composite) | Multi-document composite raster. Renders all vector docs to a single bitmap via WebGL, then rasters combined image. |
| Mill Halftone | `mill_halftone` | bitmap | Main thread (lw5-mill-halftone.js) | V-bit plunge halftone. Each pixel → G0 XY + G1 Z plunge. Brighter = shallower, darker = deeper. Tool angle determines mark width. |
| Mill Wavy Raster | `mill_wavy_raster` | bitmap | Main thread (lw5-mill-wavy.js) | V-bit wavy line raster. Continuous scan lines with Z varying by pixel brightness. Alternating direction per row. |
| Mill Heightmap | `mill_heightmap` | bitmap | Main thread (lw5-mill-heightmap.js) | Ball end mill heightmap. Raster scan with configurable step-over. Z varies continuously for 3D surface milling. |

### Lathe Operations

| Type | Internal ID | Compatible | Generator | Description |
|------|-------------|------------|-----------|-------------|
| Lathe Conv Face/Turn | — | vector | Main thread (latheConvFaceTurn) | Conventional face and turning operations. Roughing + finishing passes, multi-step turning diameters. |

### Field Reference

Common fields used across operation types:

| Field | Units | Applies To | Description |
|-------|-------|------------|-------------|
| laserPower | % | laser ops | Laser power (maps to S-value in gcode) |
| cutRate | mm/min or mm/s | all | Feed rate during cutting moves |
| passes | count | all | Number of depth passes |
| passDepth | mm | mill / laser cut | Depth removed per pass |
| margin | mm | fill / pocket | Offset from boundary before filling |
| segmentLength | mm | all | Max segment length for arc subdivision |
| lineDistance | mm | fill / hatch | Spacing between fill lines |
| lineAngle | deg | fill / hatch | Angle of fill hatch lines |
| crossAngle | deg | cross hatch | Secondary hatch angle (default: 90) |
| toolDiameter | mm | mill / laser cut | Tool or beam diameter |
| stepOver | % | mill pocket/cut | Step-over as percentage of tool diameter |
| millRapidZ | mm | mill | Safe Z height for rapids |
| millStartZ | mm | mill | Top surface Z (usually 0) |
| millEndZ | mm | mill | Final depth Z (negative) |
| toolAngle | deg | V-carve / halftone / wavy | V-bit included angle |
| plungeRate | mm/min or mm/s | mill | Feed rate during Z-axis plunges |
| ramp | boolean | mill cut | Enable helical ramp entry |
| toolSpeed | rpm | mill | Spindle speed |
| dpi | dpi | raster / bitmap mill | Pixels per inch for bitmap-to-gcode scale |
| brightness | -100–100 | raster / bitmap mill | Image brightness adjustment |
| contrast | -100–100 | raster / bitmap mill | Image contrast adjustment |
| gamma | 0.1–3.0 | raster / bitmap mill | Gamma correction |
| invertColor | boolean | raster / bitmap mill | Invert image |
| dithering | none/floyd/ordered | laser raster | Dithering algorithm |

### GCode Overlay Colors

When viewing generated gcode on the canvas, segments are color-coded:

| Color | Meaning |
|-------|---------|
| Gray dashed | Rapid moves (G0) |
| Blue → Red gradient | Laser cuts (S-value 0→1000+) |
| Red dashed | Plunge moves (Z-only G1 down) |
| Orange | 3D Z-moves (XY+Z simultaneous) |
