/*
 * Unit tests for the run-progress toolpath coloring added in
 * "Add run-progress toolpath coloring to the 3D visualizer".
 *
 * These exercise the pure-geometry logic of GCodeVisualizer.greyOutLines():
 *   - the three-zone painter (grey executed / orange lead / yellow buffered),
 *   - the nearest-SEGMENT scan that locates the grey/orange split,
 *   - the monotonic grey edge (never retreats within a run),
 *   - the off-path freeze (jogging away from the path holds the last split),
 * plus the cumulative arc-length table (_ensureCumLen) used to size the lead.
 *
 * three is real (jest does not mock it); only the redux store and the rotary
 * detector are stubbed so the module can be imported without the app's wider
 * dependency tree. Colors are compared against THREE.Color(<same input>) so the
 * assertions are independent of three's color-management/sRGB conversion.
 */

import * as THREE from 'three';
import { SECONDARY_COLOR } from '../constants';

// Keep the import light + deterministic: no real redux store, always non-rotary.
jest.mock('app/store/redux', () => ({ store: { getState: () => ({}) } }));
jest.mock('../../../lib/rotary', () => ({ checkIfRotaryFile: () => false }));

import GCodeVisualizer from '../GCodeVisualizer';

// Colors the painter uses (mirrors the constants in GCodeVisualizer.js).
const GREY = SECONDARY_COLOR; // '#6F7376'
const ORANGE = '#ff8000'; // PROGRESS_LEAD_COLOR
const YELLOW = '#dff204'; // theme PLANNED_PART value supplied below

// A theme stub whose .get() returns the colors greyOutLines/render read.
const theme = {
    get: (key) =>
        ({
            'Cutting Coordinates Lines': '#ffffff',
            'Planned Cutting Lines': YELLOW,
        })[key],
};

// Build a straight polyline along +X at 1mm spacing (no duplicated joints), so
// vertex i sits at x=i mm and cumulative arc length == vertex index.
function makeStraightPath(n) {
    const vertices = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        vertices[i * 3] = i; // x = i
    }
    const frames = Array.from({ length: n }, (_, i) => i); // line i -> vertex i
    // Initialise every vertex to a distinct SENTINEL color (pure blue), so a
    // vertex left untouched (beyond the buffered range) is detectable and never
    // collides with grey/orange/yellow.
    const colors = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
        colors[i * 4] = 0;
        colors[i * 4 + 1] = 0;
        colors[i * 4 + 2] = 1;
        colors[i * 4 + 3] = 1;
    }
    return { vertices, frames, colors };
}

function renderStraight(gcv, n) {
    const { vertices, frames, colors } = makeStraightPath(n);
    gcv.render({ vertices, frames, isLaser: false }, colors);
    return gcv.group.children[0].geometry.getAttribute('color').array;
}

// Assert vertex v's RGBA matches a THREE.Color built from `input` (+ alpha).
function expectColor(arr, v, input, alpha) {
    const c = new THREE.Color(input);
    const o = v * 4;
    expect(arr[o]).toBeCloseTo(c.r, 4);
    expect(arr[o + 1]).toBeCloseTo(c.g, 4);
    expect(arr[o + 2]).toBeCloseTo(c.b, 4);
    if (alpha !== undefined) {
        expect(arr[o + 3]).toBeCloseTo(alpha, 4);
    }
}

function expectSentinel(arr, v) {
    const o = v * 4;
    expect(arr[o]).toBeCloseTo(0, 4);
    expect(arr[o + 1]).toBeCloseTo(0, 4);
    expect(arr[o + 2]).toBeCloseTo(1, 4);
}

describe('GCodeVisualizer run-progress coloring', () => {
    describe('greyOutLines three-zone painter', () => {
        it('paints grey behind the toolhead, an orange lead, then yellow up to the buffered edge', () => {
            const gcv = new GCodeVisualizer(theme);
            const arr = renderStraight(gcv, 100);
            // Controller has acked up to vertex 60 (the yellow edge).
            gcv.frameIndex = 60;
            // Toolhead sitting on the path at x=30.
            gcv.greyOutLines(1, { x: 30, y: 0, z: 0 });

            // Grey executed zone [0, ~30): low alpha (0.3 in spindle mode).
            expectColor(arr, 10, GREY, 0.3);
            expectColor(arr, 25, GREY, 0.3);
            // Orange lead zone (~20mm of path travel ahead of the tool).
            expectColor(arr, 35, ORANGE, 1);
            expectColor(arr, 45, ORANGE, 1);
            // Yellow buffered zone up to the received edge at 60.
            expectColor(arr, 52, YELLOW, 1);
            expectColor(arr, 58, YELLOW, 1);
            // Beyond the buffered edge the path keeps its planned color (untouched).
            expectSentinel(arr, 70);
            expectSentinel(arr, 90);

            // The orange lead is ~20mm long (LEAD_MM), not the whole buffer.
            expect(gcv._progGreyEndV).toBe(29);
            expect(gcv._progAheadEndV).toBe(60);
        });

        it('uses the wall-clock estimate as the split when no machine position is given', () => {
            const gcv = new GCodeVisualizer(theme);
            const arr = renderStraight(gcv, 100);
            gcv.frameIndex = 60;
            // currentLineRunning = 21 -> estimate boundary at vertex 20.
            gcv.greyOutLines(21, null);

            // Grey ends at the estimate boundary; orange leads from there.
            expectColor(arr, 10, GREY, 0.3);
            expect(gcv._progGreyEndV).toBe(20);
        });
    });

    describe('nearest-segment split is robust on back-and-forth paths', () => {
        it('lands the split on the toolhead\'s own segment, not a spatially-near parallel pass', () => {
            // Two stacked raster passes 0.5mm apart (well under PROGRESS_NEAR_MM=2):
            //   pass 1: x 0..10 at y=0       (vertices 0..10)
            //   pass 2: x 10..0 at y=0.5     (vertices 11..21)
            // The tool is on pass 2; a nearest-VERTEX scan could wrongly pick the
            // overlapping pass-1 vertex, but the nearest-SEGMENT scan keeps it on
            // pass 2.
            const n = 22;
            const vertices = new Float32Array(n * 3);
            for (let i = 0; i <= 10; i++) {
                vertices[i * 3] = i; // pass 1: x=i, y=0
            }
            for (let k = 0; k <= 10; k++) {
                const i = 11 + k;
                vertices[i * 3] = 10 - k; // pass 2: x=10..0
                vertices[i * 3 + 1] = 0.5; // y=0.5
            }
            const frames = Array.from({ length: n }, (_, i) => i);
            const colors = new Float32Array(n * 4);
            for (let i = 0; i < n; i++) colors[i * 4 + 3] = 1;

            const gcv = new GCodeVisualizer(theme);
            gcv.render({ vertices, frames, isLaser: false }, colors);
            gcv.frameIndex = 21; // whole file buffered

            // Tool partway along pass 2 (x≈4, y=0.5).
            gcv.greyOutLines(1, { x: 4, y: 0.5, z: 0 });

            // Split must be on pass 2 (vertex index >= 11), i.e. pass 1 is fully
            // executed (grey) and we are mid pass-2.
            expect(gcv._progGreyEndV).toBeGreaterThanOrEqual(11);
        });
    });

    describe('monotonic grey edge', () => {
        it('never retreats when the toolhead jitters slightly backward', () => {
            const gcv = new GCodeVisualizer(theme);
            renderStraight(gcv, 100);
            gcv.frameIndex = 60;

            gcv.greyOutLines(1, { x: 30, y: 0, z: 0 });
            const afterA = gcv._progGreyEndV;

            gcv.greyOutLines(1, { x: 35, y: 0, z: 0 });
            const afterB = gcv._progGreyEndV;
            expect(afterB).toBeGreaterThan(afterA); // advanced forward

            // Tool jogs back 2mm but stays near the path.
            gcv.greyOutLines(1, { x: 33, y: 0, z: 0 });
            const afterC = gcv._progGreyEndV;
            expect(afterC).toBe(afterB); // edge held, did NOT retreat
        });
    });

    describe('off-path freeze', () => {
        it('holds the split at the last cut point while the tool jogs off the path', () => {
            const gcv = new GCodeVisualizer(theme);
            renderStraight(gcv, 100);
            gcv.frameIndex = 60;

            gcv.greyOutLines(1, { x: 30, y: 0, z: 0 });
            const onPath = gcv._progGreyEndV;
            expect(onPath).toBe(29);

            // Jog 50mm off the path (far past PROGRESS_NEAR_MM): split must freeze.
            gcv.greyOutLines(1, { x: 70, y: 50, z: 0 });
            expect(gcv._progGreyEndV).toBe(onPath);
        });
    });

    describe('_ensureCumLen arc-length table', () => {
        it('computes cumulative path length per vertex', () => {
            const gcv = new GCodeVisualizer(theme);
            // 3-4-5 right angle: (0,0,0) -> (3,0,0) -> (3,4,0)
            const arr = new Float32Array([0, 0, 0, 3, 0, 0, 3, 4, 0]);
            gcv.vertices = new THREE.BufferAttribute(arr, 3);

            const cum = gcv._ensureCumLen();
            expect(cum[0]).toBeCloseTo(0, 6);
            expect(cum[1]).toBeCloseTo(3, 6); // +3
            expect(cum[2]).toBeCloseTo(7, 6); // +4
        });

        it('caches the table and returns the same instance until geometry changes', () => {
            const gcv = new GCodeVisualizer(theme);
            const arr = new Float32Array([0, 0, 0, 1, 0, 0]);
            gcv.vertices = new THREE.BufferAttribute(arr, 3);

            const first = gcv._ensureCumLen();
            const second = gcv._ensureCumLen();
            expect(second).toBe(first); // cached

            // render() loads new geometry and must drop the cache.
            renderStraight(gcv, 5);
            expect(gcv._cumLen).toBeNull();
            const rebuilt = gcv._ensureCumLen();
            expect(rebuilt).not.toBe(first);
            expect(rebuilt[4]).toBeCloseTo(4, 6); // 5 vertices, 1mm spacing
        });
    });
});
