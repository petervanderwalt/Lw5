## Summary to Continue Work

- Apply in toolpath popup now triggers immediate gcode preview on canvas
- Bitmap mill ops run in web worker (pixel extraction stays main thread for DOM)
- popup reorganized: Power & Speed, Tool (Tool Dia, Segment Len), Fill Pattern (Line Spacing, Fill Angle, Cross Hatch), Depth & Step (Pass Depth, Z, Step Over, Direction), Advanced toggle
- Laser worker code now has `|| 0` fallback for lineAngle (lw5-cam-gcode.js)
- Cross hatch ops missing crossAngle propagation — mill worker has `|| 90` fallback, laser too
- export `toolpathToOperation` from lw5-print-dialog.js as window global for preview reuse
