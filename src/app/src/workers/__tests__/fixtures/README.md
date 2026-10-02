# RotatoCAM rotary preview regression fixtures

Synthetic G0/G1 programs for an A-word rotary aligned with Y. No customer files are included.

In Configuration > Rotary, choose Y for Rotary preview axis. Load `rotary-y-preview.nc`
with centerline Z=0, then `rotary-y-posted-datum.nc`. The second file reads its stock-top
Z datum automatically from `rotatocam-meta`; no manual centerline adjustment is needed.
Move through the program in G-code Stepper and compare the tool marker with the path.
Repeat at A=0, 90, 180 and 270 and verify the Y direction remains the axial direction.
Check rapids, reloads, X default, and a plain XYZ program. No machine connection is needed.

The worker inverse-rotates each linear move about X or Y and restores the centerline
translation into work coordinates. Its `segments-v1` message carries
`rotary: { axis, centerlineZ }` alongside the existing chunks and progress map. The
viewer applies live A about this same centerline without changing vertex buffers.
The main viewer and G-code Stepper load the same metadata; pendant SVG uses the
worker's projected XY endpoints. The machine-space bounds and time estimator are unchanged.

RotatoCAM subtracts `z_zero_offset` from posted Z. Therefore the preview centerline is
its negative. Metadata requires `radial=z units=mm` and a finite numeric offset;
it remains metric in G20 programs. Semicolon and standalone parenthesized comments
are accepted. Invalid, duplicate-field, or conflicting metadata uses the manual
fallback. Explicit zero is valid and overrides the optional cylinder-diameter guess.
Files without real A words ignore the explicit centerline. Rotation about off-axis
X/Y centerlines, rotary arcs, B and C are outside this change.

## Dependency and validation

The live transform requires https://github.com/kglovern/gcode_parser_viewer/pull/3.
For review, package.json pins the tested fork commit, including its built
distribution. Before merging, replace this temporary pin with a released
`@sienci/gviewer` version containing that change. No customer defaults or branding UI
changes from the separate Pi package are part of this upstream port.

Run `npx jest --runInBand src/app/src/workers/__tests__/Visualize.rotary.test.ts`.
The companion viewer tests exercise real scene transforms and geometry loading without
WebGL, including round trips back to machine work coordinates and unload/reload resets.
These are software preview checks, not physical Pi or CNC motion tests.
