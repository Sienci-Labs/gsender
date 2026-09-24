import GCodeVirtualizer from 'app/lib/GCodeVirtualizer';
import {
    type EstimatorConfig,
    LINE_KIND_FEED,
    LINE_KIND_FIXED,
    LINE_KIND_NONE,
    LINE_KIND_RAPID,
    MotionPlanner,
    trapezoidTime,
} from '../MotionPlanner';

const FAST = 1e7; // effectively infinite rate/accel, isolates one effect per test

const estimate = (gcode: string, config: Partial<EstimatorConfig> = {}) => {
    const estimator = new MotionPlanner(config);
    const noop = () => {};
    const vm = new GCodeVirtualizer({
        addLine: noop,
        addArcCurve: noop,
        addCurve: noop,
        estimator,
    });
    gcode.split(/\r?\n/).forEach((line) => vm.virtualize(line));
    return estimator.finish();
};

// What Sender.load keeps
const senderLines = (gcode: string) =>
    gcode.split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0);

describe('trapezoidTime', () => {
    it('accelerates, cruises and decelerates', () => {
        // 100 mm at 100 mm/s, 500 mm/s^2: 0.2s + 0.2s ramps over 20 mm, 0.8s cruise
        expect(trapezoidTime(100, 500, 0, 0, 100 * 100)).toBeCloseTo(1.2, 6);
    });

    it('handles moves too short to reach nominal speed', () => {
        // 4 mm at 500 mm/s^2 peaks at sqrt(2000) mm/s
        const peak = Math.sqrt(2000);
        expect(trapezoidTime(4, 500, 0, 0, 100 * 100)).toBeCloseTo(
            (2 * peak) / 500,
            6,
        );
    });
});

describe('MotionPlanner via GCodeVirtualizer', () => {
    const base = {
        maxRate: [10000, 10000, 10000, 10000] as [
            number,
            number,
            number,
            number,
        ],
        accel: [500, 500, 500, 500] as [number, number, number, number],
    };

    it('times a single straight move with acceleration', () => {
        const { totalTime } = estimate('G1 X100 F6000', base);
        expect(totalTime).toBeCloseTo(1.2, 3);
    });

    it('does not slow down at a collinear junction', () => {
        const { totalTime } = estimate('G1 X50 F6000\nX100', base);
        expect(totalTime).toBeCloseTo(1.2, 3);
    });

    it('slows nearly to a stop at a 90 degree corner', () => {
        const { totalTime } = estimate('G1 X100 F6000\nY100', base);
        // two independent 1.2s moves minus a small saving from ~4 mm/s junction speed
        expect(totalTime).toBeLessThan(2.4);
        expect(totalTime).toBeGreaterThan(2.3);
    });

    it('limits speed on dense short segments by the planner lookahead', () => {
        const lines = ['G1 F6000'];
        for (let i = 1; i <= 1000; i++) {
            lines.push(`X${(i * 0.1).toFixed(1)}`);
        }
        const gcode = lines.join('\n');
        const shortBuffer = estimate(gcode, { ...base, plannerBlocks: 15 });
        const longBuffer = estimate(gcode, { ...base, plannerBlocks: 2000 });
        // 15 x 0.1 mm window: must be able to stop within 1.5 mm => ~38.7 mm/s
        expect(shortBuffer.totalTime).toBeGreaterThan(2.3);
        expect(longBuffer.totalTime).toBeCloseTo(1.2, 2);
    });

    it('scales rapid rate by each axis share of the move (grbl rule)', () => {
        const { totalTime, lineKind } = estimate('G0 X100 Y100', {
            maxRate: [6000, 3000, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        // Y limits: 3000 / 0.7071 = 4242.6 mm/min along the 141.4 mm diagonal
        expect(totalTime).toBeCloseTo(2.0, 2);
        expect(lineKind[0]).toBe(LINE_KIND_RAPID);
    });

    it('caps feed at the axis max rate', () => {
        const { totalTime } = estimate('G1 X100 F10000', {
            maxRate: [3000, FAST, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        expect(totalTime).toBeCloseTo(2.0, 2);
    });

    it('times arcs along the arc, not the chord', () => {
        const { totalTime } = estimate('G1 F600\nG2 X20 Y0 I10 J0', {
            maxRate: [FAST, FAST, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        // half circle of radius 10 at 10 mm/s (chords are ~0.002 mm inside the arc)
        expect(totalTime).toBeCloseTo(Math.PI, 2);
    });

    it('times R-format arcs and helical Z', () => {
        const { totalTime } = estimate('G1 F600\nG3 X20 Y0 Z-10 R10', {
            maxRate: [FAST, FAST, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        expect(totalTime).toBeCloseTo(Math.hypot(Math.PI * 10, 10) / 10, 2);
    });

    it('supports inverse time feed (G93)', () => {
        const { totalTime } = estimate('G93 G1 X10 F2', {
            maxRate: [FAST, FAST, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        expect(totalTime).toBeCloseTo(30, 3);
    });

    it('converts inch feeds and distances', () => {
        const { totalTime } = estimate('G20\nG1 X1 F10', {
            maxRate: [FAST, FAST, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        expect(totalTime).toBeCloseTo(6, 3);
    });

    it('treats G4 P as seconds and marks it as fixed time', () => {
        const { totalTime, lineKind } = estimate('G4 P2', base);
        expect(totalTime).toBeCloseTo(2, 6);
        expect(lineKind[0]).toBe(LINE_KIND_FIXED);
    });

    it('adds tool change time only when ATC time is configured', () => {
        expect(estimate('M6 T1', base).totalTime).toBe(0);
        expect(
            estimate('M6 T1', { ...base, toolChangeTime: 45 }).totalTime,
        ).toBeCloseTo(45, 6);
    });

    it('stops at spindle changes but not in laser mode', () => {
        const gcode = 'G1 X50 F6000\nM3 S1000\nG1 X100';
        const milled = estimate(gcode, base).totalTime;
        const lasered = estimate(gcode, { ...base, laserMode: true }).totalTime;
        expect(lasered).toBeCloseTo(1.2, 3);
        expect(milled).toBeGreaterThan(lasered + 0.1);
    });

    describe('A axis', () => {
        const unlimited = {
            maxRate: [FAST, FAST, FAST, FAST] as [
                number,
                number,
                number,
                number,
            ],
            accel: [FAST, FAST, FAST, FAST] as [number, number, number, number],
        };

        it('runs pure rotary moves in degrees/min', () => {
            expect(estimate('G1 A360 F3600', unlimited).totalTime).toBeCloseTo(
                6,
                3,
            );
        });

        it('uses Y limits when grbl remaps A to Y', () => {
            const { totalTime } = estimate('G0 A360', {
                ...unlimited,
                maxRate: [FAST, 3600, FAST, 600],
                aUsesYLimits: true,
            });
            expect(totalTime).toBeCloseTo(6, 3);
        });

        it('applies F to the combined vector by default', () => {
            const { totalTime } = estimate('G1 X10 A360 F600', unlimited);
            expect(totalTime).toBeCloseTo(Math.hypot(10, 360) / 10, 3);
        });

        it('applies F to the linear axes with the grblHAL rotary fix', () => {
            const { totalTime } = estimate('G1 X10 A360 F600', {
                ...unlimited,
                firmware: 'grblHAL',
                rotaryFix: true,
            });
            expect(totalTime).toBeCloseTo(1, 3);
        });
    });

    it('models serial starvation on dense files', () => {
        const lines = ['G1 F6000'];
        for (let i = 1; i <= 1000; i++) {
            lines.push(`G1 X${(i * 0.1).toFixed(4)} Y0.0000 Z0.0000`);
        }
        const gcode = lines.join('\n');
        const config = {
            maxRate: [FAST, FAST, FAST, FAST] as [
                number,
                number,
                number,
                number,
            ],
            accel: [FAST, FAST, FAST, FAST] as [number, number, number, number],
        };
        const unlimited = estimate(gcode, config).totalTime;
        const serial = estimate(gcode, {
            ...config,
            serialBytesPerSecond: 11520,
        }).totalTime;
        expect(unlimited).toBeCloseTo(1, 2);
        // 28 bytes per line at 11520 B/s is ~2.4 ms per 1 ms move
        expect(serial).toBeCloseTo((1000 * 28) / 11520, 1);
    });
});

describe('sender line alignment', () => {
    it('gives every line Sender streams exactly one time slot', () => {
        const gcode = [
            '(header comment)',
            '',
            'G21 G90',
            '   ',
            '; semicolon comment',
            'G0 X10',
            '',
            'G1 X20 F600 (inline comment)',
            '%',
            'G4 P1',
            'M30',
            '',
        ].join('\n');
        const { lineTime, lineKind } = estimate(gcode);
        const kept = senderLines(gcode);
        expect(lineTime.length).toBe(kept.length);

        const indexOf = (text: string) =>
            kept.findIndex((line) => line.startsWith(text));
        expect(lineKind[indexOf('(header')]).toBe(LINE_KIND_NONE);
        expect(lineKind[indexOf('G0 X10')]).toBe(LINE_KIND_RAPID);
        expect(lineKind[indexOf('G1 X20')]).toBe(LINE_KIND_FEED);
        expect(lineTime[indexOf('G1 X20')]).toBeGreaterThan(0.9);
        expect(lineTime[indexOf('G4')]).toBeCloseTo(1, 6);
        expect(lineTime[indexOf('M30')]).toBe(0);
    });

    it('keeps all time from multiple motion groups on one line', () => {
        const { lineTime } = estimate('G0 X10 G1 Y10 F600\nG1 X0', {
            maxRate: [FAST, FAST, FAST, FAST],
            accel: [FAST, FAST, FAST, FAST],
        });
        expect(lineTime.length).toBe(2);
    });
});
