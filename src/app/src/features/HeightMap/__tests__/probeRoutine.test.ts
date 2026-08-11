/*
 * Probe routine command generation.
 *
 * The probe command is the only thing standing between a configured probe
 * depth and the machine driving the tool into the table. Two properties matter
 * more than the exact text:
 *
 *   1. The G38.2 stroke is RELATIVE. The UI calls the field "Max Probe Depth"
 *      with the tooltip "Max distance to travel down before alarming", and
 *      gSender's own probing (src/app/src/lib/Probing.ts) sets G91 before every
 *      G38.2. An absolute G38.2 makes the configured number mean a coordinate
 *      rather than a distance, and the real stroke becomes zClearance deeper
 *      than the operator asked for.
 *
 *   2. The distance modal is handed back as G90. The controller's 'gcode:safe'
 *      handler (GrblController.js) wraps only the UNITS modal (G20/G21) -- it
 *      knows nothing about G90/G91 -- so if this function leaves the machine in
 *      incremental mode, nothing downstream puts it back.
 */

import {
    generateSingleProbeCommand,
    createHeightMapFromProbeResults,
    resolveWorkOffsetZ,
    validateProbeTravel,
    describeLegacyNormalizedMap,
    calculateProbeTimeoutMs,
    DEFAULT_PROBE_TIMEOUT_MULTIPLIER,
    MIN_PROBE_TIMEOUT_MS,
    probeConfigToMillimetres,
    validateReportUnits,
    restoreHeightMapSettings,
} from '../utils/probeRoutine';
import { calculateProbeGrid } from '../utils/interpolation';

import {
    HeightMapConfig,
    HeightMapData,
    DEFAULT_HEIGHT_MAP_CONFIG,
    MIN_VALUES,
} from '../definitions';

/** Strip comments and blanks so assertions read against real motion only. */
const codeLines = (command: string): string[] =>
    command
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith(';') && !l.startsWith('('));

/**
 * Track the G90/G91 distance modal through a command stream the way a
 * controller does: last one on a block wins, and it persists across blocks.
 */
const finalDistanceModal = (lines: string[]): string => {
    let modal = 'G90';
    for (const line of lines) {
        const found = line.match(/\bG9([01])\b/g);
        if (found) {
            modal = found[found.length - 1];
        }
    }
    return modal;
};

/** The block containing the probe move, as a controller would see it. */
const probeBlock = (lines: string[]): string =>
    lines.find((l) => /G38\.2/.test(l))!;

/** Distance modal in force at the moment the G38.2 block executes. */
const modalAtProbe = (lines: string[]): string => {
    const idx = lines.findIndex((l) => /G38\.2/.test(l));
    return finalDistanceModal(lines.slice(0, idx + 1));
};

describe('generateSingleProbeCommand', () => {
    const zClearance = 5;
    const feedRate = 100;
    const maxProbeDepth = 10;

    const command = generateSingleProbeCommand(
        12.3456,
        -7.891,
        zClearance,
        feedRate,
        maxProbeDepth,
    );
    const lines = codeLines(command);

    it('probes with a relative move, not an absolute one', () => {
        // G38.2 under G90 would seek the absolute coordinate Z-maxProbeDepth.
        // Under G91 it travels maxProbeDepth from wherever the tool is, which
        // is what "Max distance to travel down" means.
        expect(modalAtProbe(lines)).toBe('G91');
    });

    it('does not leave G90 in force on the probe block', () => {
        // Guards the subtle failure where G91 is added somewhere earlier but a
        // later G90 on the same block silently wins.
        expect(probeBlock(lines)).not.toMatch(/\bG90\b/);
    });

    it('restores absolute mode after probing', () => {
        expect(finalDistanceModal(lines)).toBe('G90');
    });

    it('keeps the clearance and positioning moves absolute', () => {
        // zClearance is a height in work coordinates, not a distance to travel.
        const clearance = lines.find((l) => /G0\b.*\bZ/.test(l))!;
        expect(clearance).toMatch(/\bG90\b/);
        expect(clearance).toMatch(/Z5\b/);

        const xy = lines.find((l) => /G0\b.*X.*Y/.test(l))!;
        expect(xy).toMatch(/\bG90\b/);
    });

    it('raises to clearance before moving in XY, and probes last', () => {
        const zIdx = lines.findIndex((l) => /G0\b.*\bZ/.test(l));
        const xyIdx = lines.findIndex((l) => /G0\b.*X.*Y/.test(l));
        const probeIdx = lines.findIndex((l) => /G38\.2/.test(l));
        expect(zIdx).toBeLessThan(xyIdx);
        expect(xyIdx).toBeLessThan(probeIdx);
    });

    it('formats coordinates to three decimals and carries the feed rate', () => {
        const xy = lines.find((l) => /G0\b.*X.*Y/.test(l))!;
        expect(xy).toContain('X12.346');
        expect(xy).toContain('Y-7.891');
        expect(probeBlock(lines)).toMatch(/Z-10\b/);
        expect(probeBlock(lines)).toMatch(/F100\b/);
    });

    it('does not set the units modal, which gcode:safe already wraps', () => {
        // controller.command('gcode:safe', command, 'G21') prepends G21 and
        // restores the device modal afterwards. Emitting G20/G21 here would
        // fight that wrapper.
        expect(command).not.toMatch(/\bG2[01]\b/);
    });

    it('leaves no state behind when several points are streamed back to back', () => {
        // The probe cycle issues one of these per point (index.tsx:320). If a
        // command ends incremental, the NEXT point's clearance and XY moves are
        // interpreted as deltas and the tool walks off the workpiece.
        const points = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
        ];
        const stream = points.map((p) =>
            generateSingleProbeCommand(p.x, p.y, zClearance, feedRate, maxProbeDepth),
        );

        for (const single of stream) {
            const singleLines = codeLines(single);
            expect(modalAtProbe(singleLines)).toBe('G91');
            expect(finalDistanceModal(singleLines)).toBe('G90');
        }

        // And the same holds for the concatenation, so no point depends on a
        // neighbour to clean up after it.
        const all = codeLines(stream.join('\n'));
        expect(all.filter((l) => /G38\.2/.test(l))).toHaveLength(points.length);
        expect(finalDistanceModal(all)).toBe('G90');
    });
});

describe('createHeightMapFromProbeResults', () => {
    const config: HeightMapConfig = {
        ...DEFAULT_HEIGHT_MAP_CONFIG,
        minX: 0,
        maxX: 10,
        minY: 0,
        maxY: 10,
        gridSpacing: 10,
    };

    const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 10 },
    ];

    it('converts probe readings from machine to work coordinates', () => {
        // PRB is reported in machine coordinates; the map has to be referenced
        // to work Z zero because the transformer adds it onto commanded Z.
        const workHeights = [-0.4, 0.15, -0.05, 0.3];
        const wcoZ = -85;
        const prbReadings = workHeights.map((z) => z + wcoZ);

        const map = createHeightMapFromProbeResults(
            points,
            prbReadings,
            config,
            'mm',
            wcoZ,
        );

        map.points.forEach((p, i) => expect(p.z).toBeCloseTo(workHeights[i], 6));
    });

    it('is a no-op when work zero and machine zero coincide', () => {
        const zValues = [-0.4, 0.15, -0.05, 0.3];
        const map = createHeightMapFromProbeResults(points, zValues, config, 'mm', 0);
        expect(map.points.map((p) => p.z)).toEqual(zValues);
    });

    it('rejects mismatched point and Z arrays', () => {
        expect(() =>
            createHeightMapFromProbeResults([{ x: 0, y: 0 }], [], config, 'mm', 0),
        ).toThrow();
    });

    it('refuses to build a map without a usable work offset', () => {
        // Defaulting to zero here would silently reintroduce a full-depth
        // plunge, so an unusable offset has to be loud.
        const zValues = [-0.4, 0.15, -0.05, 0.3];
        expect(() =>
            createHeightMapFromProbeResults(
                points,
                zValues,
                config,
                'mm',
                undefined as unknown as number,
            ),
        ).toThrow(/work coordinate offset/i);
    });
});

describe('resolveWorkOffsetZ', () => {
    // The probe cycle cannot be referenced to work zero without this number, and
    // guessing zero is the exact failure that drives the tool into the table, so
    // an unusable status has to stop the cycle rather than degrade quietly.

    it('reads wco.z from the raw controller status', () => {
        expect(resolveWorkOffsetZ({ wco: { x: 1, y: 2, z: -85.25 } })).toEqual({
            ok: true,
            wcoZ: -85.25,
        });
    });

    it('accepts the string form the runner emits', () => {
        // GrblRunner writes positions back through toFixed(), so numeric fields
        // arrive as strings often enough that rejecting them would be wrong.
        expect(resolveWorkOffsetZ({ wco: { x: '0.000', y: '0.000', z: '-85.250' } })).toEqual({
            ok: true,
            wcoZ: -85.25,
        });
    });

    it('accepts a genuine zero offset', () => {
        // Falsy but completely valid: work zero coincident with machine zero.
        expect(resolveWorkOffsetZ({ wco: { x: 0, y: 0, z: 0 } })).toEqual({
            ok: true,
            wcoZ: 0,
        });
    });

    it.each([
        ['no status at all', null],
        ['status without wco', { activeState: 'Idle' }],
        ['wco without z', { wco: { x: 1, y: 2 } }],
        ['non-numeric z', { wco: { z: 'nope' } }],
        ['null z', { wco: { z: null } }],
        ['infinite z', { wco: { z: Infinity } }],
    ])('refuses when %s', (_label, status) => {
        const result = resolveWorkOffsetZ(status as never);
        expect(result.ok).toBe(false);
        expect((result as { error: string }).error).toMatch(/work coordinate offset/i);
    });
});

describe('validateProbeTravel', () => {
    // The probe starts at zClearance above work zero and travels maxProbeDepth
    // down, so it only reaches a surface near Z=0 when maxProbeDepth exceeds
    // zClearance. Below that the cycle cannot succeed at all -- better to say so
    // before moving than to let the operator find out as an alarm mid-grid.

    it('accepts travel that reaches past work zero', () => {
        expect(validateProbeTravel(5, 10, 'mm')).toEqual({ valid: true });
    });

    it.each([
        ['equal to clearance', 5, 5],
        ['less than clearance', 5, 0.1],
    ])('refuses travel %s', (_label, zClearance, maxProbeDepth) => {
        const result = validateProbeTravel(zClearance, maxProbeDepth, 'mm');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/max probe depth/i);
    });

    it('names both numbers and the units so the fix is obvious', () => {
        const result = validateProbeTravel(5, 0.1, 'mm');
        expect(result.error).toContain('0.1');
        expect(result.error).toContain('5');
        expect(result.error).toContain('mm');
    });

    it('works the same in imperial', () => {
        expect(validateProbeTravel(0.2, 0.4, 'in')).toEqual({ valid: true });
        expect(validateProbeTravel(0.2, 0.004, 'in').valid).toBe(false);
    });
});

describe('describeLegacyNormalizedMap', () => {
    const mapWith = (zValues: number[]): HeightMapData => ({
        bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
        resolution: { x: 10, y: 10 },
        points: [
            { x: 0, y: 0, z: zValues[0] },
            { x: 10, y: 0, z: zValues[1] },
            { x: 0, y: 10, z: zValues[2] },
            { x: 10, y: 10, z: zValues[3] },
        ],
        units: 'mm',
    });

    it('flags a map whose lowest point is exactly zero', () => {
        // The signature normalizeHeightMap left behind. The original datum is
        // unrecoverable from the file, so a warning is all that is honest.
        const warning = describeLegacyNormalizedMap(mapWith([0, 0.1, 0.25, 0.4]));
        expect(warning).toMatch(/re-probe/i);
    });

    it('passes a map that straddles zero', () => {
        expect(describeLegacyNormalizedMap(mapWith([-0.4, -0.1, 0.25, 0.4]))).toBeNull();
    });

    it('passes an all-negative map', () => {
        expect(describeLegacyNormalizedMap(mapWith([-3, -2.9, -2.5, -1.44]))).toBeNull();
    });

    it('passes an entirely positive map that never touches zero', () => {
        expect(describeLegacyNormalizedMap(mapWith([0.5, 0.9, 1.2, 2.06]))).toBeNull();
    });

    it('does not flag a genuinely flat map at work zero', () => {
        // All zeros has no lowest point in the normalised sense -- there is no
        // variation to have been shifted, so warning would be noise.
        expect(describeLegacyNormalizedMap(mapWith([0, 0, 0, 0]))).toBeNull();
    });

    it('tolerates an empty map', () => {
        expect(
            describeLegacyNormalizedMap({ ...mapWith([0, 0, 0, 0]), points: [] }),
        ).toBeNull();
    });
});

describe('calculateProbeTimeoutMs', () => {
    // A watchdog is the only thing that ends a cycle when the machine simply
    // never answers. Too short is its own hazard -- aborting a valid slow probe
    // mid-grid -- so the number is derived from the move and then given a lot of
    // headroom, rather than picked.

    const base = { zClearance: 5, maxProbeDepth: 10, probeFeedRate: 100 };

    it('scales with the probe move', () => {
        // 10mm at 100mm/min is 6s of probing; halving the feed doubles it.
        const fast = calculateProbeTimeoutMs(base);
        const slow = calculateProbeTimeoutMs({ ...base, probeFeedRate: 50 });
        expect(slow).toBeGreaterThan(fast);
        expect(slow - fast).toBeCloseTo(6000 * DEFAULT_PROBE_TIMEOUT_MULTIPLIER, -2);
    });

    it('scales with the probe depth', () => {
        expect(
            calculateProbeTimeoutMs({ ...base, maxProbeDepth: 20 }),
        ).toBeGreaterThan(calculateProbeTimeoutMs(base));
    });

    it('covers the whole move with headroom to spare', () => {
        // The actual worst case is the probe plunge plus the positioning rapid
        // plus the settle delay; the timeout has to clear that comfortably.
        const timeout = calculateProbeTimeoutMs(base);
        const probeMs = (base.maxProbeDepth / base.probeFeedRate) * 60000;
        expect(timeout).toBeGreaterThan(probeMs * 2);
    });

    it('is unit agnostic because depth and feed rate share units', () => {
        // 0.4in at 4in/min is the same 6s as 10mm at 100mm/min.
        expect(
            calculateProbeTimeoutMs({
                zClearance: 0.2,
                maxProbeDepth: 0.4,
                probeFeedRate: 4,
            }),
        ).toBe(calculateProbeTimeoutMs(base));
    });

    it('never returns something too short to be survivable', () => {
        const instant = calculateProbeTimeoutMs({
            zClearance: 0.1,
            maxProbeDepth: 0.2,
            probeFeedRate: 100000,
        });
        expect(instant).toBeGreaterThanOrEqual(MIN_PROBE_TIMEOUT_MS);
    });

    it.each([
        ['zero feed rate', 0],
        ['negative feed rate', -100],
        ['non-numeric feed rate', NaN],
    ])('falls back to a usable timeout on %s', (_label, probeFeedRate) => {
        const timeout = calculateProbeTimeoutMs({ ...base, probeFeedRate });
        expect(Number.isFinite(timeout)).toBe(true);
        expect(timeout).toBeGreaterThanOrEqual(MIN_PROBE_TIMEOUT_MS);
    });

    it('returns whole milliseconds', () => {
        const timeout = calculateProbeTimeoutMs({ ...base, probeFeedRate: 37 });
        expect(Number.isInteger(timeout)).toBe(true);
    });
});

describe('probeConfigToMillimetres', () => {
    // The widget holds its configuration in whatever units the workspace is set
    // to, but everything downstream of it is millimetres: the probe command is
    // issued under G21, and [PRB:]/WCO: are reported in millimetres whenever $13
    // is 0 regardless of G20/G21. Converting once, here, is what keeps the
    // command, the validator, the correlation check and the map stamp agreeing.

    const imperial: HeightMapConfig = {
        ...DEFAULT_HEIGHT_MAP_CONFIG,
        minX: 0,
        maxX: 100 / 25.4,
        minY: 0,
        maxY: 100 / 25.4,
        gridSpacing: 10 / 25.4,
        edgeInset: 2 / 25.4,
        zClearance: 5 / 25.4,
        probeFeedRate: 100 / 25.4,
        maxProbeDepth: 10 / 25.4,
        segmentLength: 1 / 25.4,
    };

    it('leaves a metric configuration untouched', () => {
        const metric = { ...DEFAULT_HEIGHT_MAP_CONFIG };
        expect(probeConfigToMillimetres(metric, true)).toEqual(metric);
    });

    it('scales every length to millimetres', () => {
        const mm = probeConfigToMillimetres(imperial, false);
        expect(mm.maxX).toBeCloseTo(100, 9);
        expect(mm.maxY).toBeCloseTo(100, 9);
        expect(mm.gridSpacing).toBeCloseTo(10, 9);
        expect(mm.edgeInset).toBeCloseTo(2, 9);
        expect(mm.zClearance).toBeCloseTo(5, 9);
        expect(mm.maxProbeDepth).toBeCloseTo(10, 9);
        expect(mm.segmentLength).toBeCloseTo(1, 9);
    });

    it('scales the feed rate, which is per-minute but still a length', () => {
        // Omitted from the widget's own conversion list, so an imperial
        // workspace displayed millimetres per minute and sent them as-is.
        expect(probeConfigToMillimetres(imperial, false).probeFeedRate).toBeCloseTo(
            100,
            9,
        );
    });

    it('converts exactly, not through the rounded display helpers', () => {
        // convertToMetric rounds to two decimals and convertToImperial to three.
        // A probe datum cannot afford either.
        const mm = probeConfigToMillimetres(
            { ...imperial, zClearance: 0.001 },
            false,
        );
        expect(mm.zClearance).toBeCloseTo(0.0254, 12);
    });

    it('carries non-length fields through unchanged', () => {
        const mm = probeConfigToMillimetres(
            { ...imperial, usePointCount: true, pointCountX: 7, pointCountY: 9 },
            false,
        );
        expect(mm.usePointCount).toBe(true);
        expect(mm.pointCountX).toBe(7);
        expect(mm.pointCountY).toBe(9);
    });
});

describe('validateReportUnits', () => {
    // $13 switches the controller's position REPORTS to inches, independently of
    // G20/G21 which only affect program input. Every probe reading and work
    // offset this feature consumes comes from a report, so $13=1 scales the
    // whole datum by 25.4 with nothing else looking wrong.

    it('accepts a controller reporting in millimetres', () => {
        expect(validateReportUnits({ $13: '0' })).toEqual({ valid: true });
        expect(validateReportUnits({ $13: 0 })).toEqual({ valid: true });
    });

    it('refuses a controller reporting in inches', () => {
        const result = validateReportUnits({ $13: '1' });
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/\$13/);
        expect(result.error).toMatch(/inch/i);
    });

    it('refuses when the setting is unknown rather than assuming', () => {
        // Guessing wrong here is a 25.4x datum error, so an unread EEPROM is a
        // reason to stop and reconnect, not to proceed hopefully.
        for (const settings of [null, undefined, {}, { $110: '5000' }]) {
            const result = validateReportUnits(settings as never);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/\$13/);
        }
    });
});

describe('calculateProbeGrid boundary handling', () => {
    // Found while converting the probe path to millimetres. The grid rounds each
    // point to three decimals but compared the last one against an unrounded
    // maxX, so any bound that is not exact at three decimals -- which is every
    // bound that has been through a unit conversion -- produced a second column
    // a fraction of a nanometre from the first. That gives the height map a
    // zero-width cell, and bilinear interpolation across it divides by nothing.

    const columns = (maxX: number) =>
        [...new Set(calculateProbeGrid(0, maxX, 0, 20, 10, false, 0, 0).map((p) => p.x))].sort(
            (a, b) => a - b,
        );

    it('does not duplicate a bound that is exact', () => {
        expect(columns(20)).toEqual([0, 10, 20]);
    });

    it('does not duplicate a bound carrying floating point dust', () => {
        // 60mm scaled to inches and back lands on 59.99999999999999. Written
        // the way the widget really does it -- a reciprocal scale factor applied
        // to the bound, then the conversion to millimetres.
        const dusty = 60 * (1 / 25.4) * 25.4;
        expect(dusty).not.toBe(60);
        expect(
            [
                ...new Set(
                    calculateProbeGrid(0, dusty, 0, 20, 20, false, 0, 0).map((p) => p.x),
                ),
            ].sort((a, b) => a - b),
        ).toEqual([0, 20, 40, 60]);
    });

    it('still reaches a bound that the spacing does not divide', () => {
        expect(columns(25)).toEqual([0, 10, 20, 25]);
    });

    it('never emits two columns closer together than a micron', () => {
        for (const maxX of [20, 60 * (1 / 25.4) * 25.4, 25, 33.333, 59.9948]) {
            const xs = columns(maxX);
            for (let i = 1; i < xs.length; i++) {
                expect(xs[i] - xs[i - 1]).toBeGreaterThan(1e-3);
            }
        }
    });
});

describe('MIN_VALUES parity between unit systems', () => {
    // The imperial floors were written by hand and drifted: segmentLength was
    // 0.004in against a metric 0.01mm, ten times looser, and probeFeedRate's 1
    // in/min only matched the metric 25 mm/min by luck once the feed rate joined
    // the display conversion. A floor is a physical statement -- "no smaller
    // than this" -- so both systems have to mean the same thing.

    it('states the same physical minimum in both systems', () => {
        const metric = MIN_VALUES.metric as Record<string, number>;
        const imperial = MIN_VALUES.imperial as Record<string, number>;

        expect(Object.keys(imperial).sort()).toEqual(Object.keys(metric).sort());
        for (const key of Object.keys(metric)) {
            expect(imperial[key] * 25.4).toBeCloseTo(metric[key], 9);
        }
    });
});

describe('restoreHeightMapSettings', () => {
    /*
     * A .gshmap carries two things in different units, and used to say which for
     * neither: the points and bounds are millimetres, while the config block is
     * whatever the workspace was displaying when it was saved. Loading applied
     * both verbatim, so a map saved in millimetres and opened on an imperial
     * workspace restored bounds and settings 25.4 times too large.
     */
    const mapMm: HeightMapData = {
        bounds: { minX: 0, maxX: 50, minY: 0, maxY: 40 },
        resolution: { x: 25, y: 20 },
        points: [
            { x: 0, y: 0, z: 0 },
            { x: 50, y: 0, z: 0.1 },
            { x: 0, y: 40, z: 0.1 },
            { x: 50, y: 40, z: 0.2 },
        ],
        units: 'mm',
        config: {
            gridSpacing: 25,
            usePointCount: false,
            zClearance: 5,
            probeFeedRate: 100,
            maxProbeDepth: 10,
            segmentLength: 1,
            units: 'mm',
        },
    } as HeightMapData;

    it('leaves a millimetre map alone on a metric workspace', () => {
        const restored = restoreHeightMapSettings(mapMm, true);
        expect(restored.bounds).toEqual({ minX: 0, maxX: 50, minY: 0, maxY: 40 });
        expect(restored.config.zClearance).toBeCloseTo(5, 9);
        expect(restored.warning).toBeUndefined();
    });

    it('converts the bounds for an imperial workspace', () => {
        // The points are millimetres whatever the workspace shows.
        const restored = restoreHeightMapSettings(mapMm, false);
        expect(restored.bounds.maxX).toBeCloseTo(50 / 25.4, 6);
        expect(restored.bounds.maxY).toBeCloseTo(40 / 25.4, 6);
    });

    it('converts the configuration from the units it was saved in', () => {
        const restored = restoreHeightMapSettings(mapMm, false);
        expect(restored.config.zClearance).toBeCloseTo(5 / 25.4, 6);
        expect(restored.config.probeFeedRate).toBeCloseTo(100 / 25.4, 6);
        expect(restored.config.segmentLength).toBeCloseTo(1 / 25.4, 6);
    });

    it('round trips a configuration saved on an imperial workspace', () => {
        const savedImperial = {
            ...mapMm,
            config: { ...mapMm.config, zClearance: 5 / 25.4, units: 'in' },
        } as HeightMapData;

        expect(restoreHeightMapSettings(savedImperial, false).config.zClearance).toBeCloseTo(
            5 / 25.4,
            6,
        );
        expect(restoreHeightMapSettings(savedImperial, true).config.zClearance).toBeCloseTo(
            5,
            6,
        );
    });

    it('warns when the configuration does not record its units', () => {
        const legacy = {
            ...mapMm,
            config: { ...mapMm.config, units: undefined },
        } as HeightMapData;

        const restored = restoreHeightMapSettings(legacy, false);
        expect(restored.warning).toMatch(/unit/i);
        // Applied as-is, since guessing would be worse than saying so.
        expect(restored.config.zClearance).toBeCloseTo(5, 9);
    });

    it('handles a map with no config block at all', () => {
        const bare = { ...mapMm, config: undefined } as HeightMapData;
        const restored = restoreHeightMapSettings(bare, false);
        expect(restored.bounds.maxX).toBeCloseTo(50 / 25.4, 6);
        expect(restored.config.usePointCount).toBeUndefined();
    });

    it('derives a grid spacing in display units when none was stored', () => {
        // Falling back to the gap between adjacent point X values takes it
        // straight from the millimetre points, so it has to be converted like
        // the bounds. This fixture has columns at x=0 and x=50, so the gap is
        // 50mm -- not resolution.x, which the fallback deliberately ignores
        // because a hand-written map may not have one.
        const bare = { ...mapMm, config: undefined } as HeightMapData;
        expect(restoreHeightMapSettings(bare, false).config.gridSpacing).toBeCloseTo(
            50 / 25.4,
            6,
        );
        expect(restoreHeightMapSettings(bare, true).config.gridSpacing).toBeCloseTo(
            50,
            6,
        );
    });
});
