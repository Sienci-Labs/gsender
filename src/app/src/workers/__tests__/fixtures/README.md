# Rotary preview regression

`rotary-y-preview.nc` is a synthetic RotatoCAM fixture for viewing only. It has
no spindle command or machining setup and must not be used as a cutting program.

1. Open the file in gSender without connecting to a machine.
2. Under **Config > Rotary**, select **Y** for **Rotary preview axis**, leave
   **Rotary centerline Z** at 0 mm, and apply.
3. The preview should contain two radius-5 rings centered on Y at 10 and 30 mm,
   axial lines and forward/reverse helices between them. The X/Z extent is
   -5 to +5 mm, apart from the initial positioning move from the origin.
4. Select **X** and apply. The same file now wraps around X, demonstrating the
   original mismatch: Y travel becomes radial displacement.
5. Switch back to Y and check the top-down SVG view as well as the 3D view.

The setting interprets **A words** as rotation around the selected physical
centerline. It does not rename A to B, rewrite the file, alter controller
configuration, or change streaming, bounds checks or time estimation. X is the
backward-compatible default. Preview coordinates use the existing inverse-angle
convention: at A=+90, (X0,Y20,Z5) becomes (-5,20,0) for Y alignment. The live model
rotates by +A around the same axis to return that point to machine coordinates.

For stock-top Z zero, set **Rotary centerline Z** to the negative stock radius
in millimeters (for example, -10 for 20 mm diameter stock). The worker subtracts
this centerline before rotating, and the viewer restores the offset afterward.
A nonzero value overrides the optional diameter-header offset and applies only
to files containing A words. It is stored in millimeters even for G20 input.
Offline previews use A=0 when no machine position is available.

This change covers G0/G1 paths, including simultaneous linear/A motion and
fixed-A travel. It does not add rotary G2/G3 interpolation, B/C-axis support,
transverse centerline offsets or stock-removal simulation. The existing optional
diameter-header offset and transverse-axis guard are retained, with X as the
transverse axis for Y-aligned previews.

Run the regression tests from the repository root:

```sh
yarn jest --runInBand --runTestsByPath src/app/src/workers/__tests__/Visualize.rotary.test.ts src/app/src/features/Visualizer/__tests__/GCodeVisualizer.rotary.test.js
```

Tests use the real G-code parser/worker and Three.js geometry. They verify
independently calculated landmarks, positive/negative rotations, multiple turns,
short and long rotary moves, fixed-angle travel, rapid opacity, inch/incremental
equivalence, SVG projection, optional radius offset, stock-top Z zero, default X
behavior, and live rotation. Customer-file reproduction and physical machine operation are separate
validation steps; neither is claimed by these synthetic tests.
