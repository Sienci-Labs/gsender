/*
 * Streaming job time estimator modelled on the grbl / grblHAL motion planner.
 *
 * Moves are fed in file order and pushed through a rolling window the size of
 * the firmware planner buffer. A block's velocity profile is only fixed once the
 * window is full, which is when the firmware would start executing it with the
 * same lookahead - this is what slows dense short-segment toolpaths down the
 * same way the real machine does. Profiles use grbl's junction deviation
 * cornering model and per-axis rate/acceleration limits (plan_buffer_line).
 *
 * All time is attributed to the sender line index (non-blank lines only, as
 * Sender.load keeps them) so the server can map ack/execution progress to time.
 */

export const LINE_KIND_NONE = 0;
export const LINE_KIND_FEED = 1;
export const LINE_KIND_RAPID = 2;
export const LINE_KIND_FIXED = 3; // dwell / tool change - not scaled by overrides

export const MOTION_RAPID = 0;
export const MOTION_FEED = 1;

export type Firmware = 'grbl' | 'grblHAL';

export interface EstimatorConfig {
    firmware: Firmware;
    // X, Y, Z, A max rates in units/min ($110-$113)
    maxRate: [number, number, number, number];
    // X, Y, Z, A accelerations in units/sec^2 ($120-$123)
    accel: [number, number, number, number];
    junctionDeviation: number; // $11, mm
    arcTolerance: number; // $12, mm
    plannerBlocks: number; // usable planner blocks (lookahead window)
    // grbl without 4-axis firmware: gSender remaps A to Y, so A runs on Y's limits
    aUsesYLimits: boolean;
    // grblHAL $701 bit0 + A flagged rotary in $376: feed applies to the linear axes only
    rotaryFix: boolean;
    // grblHAL $701 bit1: pure rotary F is not inch-converted in G20
    rotaryRevertMetric: boolean;
    laserMode: boolean; // spindle changes don't sync the planner in laser mode
    toolChangeTime: number; // seconds added per M6 (ATC)
    spindleDelay: number; // seconds added when the spindle is turned on
    // serial throughput floor in bytes/sec (0 disables), models buffer starvation
    serialBytesPerSecond: number;
}

export interface EstimateResult {
    lineTime: Float32Array;
    lineKind: Uint8Array;
    totalTime: number;
}

const DEFAULT_MAX_RATE = 4000;
const DEFAULT_ACCEL = 750;
const MINIMUM_FEED_RATE = 1; // mm/min, from grbl config.h
const ARC_ANGULAR_TRAVEL_EPSILON = 5e-7;
const SOME_LARGE_VALUE = 1e38;

const positiveOr = (value: unknown, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const createEstimatorConfig = (
    partial: Partial<EstimatorConfig> = {},
): EstimatorConfig => {
    const firmware: Firmware =
        partial.firmware === 'grblHAL' ? 'grblHAL' : 'grbl';
    const maxRate = (partial.maxRate || []) as number[];
    const accel = (partial.accel || []) as number[];
    const config: EstimatorConfig = {
        firmware,
        maxRate: [
            positiveOr(maxRate[0], DEFAULT_MAX_RATE),
            positiveOr(maxRate[1], DEFAULT_MAX_RATE),
            positiveOr(maxRate[2], 3000),
            positiveOr(maxRate[3], 3000),
        ],
        accel: [
            positiveOr(accel[0], DEFAULT_ACCEL),
            positiveOr(accel[1], DEFAULT_ACCEL),
            positiveOr(accel[2], 500),
            positiveOr(accel[3], 500),
        ],
        junctionDeviation: positiveOr(partial.junctionDeviation, 0.01),
        arcTolerance: positiveOr(partial.arcTolerance, 0.002),
        plannerBlocks: Math.max(
            1,
            Math.round(
                positiveOr(
                    partial.plannerBlocks,
                    firmware === 'grblHAL' ? 34 : 15,
                ),
            ),
        ),
        aUsesYLimits: !!partial.aUsesYLimits,
        rotaryFix: firmware === 'grblHAL' && !!partial.rotaryFix,
        rotaryRevertMetric: !!partial.rotaryRevertMetric,
        laserMode: !!partial.laserMode,
        toolChangeTime: Math.max(0, Number(partial.toolChangeTime) || 0),
        spindleDelay: Math.max(0, Number(partial.spindleDelay) || 0),
        serialBytesPerSecond: Math.max(
            0,
            Number(partial.serialBytesPerSecond) || 0,
        ),
    };
    if (config.aUsesYLimits) {
        config.maxRate[3] = config.maxRate[1];
        config.accel[3] = config.accel[1];
    }
    return config;
};

/**
 * Time to traverse a block with a trapezoidal (or triangular) velocity profile.
 * Speeds are passed squared, as the planner stores them.
 */
export const trapezoidTime = (
    length: number,
    accel: number,
    entrySqr: number,
    exitSqr: number,
    nominalSqr: number,
): number => {
    if (length <= 0) {
        return 0;
    }
    const vi = Math.sqrt(entrySqr);
    const vf = Math.sqrt(exitSqr);
    const accelDist = (nominalSqr - entrySqr) / (2 * accel);
    const decelDist = (nominalSqr - exitSqr) / (2 * accel);
    if (accelDist + decelDist <= length) {
        const vn = Math.sqrt(nominalSqr);
        return (
            (vn - vi) / accel +
            (vn - vf) / accel +
            (length - accelDist - decelDist) / vn
        );
    }
    // Never reaches nominal speed: accelerate to a peak then decelerate.
    const peak = Math.max(
        Math.sqrt((2 * accel * length + entrySqr + exitSqr) / 2),
        vi,
        vf,
    );
    return (peak - vi) / accel + (peak - vf) / accel;
};

/** Upper bound on sender lines, used to size the output arrays up front. */
export const estimateLineCount = (content: string): number => {
    let count = 1;
    let idx = content.indexOf('\n');
    while (idx !== -1) {
        count++;
        idx = content.indexOf('\n', idx + 1);
    }
    return count;
};

export class MotionPlanner {
    config: EstimatorConfig;

    // --- per sender line output ---
    lineTime: Float32Array;

    lineKind: Uint8Array;

    lineBytes: Uint16Array;

    line = -1; // current sender line index

    // --- planner window (ring buffer) ---
    private cap: number;

    private head = 0; // index of oldest (executing) block

    private count = 0;

    private bLine: Int32Array;

    private bMm: Float64Array;

    private bAccel: Float64Array;

    private bNominalSqr: Float64Array;

    private bMaxEntrySqr: Float64Array;

    private bRevEntrySqr: Float64Array; // entry limit from reverse pass (window ends at rest)

    private bRapid: Uint8Array;

    private tailEntrySqr = 0; // fixed entry speed of the oldest block

    private hasPrev = false;

    private prevUnit = new Float64Array(4);

    private prevNominalSqr = 0;

    // scratch
    private unit = new Float64Array(4);

    private delta = new Float64Array(4);

    private junction = new Float64Array(4);

    private result: EstimateResult | null = null;

    constructor(config: Partial<EstimatorConfig> = {}, expectedLines = 1024) {
        this.config = createEstimatorConfig(config);
        const size = Math.max(16, expectedLines);
        this.lineTime = new Float32Array(size);
        this.lineKind = new Uint8Array(size);
        this.lineBytes = new Uint16Array(size);

        this.cap = this.config.plannerBlocks + 1;
        this.bLine = new Int32Array(this.cap);
        this.bMm = new Float64Array(this.cap);
        this.bAccel = new Float64Array(this.cap);
        this.bNominalSqr = new Float64Array(this.cap);
        this.bMaxEntrySqr = new Float64Array(this.cap);
        this.bRevEntrySqr = new Float64Array(this.cap);
        this.bRapid = new Uint8Array(this.cap);
    }

    /** Start a new (non-blank) sender line. `bytes` is what gets streamed for it. */
    beginLine(bytes = 0): void {
        this.line++;
        if (this.line >= this.lineTime.length) {
            this.grow();
        }
        this.lineBytes[this.line] = bytes > 65535 ? 65535 : bytes;
    }

    private grow(): void {
        const size = this.lineTime.length * 2;
        const time = new Float32Array(size);
        time.set(this.lineTime);
        this.lineTime = time;
        const kind = new Uint8Array(size);
        kind.set(this.lineKind);
        this.lineKind = kind;
        const bytes = new Uint16Array(size);
        bytes.set(this.lineBytes);
        this.lineBytes = bytes;
    }

    private currentLine(): number {
        if (this.line < 0) {
            this.beginLine(0);
        }
        return this.line;
    }

    private addTime(line: number, seconds: number, kind: number): void {
        this.lineTime[line] += seconds;
        const existing = this.lineKind[line];
        // feed wins over rapid wins over fixed when a line mixes them
        if (
            existing === LINE_KIND_NONE ||
            (kind === LINE_KIND_FEED && existing !== LINE_KIND_FEED) ||
            (kind === LINE_KIND_RAPID && existing === LINE_KIND_FIXED)
        ) {
            this.lineKind[line] = kind;
        }
    }

    /**
     * Linear move. Deltas are machine units: mm for XYZ, degrees for A.
     * `feed` is the raw programmed F word (units/min, or 1/min in inverse time).
     */
    addLinear(
        dx: number,
        dy: number,
        dz: number,
        da: number,
        motion: number,
        feed: number,
        imperial = false,
        inverseTime = false,
    ): void {
        const d = this.delta;
        d[0] = dx || 0;
        d[1] = dy || 0;
        d[2] = dz || 0;
        d[3] = da || 0;
        const rateScale = inverseTime ? 1 : imperial ? 25.4 : 1;
        this.addMove(
            this.currentLine(),
            d,
            motion,
            (Number(feed) || 0) * rateScale,
            inverseTime ? Number(feed) || 0 : 0,
            imperial,
        );
    }

    /**
     * Arc move, expanded into the same chords grbl's mc_arc() generates.
     * Positions are in plane order: [axis0, axis1, linear] with the machine
     * axis indices given by `axes`. `center` is absolute.
     */
    addArc(
        start: [number, number, number],
        end: [number, number, number],
        center: [number, number],
        clockwise: boolean,
        axes: [number, number, number],
        feed: number,
        imperial = false,
        inverseTime = false,
    ): void {
        const line = this.currentLine();
        const rAxis0 = start[0] - center[0];
        const rAxis1 = start[1] - center[1];
        const rtAxis0 = end[0] - center[0];
        const rtAxis1 = end[1] - center[1];
        const radius = Math.hypot(rAxis0, rAxis1);

        let angularTravel = Math.atan2(
            rAxis0 * rtAxis1 - rAxis1 * rtAxis0,
            rAxis0 * rtAxis0 + rAxis1 * rtAxis1,
        );
        if (clockwise) {
            if (angularTravel >= -ARC_ANGULAR_TRAVEL_EPSILON) {
                angularTravel -= 2 * Math.PI;
            }
        } else if (angularTravel <= ARC_ANGULAR_TRAVEL_EPSILON) {
            angularTravel += 2 * Math.PI;
        }

        const feedRaw = Number(feed) || 0;
        const rate = inverseTime ? 0 : feedRaw * (imperial ? 25.4 : 1);
        const tol = this.config.arcTolerance;
        const segDenominator = Math.sqrt(tol * (2 * radius - tol));
        let segments =
            radius > 0 && segDenominator > 0
                ? Math.floor(
                      Math.abs(0.5 * angularTravel * radius) / segDenominator,
                  )
                : 0;
        if (!Number.isFinite(segments) || segments < 1) {
            segments = 1;
        }
        // In inverse time the whole arc takes 1/F minutes, so each chord takes 1/(F*segments).
        const inverseFeed = inverseTime ? feedRaw * segments : 0;

        const thetaPerSegment = angularTravel / segments;
        const linearPerSegment = (end[2] - start[2]) / segments;
        const d = this.delta;
        let prev0 = start[0];
        let prev1 = start[1];
        for (let i = 1; i <= segments; i++) {
            let p0: number;
            let p1: number;
            if (i === segments) {
                p0 = end[0];
                p1 = end[1];
            } else {
                const theta = thetaPerSegment * i;
                const cos = Math.cos(theta);
                const sin = Math.sin(theta);
                p0 = center[0] + rAxis0 * cos - rAxis1 * sin;
                p1 = center[1] + rAxis0 * sin + rAxis1 * cos;
            }
            d[0] = 0;
            d[1] = 0;
            d[2] = 0;
            d[3] = 0;
            d[axes[0]] = p0 - prev0;
            d[axes[1]] = p1 - prev1;
            d[axes[2]] = linearPerSegment;
            prev0 = p0;
            prev1 = p1;
            this.addMove(line, d, MOTION_FEED, rate, inverseFeed, imperial);
        }
    }

    /** Planner sync (buffer drains to a full stop), plus optional fixed time. */
    addSync(seconds = 0): void {
        const line = this.currentLine();
        this.drain();
        if (seconds > 0) {
            this.addTime(line, seconds, LINE_KIND_FIXED);
        }
    }

    addDwell(seconds: number): void {
        this.addSync(Math.max(0, Number(seconds) || 0));
    }

    addToolChange(): void {
        this.addSync(this.config.toolChangeTime);
    }

    addSpindleStart(): void {
        this.addSync(this.config.spindleDelay);
    }

    private addMove(
        line: number,
        d: Float64Array,
        motion: number,
        rateMmPerMin: number,
        inverseFeed: number,
        imperial: boolean,
    ): void {
        const mm = Math.sqrt(
            d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + d[3] * d[3],
        );
        if (!(mm > 1e-9)) {
            return; // grbl discards zero-length blocks
        }

        const { maxRate, accel: axisAccel } = this.config;
        const u = this.unit;
        let accel = SOME_LARGE_VALUE;
        let rapidRate = SOME_LARGE_VALUE;
        for (let i = 0; i < 4; i++) {
            u[i] = d[i] / mm;
            if (u[i] !== 0) {
                const inv = 1 / Math.abs(u[i]);
                const a = axisAccel[i] * inv;
                const r = maxRate[i] * inv;
                if (a < accel) accel = a;
                if (r < rapidRate) rapidRate = r;
            }
        }

        let rate: number; // mm/min
        const isRapid = motion === MOTION_RAPID;
        if (isRapid) {
            rate = rapidRate;
        } else {
            if (inverseFeed > 0) {
                rate = inverseFeed * mm;
            } else if (this.config.rotaryFix && d[3] !== 0) {
                // grblHAL rotary fix: F applies to the linear component only
                const linear = Math.sqrt(
                    d[0] * d[0] + d[1] * d[1] + d[2] * d[2],
                );
                if (linear > 1e-9) {
                    rate = (rateMmPerMin * mm) / linear;
                } else if (imperial && this.config.rotaryRevertMetric) {
                    rate = rateMmPerMin / 25.4;
                } else {
                    rate = rateMmPerMin;
                }
            } else {
                rate = rateMmPerMin;
            }
            if (!(rate >= MINIMUM_FEED_RATE)) {
                rate = MINIMUM_FEED_RATE;
            }
            if (rate > rapidRate) {
                rate = rapidRate;
            }
        }

        const nominal = rate / 60; // mm/s
        const nominalSqr = nominal * nominal;

        // Junction speed with the previous block (grbl junction deviation).
        let maxEntrySqr = 0;
        if (this.hasPrev) {
            const pu = this.prevUnit;
            const ju = this.junction;
            let cosTheta = 0;
            for (let i = 0; i < 4; i++) {
                cosTheta -= pu[i] * u[i];
                ju[i] = u[i] - pu[i];
            }
            let junctionSqr: number;
            if (cosTheta > 0.999999) {
                junctionSqr = 0; // full reversal
            } else if (cosTheta < -0.999999) {
                junctionSqr = SOME_LARGE_VALUE; // straight through
            } else {
                const jl = Math.sqrt(
                    ju[0] * ju[0] +
                        ju[1] * ju[1] +
                        ju[2] * ju[2] +
                        ju[3] * ju[3],
                );
                let junctionAccel = SOME_LARGE_VALUE;
                for (let i = 0; i < 4; i++) {
                    if (ju[i] !== 0) {
                        const a = axisAccel[i] / Math.abs(ju[i] / jl);
                        if (a < junctionAccel) junctionAccel = a;
                    }
                }
                const sinThetaD2 = Math.sqrt(0.5 * (1 - cosTheta));
                junctionSqr =
                    (junctionAccel *
                        this.config.junctionDeviation *
                        sinThetaD2) /
                    (1 - sinThetaD2);
            }
            maxEntrySqr = Math.min(
                junctionSqr,
                nominalSqr,
                this.prevNominalSqr,
            );
        }

        this.prevUnit.set(u);
        this.prevNominalSqr = nominalSqr;
        this.hasPrev = true;

        // Push into the window.
        const idx = (this.head + this.count) % this.cap;
        this.bLine[idx] = line;
        this.bMm[idx] = mm;
        this.bAccel[idx] = accel;
        this.bNominalSqr[idx] = nominalSqr;
        this.bMaxEntrySqr[idx] = maxEntrySqr;
        this.bRapid[idx] = isRapid ? 1 : 0;
        this.bRevEntrySqr[idx] = Math.min(maxEntrySqr, 2 * accel * mm);
        this.count++;

        // Reverse pass: newest block must be able to stop; propagate backwards
        // until an entry speed stops changing (same early-exit as grbl).
        let next = idx;
        for (let k = this.count - 2; k >= 1; k--) {
            const i = (this.head + k) % this.cap;
            const v = Math.min(
                this.bMaxEntrySqr[i],
                this.bRevEntrySqr[next] + 2 * this.bAccel[i] * this.bMm[i],
            );
            if (v === this.bRevEntrySqr[i]) {
                break;
            }
            this.bRevEntrySqr[i] = v;
            next = i;
        }

        if (this.count >= this.config.plannerBlocks) {
            this.finalizeOldest();
        }
    }

    /** Execute the oldest block with the lookahead currently in the window. */
    private finalizeOldest(): void {
        const i = this.head;
        const mm = this.bMm[i];
        const accel = this.bAccel[i];
        const entrySqr = this.tailEntrySqr;
        let exitSqr = 0;
        if (this.count > 1) {
            const n = (i + 1) % this.cap;
            exitSqr = Math.min(this.bRevEntrySqr[n], entrySqr + 2 * accel * mm);
        }
        const time = trapezoidTime(
            mm,
            accel,
            entrySqr,
            exitSqr,
            this.bNominalSqr[i],
        );
        this.addTime(
            this.bLine[i],
            time,
            this.bRapid[i] ? LINE_KIND_RAPID : LINE_KIND_FEED,
        );

        this.tailEntrySqr = exitSqr;
        this.head = (i + 1) % this.cap;
        this.count--;
        if (this.count > 0) {
            // the next block's entry is now fixed
            this.bRevEntrySqr[this.head] = exitSqr;
        }
    }

    private drain(): void {
        while (this.count > 0) {
            this.finalizeOldest();
        }
        this.tailEntrySqr = 0;
        this.hasPrev = false;
        this.prevNominalSqr = 0;
    }

    /** Flush the planner and return per-line times. Idempotent. */
    finish(): EstimateResult {
        if (this.result) {
            return this.result;
        }
        this.drain();
        const lines = this.line + 1;
        const lineTime = this.lineTime.slice(0, lines);
        const lineKind = this.lineKind.slice(0, lines);

        const bps = this.config.serialBytesPerSecond;
        if (bps > 0) {
            this.applySerialThroughput(lineTime, bps);
        }

        let total = 0;
        for (let i = 0; i < lines; i++) {
            total += lineTime[i];
        }
        this.result = { lineTime, lineKind, totalTime: total };
        return this.result;
    }

    /**
     * Queue model of streaming over a slow serial link: a line can't start
     * until its bytes have arrived, and bytes can't be sent until the line
     * `plannerBlocks` earlier has completed (buffer slot free).
     */
    private applySerialThroughput(lineTime: Float32Array, bps: number): void {
        const window = this.config.plannerBlocks;
        const completions = new Float64Array(window);
        let arrival = 0;
        let completion = 0;
        for (let i = 0; i < lineTime.length; i++) {
            const bytes = this.lineBytes[i];
            if (bytes > 0) {
                if (i >= window) {
                    const slotFree = completions[i % window];
                    if (slotFree > arrival) arrival = slotFree;
                }
                arrival += (bytes + 1) / bps;
            }
            const start = completion > arrival ? completion : arrival;
            const done = start + lineTime[i];
            lineTime[i] = done - completion;
            completion = done;
            completions[i % window] = done;
        }
    }
}

export default MotionPlanner;
