// The runner pulls in src/server/lib/logger, which can't be built under test
// (see grblRunner.test.js). Stub it - these tests are about parsing and state.
jest.mock("../../../lib/logger", () => {
	const noop = () => {};
	const log = {
		silly: noop,
		debug: noop,
		verbose: noop,
		info: noop,
		warn: noop,
		error: noop,
	};
	return { __esModule: true, default: () => log };
});

import GrblHalRunner from "../GrblHalRunner";
import { getProbeContinuity } from "../GrblHalProbeContinuity";

const NONE = { probe: false, tls: false, altProbe: false };

describe("getProbeContinuity", () => {
	test.each([
		["I", { probe: true }],
		["PI", { probe: true }],
		["i", { probe: false }],
		["J", { tls: true }],
		["k", { altProbe: false }],
		["XPZJ", { tls: true }],
		["Ijk", { probe: true, tls: false, altProbe: false }],
		["", {}],
		["P", {}],
	])("%s", (pins, expected) => {
		expect(getProbeContinuity(pins)).toEqual(expected);
	});
});

describe("GrblHalRunner probe continuity", () => {
	test("defaults to no continuity", () => {
		expect(new GrblHalRunner().state.status.probe.continuity).toEqual(NONE);
	});

	test("capital persists across reports until the lowercase letter clears it", () => {
		const runner = new GrblHalRunner();

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:J>");
		expect(runner.state.status.probe.continuity).toEqual({ ...NONE, tls: true });

		// Reports without the letter leave it alone
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0>");
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:P>");
		expect(runner.state.status.probe.continuity).toEqual({ ...NONE, tls: true });

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:j>");
		expect(runner.state.status.probe.continuity).toEqual(NONE);
	});

	test("complete (0x87) report sets continuity that survives regular reports", () => {
		const runner = new GrblHalRunner();

		runner.parse(
			"<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:I|WCO:0.000,0.000,0.000|FW:grblHAL>",
		);
		expect(runner.state.status.probe.continuity).toEqual({ ...NONE, probe: true });

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0>");
		expect(runner.state.status.probe.continuity).toEqual({ ...NONE, probe: true });

		runner.parse(
			"<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:i|FW:grblHAL>",
		);
		expect(runner.state.status.probe.continuity).toEqual(NONE);
	});

	test("continuity lives alongside probe type/protected and both persist", () => {
		const runner = new GrblHalRunner();

		runner.parse(
			"<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:J|P:1,P|FW:grblHAL>",
		);
		expect(runner.state.status.probe).toEqual({
			type: 1,
			protected: true,
			continuity: { ...NONE, tls: true },
		});

		// A P: without I/J/K keeps continuity; I/J/K without P: keeps type/protected
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|P:0>");
		expect(runner.state.status.probe).toEqual({
			type: 0,
			protected: false,
			continuity: { ...NONE, tls: true },
		});
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:jI>");
		expect(runner.state.status.probe).toEqual({
			type: 0,
			protected: false,
			continuity: { ...NONE, probe: true },
		});
	});

	test("complete report fields after FW:grblHAL are parsed", () => {
		const runner = new GrblHalRunner();

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|FW:grblHAL|Pn:K>");
		expect(runner.state.status.probe.continuity).toEqual({ ...NONE, altProbe: true });
	});
});
