/*
 * Characterization tests for GrblRunner / GrblHalRunner.
 *
 * The runners sit between the line parsers and the controllers. They hold the
 * accumulated machine state and derive values the firmware does not send
 * directly - most importantly the work position, which is computed as
 * WPos = MPos - WCO using a WCO that is "sticky" across reports because grbl
 * only transmits it periodically.
 *
 * That derivation is arithmetic on live machine coordinates with no previous
 * coverage. These tests pin it, along with the event surface the controllers
 * subscribe to.
 */

// The runners pull in src/server/lib/logger, which reads settings.winston at
// import time. jest.config.js maps any `../config/settings` specifier to the
// app's settings mock, which has no winston key, so the real logger cannot be
// constructed under test. Stub it - these tests are about parsing and state,
// not logging.
jest.mock("../../lib/logger", () => {
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

import GrblRunner from "../Grbl/GrblRunner";
import GrblHalRunner from "../Grblhal/GrblHalRunner";

const collect = (runner, event) => {
	const seen = [];
	runner.on(event, (payload) => seen.push(payload));
	return seen;
};

describe.each([
	["GrblRunner", () => new GrblRunner()],
	["GrblHalRunner", () => new GrblHalRunner()],
])("%s work-position derivation", (_name, make) => {
	test("WPos = MPos - WCO when the report carries both", () => {
		const runner = make();
		const seen = collect(runner, "status");

		runner.parse("<Idle|MPos:5.000,2.000,0.000|FS:0,0|WCO:1.000,2.000,3.000>");

		expect(seen).toHaveLength(1);
		expect(seen[0].wpos).toEqual({
			x: "4.000",
			y: "0.000",
			z: "-3.000",
		});
	});

	test("the WCO is sticky: a later report without WCO reuses the last one", () => {
		const runner = make();
		const seen = collect(runner, "status");

		// WCO arrives once...
		runner.parse("<Idle|MPos:0.000,0.000,0.000|FS:0,0|WCO:10.000,0.000,2.500>");
		// ...and must still apply to subsequent reports that omit it.
		runner.parse("<Run|MPos:15.000,1.000,2.500|FS:500,0>");

		expect(seen[1].wpos).toEqual({
			x: "5.000",
			y: "1.000",
			z: "0.000",
		});
	});

	test("decimal places follow the MPos string, not the arithmetic", () => {
		const runner = make();
		const seen = collect(runner, "status");

		runner.parse("<Idle|MPos:1.5,2.25,3|FS:0,0|WCO:0.5,0.25,1>");

		// One, two and zero decimals in, same out.
		expect(seen[0].wpos).toEqual({ x: "1.0", y: "2.00", z: "2" });
	});

	test("with no WCO ever seen, WPos equals MPos", () => {
		const runner = make();
		const seen = collect(runner, "status");

		runner.parse("<Idle|MPos:1.000,2.000,3.000|FS:0,0>");

		expect(seen[0].wpos).toEqual({ x: "1.000", y: "2.000", z: "3.000" });
	});

	test("a 4th axis is carried through the derivation", () => {
		const runner = make();
		const seen = collect(runner, "status");

		runner.parse(
			"<Idle|MPos:1.000,2.000,3.000,4.000|FS:0,0|WCO:1.000,1.000,1.000,1.000>",
		);

		expect(seen[0].wpos).toEqual({
			x: "0.000",
			y: "1.000",
			z: "2.000",
			a: "3.000",
		});
	});
});

describe.each([
	["GrblRunner", () => new GrblRunner()],
	["GrblHalRunner", () => new GrblHalRunner()],
])("%s probe pin detection", (_name, make) => {
	test("probeActive is derived from the raw line containing Pn:P", () => {
		const runner = make();

		runner.parse("<Idle|MPos:0,0,0|Pn:P|FS:0,0>");
		expect(runner.state.status.probeActive).toBe(true);

		runner.parse("<Idle|MPos:0,0,0|FS:0,0>");
		expect(runner.state.status.probeActive).toBe(false);
	});

	test("a Z-limit-only trigger does not read as a probe", () => {
		const runner = make();

		runner.parse("<Idle|MPos:0,0,0|Pn:Z|FS:0,0>");

		expect(runner.state.status.probeActive).toBe(false);
		expect(runner.state.status.pinState).toEqual({ Z: true });
	});
});

describe("GrblRunner empty input guard", () => {
	// GrblRunner.parse() strips trailing whitespace and returns before touching
	// the parser when nothing is left. This is what masks the fact that Grbl's
	// ok matcher (/^o*k*$/) would otherwise accept the empty string as an
	// acknowledgement. See lineParserRouting.test.js.
	test("whitespace-only input emits nothing at all", () => {
		const runner = new GrblRunner();
		const raw = collect(runner, "raw");
		const status = collect(runner, "status");
		const ok = collect(runner, "ok");

		runner.parse("");
		runner.parse("   ");
		runner.parse("\n");

		expect(raw).toHaveLength(0);
		expect(status).toHaveLength(0);
		expect(ok).toHaveLength(0);
	});

	test("every non-empty line is emitted as raw before being routed", () => {
		const runner = new GrblRunner();
		const raw = collect(runner, "raw");

		runner.parse("ok");
		runner.parse("<Idle|MPos:0,0,0|FS:0,0>");
		runner.parse("total gibberish");

		expect(raw).toEqual([
			{ raw: "ok" },
			{ raw: "<Idle|MPos:0,0,0|FS:0,0>" },
			{ raw: "total gibberish" },
		]);
	});
});

describe("GrblRunner startupAlarm transition", () => {
	test("fires on entering Alarm, and not again while it persists", () => {
		const runner = new GrblRunner();
		const alarms = collect(runner, "startupAlarm");

		runner.parse("<Idle|MPos:0,0,0|FS:0,0>");
		expect(alarms).toHaveLength(0);

		runner.parse("<Alarm|MPos:0,0,0|FS:0,0>");
		expect(alarms).toHaveLength(1);

		// Still in Alarm - no second edge.
		runner.parse("<Alarm|MPos:0,0,0|FS:0,0>");
		expect(alarms).toHaveLength(1);

		// Leave and re-enter to get a second edge.
		runner.parse("<Idle|MPos:0,0,0|FS:0,0>");
		runner.parse("<Alarm|MPos:0,0,0|FS:0,0>");
		expect(alarms).toHaveLength(2);
	});
});

describe.each([
	["GrblRunner", () => new GrblRunner()],
	["GrblHalRunner", () => new GrblHalRunner()],
])("%s event routing", (_name, make) => {
	test("ALARM: emits alarm", () => {
		const runner = make();
		const seen = collect(runner, "alarm");
		runner.parse("ALARM:1");
		expect(seen).toHaveLength(1);
		expect(seen[0]).toMatchObject({ message: "1" });
	});

	test("error: emits error", () => {
		const runner = make();
		const seen = collect(runner, "error");
		runner.parse("error:9");
		expect(seen).toHaveLength(1);
		expect(seen[0]).toMatchObject({ message: "9" });
	});

	test("ok emits ok", () => {
		const runner = make();
		const seen = collect(runner, "ok");
		runner.parse("ok");
		expect(seen).toHaveLength(1);
	});

	test("$ settings accumulate onto runner.settings.settings", () => {
		const runner = make();
		runner.parse("$10=511");
		runner.parse("$100=250.000");

		expect(runner.settings.settings).toMatchObject({
			$10: "511",
			$100: "250.000",
		});
	});
});
