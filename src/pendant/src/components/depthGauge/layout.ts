// Layout for the pendant's Z depth gauge (the "slim rail" design). Pure, so it
// can be tested without React or the store.
//
// Positions are laid out in work Z. When homed, the rail spans the machine's
// whole Z travel, from machine 0 (top) down to -$132, shifted into work Z by
// the work offset. That is the same frame as a machine-Z rail, just labelled
// with the numbers the operator zeroed against. When not homed, machine Z is
// unknown, so the rail just frames the job and the current Z.

export type DepthGaugeInput = {
    /** Gauge height in px. */
    height: number;
    homed: boolean;
    /** $132 max Z travel, mm. Ignored unless homed. */
    travel: number | null;
    /** Current work Z (wpos.z), mm. */
    workZ: number;
    /** Work coordinate offset Z (wco.z = mpos.z - wpos.z), mm. */
    wcoZ: number;
    /** Toolpath Z extent in work Z, or null with no file. */
    job: { top: number; bottom: number } | null;
};

export type DepthGaugeLabel = { top: number; text: string };

export type DepthGaugeLayout = {
    /** Not homed: the travel ends are unknown, so the rail is drawn dimmed. */
    dimmed: boolean;
    track: { top: number; height: number };
    ticks: number[];
    ends: { top: DepthGaugeLabel; bottom: DepthGaugeLabel } | null;
    job: {
        top: number;
        height: number;
        topLabel: DepthGaugeLabel | null;
        bottomLabel: DepthGaugeLabel | null;
    } | null;
    current: { line: number; chip: number; text: string };
};

export const GAUGE_MARGIN = 30;
const TICK_STEP = 10;
// A job label within this many px of the current-Z chip is hidden.
const LABEL_CLEARANCE = 18;
const CHIP_HALF = 14;
const LABEL_HALF = 8;

/** Signed, fixed-point, with a true minus sign; -0.00 prints as 0.00. */
export function formatZ(z: number, decimals: number): string {
    const s = Math.abs(z).toFixed(decimals);
    if (Number(s) === 0) return (0).toFixed(decimals);
    return (z < 0 ? '−' : '+') + s;
}

function railRange(input: DepthGaugeInput): { top: number; bottom: number } {
    const travel = Math.abs(input.travel ?? 0);
    if (input.homed && travel > 0) {
        return { top: 0 - input.wcoZ, bottom: -travel - input.wcoZ };
    }
    const hi = input.job ? Math.max(input.job.top, input.workZ) : input.workZ;
    const lo = input.job ? Math.min(input.job.bottom, input.workZ) : input.workZ;
    const pad = Math.max(2, (hi - lo) * 0.15);
    return { top: hi + pad, bottom: lo - pad };
}

export function layoutDepthGauge(input: DepthGaugeInput): DepthGaugeLayout {
    const dimmed = !(input.homed && Math.abs(input.travel ?? 0) > 0);
    const { top: T, bottom: B } = railRange(input);
    const H = Math.max(1, input.height - GAUGE_MARGIN * 2);
    const span = Math.max(1e-6, T - B);
    const clamp = (z: number) => Math.min(T, Math.max(B, z));
    const y = (z: number) => GAUGE_MARGIN + ((T - clamp(z)) / span) * H;

    const yT = y(T);
    const yB = y(B);
    const yc = y(input.workZ);

    const ticks: number[] = [];
    if (!dimmed) {
        for (let k = Math.ceil(B / TICK_STEP); k <= Math.floor(T / TICK_STEP); k++) {
            ticks.push(y(k * TICK_STEP) - 0.5);
        }
    }

    let job: DepthGaugeLayout['job'] = null;
    if (input.job) {
        const jt = clamp(Math.max(input.job.top, input.job.bottom));
        const jb = clamp(Math.min(input.job.top, input.job.bottom));
        const yJT = y(jt);
        const yJB = y(jb);
        job = {
            top: yJT - 1,
            height: Math.max(4, yJB - yJT + 2),
            topLabel:
                Math.abs(yc - yJT) > LABEL_CLEARANCE
                    ? { top: yJT - LABEL_HALF, text: formatZ(input.job.top, 1) }
                    : null,
            bottomLabel:
                Math.abs(yc - yJB) > LABEL_CLEARANCE
                    ? { top: yJB - LABEL_HALF, text: formatZ(input.job.bottom, 1) }
                    : null,
        };
    }

    return {
        dimmed,
        track: { top: yT - 2, height: yB - yT + 4 },
        ticks,
        ends: dimmed
            ? null
            : {
                  top: { top: yT - 24, text: formatZ(T, 0) },
                  bottom: { top: yB + 8, text: formatZ(B, 0) },
              },
        job,
        current: { line: yc - 1, chip: yc - CHIP_HALF, text: formatZ(input.workZ, 2) },
    };
}
