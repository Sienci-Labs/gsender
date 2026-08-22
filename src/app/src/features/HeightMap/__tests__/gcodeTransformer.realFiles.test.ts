/*
 * The transformer against a corpus of real CAM output.
 *
 * Everything asserted here is a property of ANY valid program, never a fact
 * about a particular file. That is deliberate: the corpus lives outside the
 * repository and changes without notice, and an earlier version of this test
 * failed the moment one of the files grew -- not because the transformer
 * regressed but because the assertion described the old file rather than the
 * transformer.
 *
 * Three invariants:
 *
 *   1. Continuity of cutting moves. A G1 that teleports means the transformer
 *      lost the tool and would drag it through finished material. A G0
 *      repositioning at clearance height is ordinary CAM and is not a fault --
 *      but a G0 that jumps while the tool is still below the surface is, since
 *      that is a rapid through stock.
 *
 *   2. Compensation is exactly the map, applied exactly once. Established
 *      differentially: the same program is transformed twice, once against the
 *      warped map and once against an all-zero map. The zero-map run emits the
 *      commanded depth untouched, so the difference between the two runs at any
 *      point must equal the map's offset there. This is immune to arcs, Z ramps
 *      and helical entries, which is what defeats trying to recognise depths one
 *      at a time.
 *
 *   3. No invented depth. The zero-map run reconstructs the nominal, which must
 *      be a depth the source actually commanded -- or, where the program ramps Z
 *      through a move, a value monotonically between its immediate neighbours.
 *      Ramps are real: several files here descend in even ~0.008mm steps away
 *      from a commanded 2.54mm, and demanding an exact match would reject them.
 *      Bounding each interpolated point by its own neighbours keeps that honest
 *      while still catching a single point out of place. The earlier form only
 *      required the nominal to sit somewhere between the program's minimum and
 *      maximum Z -- a band about 17mm wide on the largest file here, which a cut
 *      1mm too deep passes comfortably.
 */

import fs from 'fs';
import path from 'path';
import { transformGcode, validateGcodeBounds } from '../utils/gcodeTransformer';
import { bilinearInterpolate } from '../utils/interpolation';
import { HeightMapData } from '../definitions';

const DIR = '/Users/huy/docs/cnc-gcodes';
const SEGMENT_LENGTH = 1;
/** Emitted coordinates carry four decimals, so two roundings plus slack. */
const TOL = 2e-3;

const mapFor = (
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    warped: boolean,
): HeightMapData => {
    const pts: HeightMapData['points'] = [];
    for (let iy = 0; iy < 5; iy++) {
        for (let ix = 0; ix < 5; ix++) {
            const x = minX + ((maxX - minX) * ix) / 4;
            const y = minY + ((maxY - minY) * iy) / 4;
            const z = warped
                ? +(
                      0.25 * Math.sin((Math.PI * ix) / 4) -
                      0.15 * Math.cos((Math.PI * iy) / 4)
                  ).toFixed(4)
                : 0;
            pts.push({ x, y, z });
        }
    }
    return {
        bounds: { minX, maxX, minY, maxY },
        resolution: { x: (maxX - minX) / 4, y: (maxY - minY) / 4 },
        points: pts,
        units: 'mm',
    };
};

/** G28/G30/G53 revoke known position, so continuity restarts after one. */
const BARRIER = /\bG(?:28|30|53)\b/i;

interface Motion {
    rapid: boolean;
    x: number;
    y: number;
    z: number;
}

const readMotion = (line: string): Motion | null => {
    if (!/^G[01]\b/.test(line)) return null;
    const x = line.match(/X(-?\d*\.?\d+)/i);
    const y = line.match(/Y(-?\d*\.?\d+)/i);
    const z = line.match(/Z(-?\d*\.?\d+)/i);
    if (!x || !y || !z) return null;
    return {
        rapid: line.startsWith('G0'),
        x: parseFloat(x[1]),
        y: parseFloat(y[1]),
        z: parseFloat(z[1]),
    };
};

// Local corpus of real CAM output. Skipped when unavailable so the suite stays
// green on other machines and in CI.
const hasCorpus = fs.existsSync(DIR);
const maybe = hasCorpus ? it : it.skip;

maybe('every real program', () => {
    const files = fs
        .readdirSync(DIR)
        .filter((f) => f.endsWith('.nc'))
        .sort();
    const rows: string[] = [];
    const faults: string[] = [];
    const note = (msg: string) => {
        if (faults.length < 12) faults.push(msg);
    };

    for (const f of files) {
        const src = fs.readFileSync(path.join(DIR, f), 'utf8');
        const probe = mapFor(-1e4, 1e4, -1e4, 1e4, true);
        const b = validateGcodeBounds(src, probe);
        if (!isFinite(b.gcodeMinX) || b.gcodeMaxX === b.gcodeMinX) {
            rows.push(`${f.padEnd(26)} | no motion`);
            continue;
        }
        const pad = 5;
        const map = mapFor(
            b.gcodeMinX - pad,
            b.gcodeMaxX + pad,
            b.gcodeMinY - pad,
            b.gcodeMaxY + pad,
            true,
        );
        const flatMap = mapFor(
            b.gcodeMinX - pad,
            b.gcodeMaxX + pad,
            b.gcodeMinY - pad,
            b.gcodeMaxY + pad,
            false,
        );

        const t0 = Date.now();
        const opts = { segmentLength: SEGMENT_LENGTH, warnOutsideBounds: true };
        const r = transformGcode(src, map, opts);
        const flat = transformGcode(src, flatMap, opts);
        const ms = Date.now() - t0;

        if (r.errors.length) {
            rows.push(`${f.padEnd(26)} | REFUSED: ${r.errors[0].slice(0, 60)}`);
            continue;
        }

        const lines = r.transformedGcode.split('\n').map((l) => l.trim());
        const flatLines = flat.transformedGcode.split('\n').map((l) => l.trim());

        // The two runs differ only in map values, so subdivision and arc
        // flattening are identical and the outputs align line for line. If they
        // ever do not, the differential below is meaningless and must not run.
        if (lines.length !== flatLines.length) {
            note(
                `${f}: control run emitted ${flatLines.length} lines against ${lines.length}`,
            );
            continue;
        }

        const inch = /^\s*G20\b/m.test(src);
        const scale = inch ? 25.4 : 1;
        const srcZ = [
            ...new Set(
                (src.match(/\bZ(-?\d*\.?\d+)/g) || []).map(
                    (w) => parseFloat(w.slice(1)) * scale,
                ),
            ),
        ];

        const arcs = lines.filter((l) => /^G[23]\b/.test(l)).length;
        if (arcs) note(`${f}: ${arcs} raw arcs survived flattening`);

        let previous: Motion | null = null;
        let discontinuities = 0;
        let maxJump = 0;
        let offBy = 0;
        let invented = 0;
        const nominals: number[] = [];

        for (let i = 0; i < lines.length; i++) {
            if (BARRIER.test(lines[i])) {
                previous = null;
                continue;
            }

            const move = readMotion(lines[i]);
            if (!move) continue;
            const control = readMotion(flatLines[i]);

            // --- 1. continuity ---------------------------------------------
            if (previous) {
                const d = Math.hypot(move.x - previous.x, move.y - previous.y);
                if (d > SEGMENT_LENGTH * 1.5) {
                    const surface = bilinearInterpolate(move.x, move.y, map) ?? 0;
                    const fromSurface =
                        bilinearInterpolate(previous.x, previous.y, map) ?? 0;
                    const inMaterial =
                        move.z < surface - TOL || previous.z < fromSurface - TOL;
                    if (!move.rapid || inMaterial) {
                        discontinuities++;
                        maxJump = Math.max(maxJump, d);
                        note(
                            `${f}: ${d.toFixed(1)}mm ${
                                move.rapid ? 'rapid through stock' : 'cutting jump'
                            } (${previous.x},${previous.y},${previous.z}) -> ` +
                                `(${move.x},${move.y},${move.z})`,
                        );
                    }
                }
            }
            previous = move;

            if (!control) continue;
            nominals.push(control.z);

            // --- 2. compensation is exactly the map ------------------------
            const offset = bilinearInterpolate(move.x, move.y, map) ?? 0;
            const applied = move.z - control.z;
            if (Math.abs(applied - offset) > TOL) {
                offBy++;
                note(
                    `${f}: applied ${applied.toFixed(4)} where the map says ` +
                        `${offset.toFixed(4)} at (${move.x},${move.y})`,
                );
            }
        }

        // --- 3. every nominal is commanded, or interpolated between its own
        // neighbours on a Z ramp ---------------------------------------------
        for (let i = 0; i < nominals.length; i++) {
            const n = nominals[i];
            if (Math.min(...srcZ.map((v) => Math.abs(v - n))) <= TOL) continue;

            const before = nominals[i - 1];
            const after = nominals[i + 1];
            const bracketed =
                before !== undefined &&
                after !== undefined &&
                n >= Math.min(before, after) - TOL &&
                n <= Math.max(before, after) + TOL;

            if (!bracketed) {
                invented++;
                note(
                    `${f}: nominal ${n} is neither a commanded depth nor between ` +
                        `its neighbours (${before}, ${after})`,
                );
            }
        }

        rows.push(
            `${f.padEnd(26)} | ${inch ? 'in' : 'mm'} | ${String(
                src.split('\n').length,
            ).padStart(6)} -> ${String(lines.length).padStart(6)} | ` +
                `arcs:${arcs} cuts:${discontinuities}(${maxJump.toFixed(1)}) ` +
                `offBy:${offBy} invented:${invented} | ${ms}ms`,
        );
    }

    // Logged so a corpus change is visible in the output even when everything
    // still passes -- the dependency is external and silent otherwise.
    console.log(`corpus: ${DIR} (${files.length} files)`);
    console.log(
        'file                       | u  |   in   ->  out    | invariants                                  | time',
    );
    console.log(rows.join('\n'));

    expect(faults).toEqual([]);
});
