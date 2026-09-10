import JogStreamer, {
	ASSUMED_ACCEL,
	computeSegmentPlan,
	DEFAULT_FEEDRATE,
	DT_MIN,
	JOG_STATE_DRAINING,
	JOG_STATE_IDLE,
	JOG_STATE_STREAMING,
	MAX_SEGMENT_RATE_HZ,
	MAX_STREAM_DURATION_MS,
	MIN_SEGMENT_MM,
	RX_MARGIN_BYTES,
	T_LOOK_MAX,
} from "../JogStreamer";

const SETTINGS = {
	$13: "0",
	$20: "0",
	$23: "0",
	$110: "10000",
	$111: "10000",
	$112: "3000",
	$120: "500",
	$121: "500",
	$122: "200",
	$130: "500",
	$131: "400",
	$132: "100",
};

// A deterministic clock and scheduler, so tests describe elapsed time rather
// than depending on real timers.
class FakeClock {
	constructor() {
		this.time = 0;
		this.intervals = new Set();
	}
	now = () => this.time;
	setInterval = (fn, ms) => {
		const handle = { fn, ms, next: this.time + ms };
		this.intervals.add(handle);
		return handle;
	};
	clearInterval = (handle) => {
		this.intervals.delete(handle);
	};
	advance(ms, step = 1) {
		const target = this.time + ms;
		while (this.time < target) {
			this.time = Math.min(this.time + step, target);
			[...this.intervals].forEach((handle) => {
				while (handle.next <= this.time && this.intervals.has(handle)) {
					handle.next += handle.ms;
					handle.fn();
				}
			});
		}
	}
}

const parseLine = (line) => {
	const axes = {};
	const body = line.trim().replace("$J=G21G91", "");
	const re = /([XYZAF])(-?\d+(?:\.\d+)?)/g;
	let match = re.exec(body);
	while (match) {
		axes[match[1]] = Number(match[2]);
		match = re.exec(body);
	}
	return axes;
};

const build = (overrides = {}) => {
	const clock = new FakeClock();
	const lines = [];
	const streamer = new JogStreamer({
		write: (line) => lines.push(line),
		getSettings: () => overrides.settings || SETTINGS,
		getStatus: () =>
			overrides.status || { activeState: "Jog", mpos: { x: 0, y: 0, z: 0 } },
		canStream: overrides.canStream || (() => true),
		getHomingFlag: () => false,
		now: clock.now,
		setIntervalFn: clock.setInterval,
		clearIntervalFn: clock.clearInterval,
		...overrides.options,
	});
	// Acknowledge everything immediately unless a test says otherwise.
	if (!overrides.withholdAcks) {
		streamer.on("segment", () => {});
	}
	return { clock, lines, streamer };
};

// Drive the stream, acking each line as soon as it is written.
const runAcked = ({ streamer, clock, lines }, ms) => {
	const seen = () => lines.length;
	let acked = 0;
	const step = () => {
		while (acked < seen()) {
			acked += 1;
			streamer.ack();
		}
	};
	step();
	for (let elapsed = 0; elapsed < ms; elapsed += 1) {
		clock.advance(1);
		step();
	}
};

const totalDistance = (lines, axis) =>
	lines.reduce((sum, line) => sum + (parseLine(line)[axis] || 0), 0);

// The stream deliberately keeps tLook seconds of motion queued ahead of the
// wall clock, so commanded distance always leads elapsed distance by this much.
const leadDistance = (streamer) =>
	(streamer.plan.tLook * streamer.plan.feedrate) / 60;

describe("computeSegmentPlan", () => {
	const accelByAxis = { X: 500, Y: 500, Z: 200 };
	const maxRateByAxis = { X: 10000, Y: 10000, Z: 3000 };

	it("keeps the queued lookahead longer than the deceleration it must cover", () => {
		const plan = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 3000,
			accelByAxis,
			maxRateByAxis,
		});
		expect(plan.inflight * plan.dt).toBeGreaterThanOrEqual(plan.requiredLook);
		expect(plan.starved).toBe(false);
	});

	it("asks for a longer lookahead when acceleration is low", () => {
		const slow = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 6000,
			accelByAxis: { X: 50 },
			maxRateByAxis,
		});
		const fast = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 6000,
			accelByAxis: { X: 2000 },
			maxRateByAxis,
		});
		expect(slow.requiredLook).toBeGreaterThan(fast.requiredLook);
	});

	it("flags the case where no reachable queue depth can hold the speed", () => {
		const plan = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 10000,
			accelByAxis: { X: 100 },
			maxRateByAxis,
		});
		expect(plan.requiredLook).toBeGreaterThan(T_LOOK_MAX);
		expect(plan.starved).toBe(true);
	});

	it("falls back to an assumed acceleration when the firmware reports none", () => {
		// A FluidNC board answers $$ in a dialect we don't parse, so the
		// settings map is empty.
		const plan = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 3000,
			accelByAxis: {},
			maxRateByAxis: {},
		});

		expect(plan.effectiveAccel).toBe(ASSUMED_ACCEL);
		expect(plan.accelReported).toBe(false);
		// Nothing to clamp against, so the requested speed stands.
		expect(plan.feedrate).toBe(3000);
	});

	it("does not let a silent axis read as infinitely capable", () => {
		// Y is missing. Skipping it used to drop its constraint entirely and
		// yield 707 on the diagonal - a more capable answer than knowing both
		// axes were 500, which is the wrong direction to be wrong in.
		const partial = computeSegmentPlan({
			dir: { X: 1, Y: 1 },
			feedrate: 3000,
			accelByAxis: { X: 500 },
			maxRateByAxis,
		});
		const known = computeSegmentPlan({
			dir: { X: 1, Y: 1 },
			feedrate: 3000,
			accelByAxis: { X: 500, Y: 500 },
			maxRateByAxis,
		});

		expect(partial.effectiveAccel).toBeLessThanOrEqual(known.effectiveAccel);
		expect(partial.accelReported).toBe(true);
	});

	it("never emits segments faster than the serial link can comfortably take", () => {
		const plan = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 10000,
			accelByAxis,
			maxRateByAxis,
		});
		expect(plan.dt).toBeGreaterThanOrEqual(1 / MAX_SEGMENT_RATE_HZ - 1e-9);
		expect(plan.dt).toBeGreaterThanOrEqual(DT_MIN - 1e-9);
	});

	it("widens dt at low feedrates so segments survive rounding", () => {
		const plan = computeSegmentPlan({
			dir: { X: 1 },
			feedrate: 6, // 0.1 mm/s
			accelByAxis,
			maxRateByAxis,
		});
		expect(plan.segmentLength).toBeGreaterThanOrEqual(MIN_SEGMENT_MM - 1e-9);
	});

	it("clamps a diagonal against whichever axis reaches its limit first", () => {
		const plan = computeSegmentPlan({
			dir: { X: 1, Y: 1 },
			feedrate: 10000,
			accelByAxis,
			maxRateByAxis: { X: 10000, Y: 1000 },
		});
		// Y can only take 1000 mm/min along its own axis, and on a 45 degree
		// move it receives 1/sqrt(2) of the vector feedrate.
		expect(plan.feedrate).toBeCloseTo(1000 * Math.SQRT2, 3);
	});

	it("clamps Z to its own much lower max rate", () => {
		const plan = computeSegmentPlan({
			dir: { Z: -1 },
			feedrate: 10000,
			accelByAxis,
			maxRateByAxis,
		});
		expect(plan.feedrate).toBe(3000);
	});
});

describe("JogStreamer velocity mode", () => {
	it("commands distance proportional to elapsed time", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 }); // 20 mm/s
		runAcked(ctx, 1000);

		const segment = ctx.streamer.plan.segmentLength;
		const lead = leadDistance(ctx.streamer);
		const total = totalDistance(ctx.lines, "X");
		expect(total).toBeGreaterThan(20 + lead - 2 * segment);
		expect(total).toBeLessThan(20 + lead + 2 * segment);
	});

	it("keeps a queue of motion ahead of the wall clock", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });

		// A stream paced at exactly 1x real time leaves grbl a single block and
		// it plans a stop at the end of it, which is what makes a jog stutter.
		// The queued motion must always outlast the deceleration it has to
		// cover, acks or no acks.
		const leads = [];
		for (let elapsed = 0; elapsed < 500; elapsed += 1) {
			ctx.clock.advance(1);
			while (ctx.streamer.ack()) {
				// grbl acks a jog line as soon as it parses it.
			}
			leads.push(ctx.streamer.emittedUntil - ctx.clock.time);
		}

		const required = ctx.streamer.plan.requiredLook * 1000;
		expect(Math.min(...leads)).toBeGreaterThan(required);
	});

	it("holds the same velocity at a very low feedrate", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 60 }); // 1 mm/s
		runAcked(ctx, 2000);

		const segment = ctx.streamer.plan.segmentLength;
		const lead = leadDistance(ctx.streamer);
		const total = totalDistance(ctx.lines, "X");
		expect(total).toBeGreaterThan(2 + lead - 2 * segment);
		expect(total).toBeLessThan(2 + lead + 2 * segment);
	});

	it("splits a diagonal evenly and keeps the vector magnitude", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1, Y: -1 }, feedrate: 1200 });
		runAcked(ctx, 1000);

		const x = totalDistance(ctx.lines, "X");
		const y = totalDistance(ctx.lines, "Y");
		expect(Math.abs(x)).toBeCloseTo(Math.abs(y), 1);
		expect(y).toBeLessThan(0);

		const segment = ctx.streamer.plan.segmentLength;
		const lead = leadDistance(ctx.streamer);
		const magnitude = Math.hypot(x, y);
		expect(magnitude).toBeGreaterThan(20 + lead - 2 * segment);
		expect(magnitude).toBeLessThan(20 + lead + 2 * segment);
	});

	it("carries sub-precision remainders instead of losing them", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 6 }); // 0.1 mm/s
		runAcked(ctx, 10000);

		// 10s at 0.1 mm/s, to within the one boundary segment the schedule can
		// legitimately include.
		const segment = ctx.streamer.plan.segmentLength;
		const lead = leadDistance(ctx.streamer);
		const total = totalDistance(ctx.lines, "X");
		expect(total).toBeGreaterThan(1 + lead - 2 * segment);
		expect(total).toBeLessThan(1 + lead + 2 * segment);
		ctx.lines.forEach((line) => {
			expect(parseLine(line).X).not.toBe(0);
		});
	});

	it("changes direction without a cancel and without stopping", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });
		runAcked(ctx, 200);
		const before = ctx.lines.length;

		ctx.streamer.update({ axes: { Y: 1 }, feedrate: 1200 });
		expect(ctx.streamer.state).toBe(JOG_STATE_STREAMING);

		runAcked(ctx, 200);
		expect(ctx.lines.length).toBeGreaterThan(before);
		expect(parseLine(ctx.lines[ctx.lines.length - 1]).Y).toBeGreaterThan(0);
		expect(parseLine(ctx.lines[ctx.lines.length - 1]).X).toBeUndefined();
	});

	it("keeps the current feedrate when a bad one arrives mid-stream", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });

		// A NaN feedrate from the joystick arrives over the socket as null.
		// Clamping it used to yield F1, which reads on the machine as a hang.
		ctx.streamer.update({ axes: { X: 1, Y: 1 }, feedrate: null });

		expect(ctx.streamer.plan.feedrate).toBe(1200);
		runAcked(ctx, 100);
		expect(parseLine(ctx.lines[ctx.lines.length - 1]).F).toBe(1200);
	});

	it("refuses to start at an unusable feedrate", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: null });

		expect(ctx.streamer.plan.feedrate).toBe(DEFAULT_FEEDRATE);
	});

	it("announces the jog it started, with the speed it settled on", () => {
		const ctx = build();
		const started = [];
		ctx.streamer.on("start", ({ summary }) => started.push(summary));

		ctx.streamer.start({ axes: { X: 1, Y: -1 }, feedrate: 1200 });

		expect(started).toEqual(["Jogging service started X+ Y- at F1200"]);
	});

	it("announces a speed change, but not faster than once a second", () => {
		const ctx = build();
		const changes = [];
		ctx.streamer.on("feedrate", ({ summary }) => changes.push(summary));

		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });

		// Same speed, and too soon after the start line: nothing to say.
		ctx.streamer.update({ axes: { X: 1 }, feedrate: 1200 });
		ctx.streamer.update({ axes: { X: 1 }, feedrate: 2400 });
		expect(changes).toEqual([]);

		// A joystick sweep past the interval announces once, at the speed it
		// was last given.
		ctx.clock.advance(1000);
		ctx.streamer.update({ axes: { X: 1 }, feedrate: 2400 });
		ctx.streamer.update({ axes: { X: 1 }, feedrate: 3000 });
		expect(changes).toEqual(["Jogging service now at F2400"]);
	});

	it("does not warn about acceleration the firmware never reported", () => {
		const warn = jest.fn();
		const ctx = build({ settings: {}, options: { log: { warn, debug() {} } } });

		// Fast enough that a 200 mm/s^2 machine could not hold it - but we only
		// assumed that figure, so it is not the operator's problem to hear about.
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 10000 });

		expect(ctx.streamer.plan.starved).toBe(true);
		expect(warn).not.toHaveBeenCalled();
	});

	it("warns when a reported acceleration genuinely cannot hold the speed", () => {
		const warn = jest.fn();
		const ctx = build({
			settings: { ...SETTINGS, $120: "50", $121: "50" },
			options: { log: { warn, debug() {} } },
		});

		ctx.streamer.start({ axes: { X: 1 }, feedrate: 10000 });

		expect(ctx.streamer.plan.starved).toBe(true);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("acceleration"));
	});

	it("applies the Z feedrate derate for parity with the old handlers", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { Z: -1 }, feedrate: 1000 });
		expect(parseLine(ctx.lines[0]).F).toBe(800);
	});
});

describe("JogStreamer backpressure", () => {
	it("never exceeds the receive buffer budget while acks are withheld", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 6000 });
		ctx.clock.advance(2000);

		expect(ctx.streamer.pendingBytes).toBeLessThanOrEqual(
			128 - RX_MARGIN_BYTES,
		);
	});

	it("does not burst catch-up motion once acks resume", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 }); // 20 mm/s

		// Stall for a second with nothing acknowledged...
		ctx.clock.advance(1000);
		const stalled = totalDistance(ctx.lines, "X");

		// ...then drain and run for another second.
		runAcked(ctx, 1000);
		const total = totalDistance(ctx.lines, "X");

		// The forfeited time must not reappear as extra distance.
		expect(total - stalled).toBeLessThan(
			20 + leadDistance(ctx.streamer) + ctx.streamer.plan.segmentLength,
		);
	});

	it("backs off when the firmware reports a nearly full planner", () => {
		const status = {
			activeState: "Jog",
			mpos: { x: 0, y: 0, z: 0 },
			buf: { planner: 1 },
		};
		const ctx = build({ status });
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });
		ctx.streamer.onStatus(status);

		const before = ctx.lines.length;
		runAcked(ctx, 500);
		expect(ctx.lines.length).toBe(before);
	});
});

describe("JogStreamer acks", () => {
	it("claims only its own outstanding lines", () => {
		const ctx = build();
		expect(ctx.streamer.ack()).toBe(false);

		// Starting primes the queue with a lead, so there is more than one line
		// outstanding straight away.
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });
		const primed = ctx.streamer.pending.length;
		expect(primed).toBeGreaterThan(1);
		for (let i = 0; i < primed; i += 1) {
			expect(ctx.streamer.ack()).toBe(true);
		}
		expect(ctx.streamer.ack()).toBe(false);
	});

	it("keeps absorbing acks after a stop, then goes idle", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 6000 });
		ctx.clock.advance(100);

		const outstanding = ctx.streamer.pending.length;
		expect(outstanding).toBeGreaterThan(0);

		ctx.streamer.stop();
		expect(ctx.streamer.state).toBe(JOG_STATE_DRAINING);

		for (let i = 0; i < outstanding; i += 1) {
			expect(ctx.streamer.ack()).toBe(true);
		}
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
		expect(ctx.streamer.ack()).toBe(false);
	});

	it("gives up on undelivered acks rather than blocking the feeder forever", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 6000 });
		ctx.clock.advance(100);
		ctx.streamer.stop();

		ctx.clock.advance(2000);
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
		expect(ctx.streamer.acksOrphaned).toBeGreaterThan(0);
	});
});

describe("JogStreamer travel limits", () => {
	const limited = {
		...SETTINGS,
		$20: "1",
		$130: "500",
	};

	it("stops at the soft limit and says so", () => {
		const ctx = build({
			settings: limited,
			status: { activeState: "Jog", mpos: { x: -495, y: 0, z: 0 } },
		});
		const onLimit = jest.fn();
		ctx.streamer.on("limit", onLimit);

		// Only 4mm of travel remain in the negative direction.
		ctx.streamer.start({ axes: { X: -1 }, feedrate: 1200 });
		runAcked(ctx, 2000);

		expect(onLimit).toHaveBeenCalled();
		expect(totalDistance(ctx.lines, "X")).toBeCloseTo(-4, 1);
	});

	it("runs indefinitely when soft limits are off", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 6000 });
		runAcked(ctx, 3000);
		expect(Math.abs(totalDistance(ctx.lines, "X"))).toBeGreaterThan(200);
		expect(ctx.streamer.state).toBe(JOG_STATE_STREAMING);
	});
});

describe("JogStreamer displacement mode", () => {
	it("blends successive pulses into one continuous stream", () => {
		const ctx = build();
		ctx.streamer.feed({ axes: { X: 5 }, feedrate: 1200 });
		runAcked(ctx, 100);
		expect(ctx.streamer.state).toBe(JOG_STATE_STREAMING);

		// A second pulse arriving mid-drain must not restart the motion.
		ctx.streamer.feed({ axes: { X: 5 }, feedrate: 1200 });
		runAcked(ctx, 1000);

		expect(totalDistance(ctx.lines, "X")).toBeCloseTo(10, 1);
	});

	it("idles once the wheel stops, without a jog cancel", () => {
		const ctx = build();
		const onDrained = jest.fn();
		ctx.streamer.on("drained", onDrained);

		ctx.streamer.feed({ axes: { X: 1 }, feedrate: 1200 });
		runAcked(ctx, 1000);

		expect(onDrained).toHaveBeenCalled();
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
		expect(totalDistance(ctx.lines, "X")).toBeCloseTo(1, 2);
	});

	it("discards the opposing remainder when the wheel reverses", () => {
		const ctx = build();
		ctx.streamer.feed({ axes: { X: 50 }, feedrate: 600 });
		runAcked(ctx, 50);

		ctx.streamer.feed({ axes: { X: -1 }, feedrate: 600 });
		expect(ctx.streamer.work.X).toBeCloseTo(-1, 3);
	});
});

describe("JogStreamer safety", () => {
	it("refuses to start when preconditions are not met", () => {
		const ctx = build({ canStream: () => false });
		expect(ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 })).toBe(false);
		expect(ctx.lines).toHaveLength(0);
	});

	it("aborts when preconditions fail mid-stream", () => {
		let allowed = true;
		const ctx = build({ canStream: () => allowed });
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });

		allowed = false;
		ctx.clock.advance(50);
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
	});

	it("aborts on an alarm", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });
		ctx.streamer.onStatus({ activeState: "Alarm" });
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
	});

	it("stops itself if nothing steers it", () => {
		const ctx = build();
		ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 });
		runAcked(ctx, MAX_STREAM_DURATION_MS + 100);
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
	});

	it("keeps streaming while acks it did not issue are outstanding is false", () => {
		// Standing in for the controller wiring: a jog is allowed whenever
		// nothing else is waiting on an ok, including while a job is paused for
		// a tool change.
		let feederOutstanding = false;
		const ctx = build({ canStream: () => !feederOutstanding });

		expect(ctx.streamer.start({ axes: { X: 1 }, feedrate: 1200 })).toBe(true);

		feederOutstanding = true;
		ctx.clock.advance(50);
		expect(ctx.streamer.state).toBe(JOG_STATE_IDLE);
	});

	it("ignores an update when nothing is streaming", () => {
		const ctx = build();
		expect(ctx.streamer.update({ axes: { X: 1 }, feedrate: 1200 })).toBe(false);
		expect(ctx.lines).toHaveLength(0);
	});
});
