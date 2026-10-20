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
		expect(new GrblHalRunner().state.status.probeContinuity).toEqual(NONE);
	});

	test("capital persists across reports until the lowercase letter clears it", () => {
		const runner = new GrblHalRunner();

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:J>");
		expect(runner.state.status.probeContinuity).toEqual({ ...NONE, tls: true });

		// Reports without the letter leave it alone
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0>");
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:P>");
		expect(runner.state.status.probeContinuity).toEqual({ ...NONE, tls: true });

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:j>");
		expect(runner.state.status.probeContinuity).toEqual(NONE);
	});

	test("complete (0x87) report sets continuity that survives regular reports", () => {
		const runner = new GrblHalRunner();

		runner.parse(
			"<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:I|WCO:0.000,0.000,0.000|FW:grblHAL>",
		);
		expect(runner.state.status.probeContinuity).toEqual({ ...NONE, probe: true });

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0>");
		expect(runner.state.status.probeContinuity).toEqual({ ...NONE, probe: true });

		runner.parse(
			"<Idle|MPos:0.000,0.000,0.000|FS:0,0|Pn:i|FW:grblHAL>",
		);
		expect(runner.state.status.probeContinuity).toEqual(NONE);
	});

	test("complete report fields after FW:grblHAL are parsed", () => {
		const runner = new GrblHalRunner();

		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|FW:grblHAL|Pn:K>");
		expect(runner.state.status.probeContinuity).toEqual({ ...NONE, altProbe: true });
	});
});
