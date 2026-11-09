import { formatZ, GAUGE_MARGIN, layoutDepthGauge } from '../layout';

const base = {
    height: 260,
    homed: true,
    travel: 100,
    workZ: 0,
    wcoZ: -40,
    job: null,
};
// Rail spans 200 px (260 - 2 * 30): 2 px per mm over 100 mm of travel.
const yFor = (machineZ: number) => GAUGE_MARGIN + (0 - machineZ) * 2;

describe('formatZ', () => {
    it('signs values with a true minus and drops negative zero', () => {
        expect(formatZ(-6.35, 2)).toBe('−6.35');
        expect(formatZ(5, 1)).toBe('+5.0');
        expect(formatZ(-0.001, 2)).toBe('0.00');
    });
});

describe('layoutDepthGauge when homed', () => {
    it('spans machine travel and labels the ends in work Z', () => {
        const layout = layoutDepthGauge(base);
        expect(layout.dimmed).toBe(false);
        // Machine 0 is work +40; machine -100 is work -60.
        expect(layout.ends?.top.text).toBe('+40');
        expect(layout.ends?.bottom.text).toBe('−60');
        expect(layout.track.top).toBeCloseTo(yFor(0) - 2);
        expect(layout.track.height).toBeCloseTo(200 + 4);
    });

    it('places the current Z at its machine position and labels it in work Z', () => {
        // Work 0 with wco -40 is machine -40.
        const layout = layoutDepthGauge(base);
        expect(layout.current.line).toBeCloseTo(yFor(-40) - 1);
        expect(layout.current.text).toBe('0.00');
    });

    it('converts the job band to machine Z with the work offset', () => {
        const layout = layoutDepthGauge({
            ...base,
            workZ: 20,
            job: { top: 5, bottom: -12.7 },
        });
        // Work +5 / -12.7 sit at machine -35 / -52.7.
        expect(layout.job?.top).toBeCloseTo(yFor(-35) - 1);
        expect(layout.job?.height).toBeCloseTo(yFor(-52.7) - yFor(-35) + 2);
        expect(layout.job?.topLabel?.text).toBe('+5.0');
        expect(layout.job?.bottomLabel?.text).toBe('−12.7');
    });

    it('ticks every 10 mm of work Z inside the rail', () => {
        const layout = layoutDepthGauge(base);
        // Work +40 down to -60.
        expect(layout.ticks).toHaveLength(11);
    });

    it('hides a job label that would collide with the chip', () => {
        const layout = layoutDepthGauge({
            ...base,
            workZ: 5,
            job: { top: 5, bottom: -12.7 },
        });
        expect(layout.job?.topLabel).toBeNull();
        expect(layout.job?.bottomLabel).not.toBeNull();
    });

    it('pins a Z outside travel to the rail end but keeps its real value', () => {
        const layout = layoutDepthGauge({ ...base, workZ: 55 });
        expect(layout.current.line).toBeCloseTo(yFor(0) - 1);
        expect(layout.current.text).toBe('+55.00');
    });
});

describe('layoutDepthGauge when not homed', () => {
    it('dims the rail and drops ends and ticks', () => {
        const layout = layoutDepthGauge({
            ...base,
            homed: false,
            job: { top: 5, bottom: -12.7 },
        });
        expect(layout.dimmed).toBe(true);
        expect(layout.ends).toBeNull();
        expect(layout.ticks).toHaveLength(0);
    });

    it('frames the job and current Z instead of machine travel', () => {
        const layout = layoutDepthGauge({
            ...base,
            homed: false,
            workZ: 10,
            job: { top: 5, bottom: -12.7 },
        });
        const railTop = layout.track.top + 2;
        const railBottom = railTop + layout.track.height - 4;
        expect(layout.current.line + 1).toBeGreaterThan(railTop);
        expect(layout.job!.top + layout.job!.height - 1).toBeLessThan(railBottom);
    });

    it('treats a missing $132 like not homed', () => {
        expect(layoutDepthGauge({ ...base, travel: null }).dimmed).toBe(true);
    });

    it('shows only the current Z with no file', () => {
        const layout = layoutDepthGauge({ ...base, homed: false });
        expect(layout.job).toBeNull();
        expect(layout.current.text).toBe('0.00');
    });
});
