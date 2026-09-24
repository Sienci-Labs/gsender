import Sender, { SP_TYPE_CHAR_COUNTING } from "../Sender";

jest.mock("../logger", () => () => ({
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	silly: jest.fn(),
}));

const FEED = 1;
const RAPID = 2;
const FIXED = 3;

const T0 = 1_000_000;

// Load a job, give it estimates and start streaming at T0
const startJob = (gcode, lineTime, lineKind) => {
	const sender = new Sender(SP_TYPE_CHAR_COUNTING, { bufferSize: 128 });
	sender.load("job.nc", gcode);
	sender.setEstimateData({
		lineTime: new Float32Array(lineTime).buffer,
		lineKind: new Uint8Array(lineKind).buffer,
	});
	sender.next();
	return sender;
};

const ackAll = (sender, count = sender.state.sent) => {
	while (sender.state.received < count) {
		sender.ack();
	}
	sender.next({ isOk: true });
};

// Status report `seconds` after T0
const report = (sender, seconds, status) =>
	sender.updateProgress(status, T0 + seconds * 1000);

describe("Sender execution playhead", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(T0);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test("small files don't count down as soon as they are buffered", () => {
		const sender = startJob("G1 X1\nG1 X2\nG1 X3", [10, 10, 10], [FEED, FEED, FEED]);
		ackAll(sender);
		expect(sender.state.received).toBe(3);
		expect(sender.state.remainingTime).toBe(30);
		expect(sender.toJSON().currentLineRunning).toBe(0);

		report(sender, 5, { activeState: "Run" });
		expect(sender.state.remainingTime).toBeCloseTo(25, 3);
		expect(sender.toJSON().currentLineRunning).toBe(0);

		report(sender, 12, { activeState: "Run" });
		expect(sender.state.remainingTime).toBeCloseTo(18, 3);
		expect(sender.toJSON().currentLineRunning).toBe(1);
	});

	test("time doesn't pass while held", () => {
		const sender = startJob("G1 X1\nG1 X2", [10, 10], [FEED, FEED]);
		ackAll(sender);
		report(sender, 4, { activeState: "Run" });
		report(sender, 60, { activeState: "Hold:0" });
		expect(sender.state.remainingTime).toBeCloseTo(16, 3);
		report(sender, 61, { activeState: "Run" });
		expect(sender.state.remainingTime).toBeCloseTo(15, 3);
	});

	test("the playhead can't pass the last acked line", () => {
		const sender = startJob("G1 X1\nG1 X2\nG1 X3", [10, 10, 10], [FEED, FEED, FEED]);
		ackAll(sender, 1);
		report(sender, 25, { activeState: "Run" });
		expect(sender.toJSON().currentLineRunning).toBe(1);
		expect(sender.state.remainingTime).toBeCloseTo(20, 3);
	});

	test("planner occupancy pulls a slow playhead forward", () => {
		const sender = startJob(
			"G1 X1\n(comment)\nG1 X2\nG1 X3",
			[10, 0, 10, 10],
			[FEED, 0, FEED, FEED],
		);
		// Learn the empty planner size (15 blocks available)
		report(sender, 0, { activeState: "Idle", buf: { planner: 15, rx: 128 } });
		ackAll(sender);
		// One block queued: only the last motion line can still be pending
		report(sender, 1, { activeState: "Run", buf: { planner: 14, rx: 128 } });
		expect(sender.toJSON().currentLineRunning).toBe(3);
		expect(sender.state.remainingTime).toBeCloseTo(10, 3);
	});

	test("comment lines don't count as queued planner blocks", () => {
		const sender = startJob(
			"G1 X1\nG1 X2\n(a)\n(b)\nG1 X3",
			[10, 10, 0, 0, 10],
			[FEED, FEED, 0, 0, FEED],
		);
		report(sender, 0, { activeState: "Idle", buf: { planner: 15, rx: 128 } });
		ackAll(sender);
		report(sender, 0.5, { activeState: "Run", buf: { planner: 13, rx: 128 } });
		// Lines 1 and 4 may both still be queued, so only line 0 must be done
		expect(sender.toJSON().currentLineRunning).toBe(1);
	});

	test("a single Idle report doesn't finish the job without buffer info", () => {
		const sender = startJob("G1 X1\nG1 X2", [10, 10], [FEED, FEED]);
		ackAll(sender);
		report(sender, 0.2, { activeState: "Idle" });
		expect(sender.state.remainingTime).toBe(20);
		report(sender, 0.4, { activeState: "Idle" });
		expect(sender.state.remainingTime).toBe(0);
		expect(sender.toJSON().currentLineRunning).toBe(2);
	});

	test("feed and rapid overrides scale their own lines only", () => {
		const sender = startJob(
			"G1 X1\nG0 X2\nG4 P5",
			[10, 10, 5],
			[FEED, RAPID, FIXED],
		);
		ackAll(sender);
		report(sender, 0, { activeState: "Run", ov: [200, 50, 100] });
		// 10/2 + 10/0.5 + 5
		expect(sender.state.remainingTime).toBeCloseTo(30, 3);
		// the feed line now runs at double speed
		report(sender, 4, { activeState: "Run" });
		expect(sender.state.remainingTime).toBeCloseTo(26, 3);
		expect(sender.toJSON().currentLineRunning).toBe(0);
		report(sender, 6, { activeState: "Run" });
		expect(sender.toJSON().currentLineRunning).toBe(1);
	});

	test("a stopped job stops the clocks", () => {
		const sender = startJob("G1 X1\nG1 X2", [10, 10], [FEED, FEED]);
		ackAll(sender, 1);
		report(sender, 3, { activeState: "Run" });
		sender.rewind(); // workflow stop
		const { remainingTime, elapsedTime } = sender.state;
		report(sender, 30, { activeState: "Run" });
		expect(sender.state.remainingTime).toBe(remainingTime);
		expect(sender.state.elapsedTime).toBe(elapsedTime);
	});

	test("the feed override command applies before a status report confirms it", () => {
		const sender = startJob("G1 X1", [10], [FEED]);
		sender.setOvF(50);
		expect(sender.state.remainingTime).toBeCloseTo(20, 3);
	});

	test("start from line counts earlier lines as done", () => {
		const sender = new Sender(SP_TYPE_CHAR_COUNTING, { bufferSize: 128 });
		sender.load("job.nc", "G1 X1\nG1 X2\nG1 X3");
		sender.setEstimateData({
			lineTime: new Float32Array([10, 10, 10]).buffer,
			lineKind: new Uint8Array([FEED, FEED, FEED]).buffer,
		});
		sender.setStartLine(2);
		sender.next({ startFromLine: true });
		expect(sender.state.remainingTime).toBeCloseTo(10, 3);
		expect(sender.toJSON().currentLineRunning).toBe(2);
	});

	test("line indexes skip blank lines of any line ending, like the estimator", () => {
		const sender = new Sender(SP_TYPE_CHAR_COUNTING, { bufferSize: 128 });
		sender.load("job.nc", "G1 X1\r\n\r\n  \rG1 X2\r(c)\n\nG1 X3");
		expect(sender.state.lines).toEqual(["G1 X1", "G1 X2", "(c)", "G1 X3"]);
	});

	test("accepts Node Buffers as socket.io delivers them", () => {
		const sender = new Sender(SP_TYPE_CHAR_COUNTING, { bufferSize: 128 });
		sender.load("job.nc", "G1 X1\nG1 X2");
		const times = Buffer.from(new Float32Array([1.5, 2.5]).buffer);
		// force an unaligned view into a larger pool, as Buffer pooling can
		const pooled = Buffer.concat([Buffer.alloc(3), times]).subarray(3);
		sender.setEstimateData({
			lineTime: pooled,
			lineKind: Buffer.from([FEED, RAPID]),
			estimatedTime: 4,
		});
		expect(Array.from(sender.lineTime)).toEqual([1.5, 2.5]);
		expect(sender.state.remainingTime).toBe(4);
	});
});
