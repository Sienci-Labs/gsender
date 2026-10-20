/*
 * Characterization tests for the status-report parsers.
 *
 * `<...>` status reports carry machine position, buffer occupancy, feed/spindle
 * rate, pin state and override values. They are the highest-traffic and most
 * safety-relevant lines the controllers parse, and had no coverage.
 *
 * These tests pin CURRENT behaviour, including several defects that are
 * documented inline and deliberately not fixed here - each one changes what the
 * UI and the sender see, so they need a maintainer ruling rather than a
 * drive-by fix during a refactor.
 */

import GrblStatus from "../Grbl/GrblLineParserResultStatus";
import HalStatus from "../Grblhal/GrblHalLineParserResultStatus";

// grblHAL always appends an SD-card block; strip it so the shared expectations
// below stay readable. Its presence is asserted separately.
const HAL_SD_DEFAULT = { name: null, percentage: 0 };

const grbl = (line) => GrblStatus.parse(line).payload;
const hal = (line) => HalStatus.parse(line).payload;
const halWithoutSd = (line) => {
	const { SD, ...rest } = hal(line);
	return rest;
};

describe("non-status lines are declined", () => {
	test.each([["ok"], ["ALARM:1"], ["[MSG:x]"], ["<unterminated"], [""]])(
		"%p",
		(line) => {
			expect(GrblStatus.parse(line)).toBeNull();
			expect(HalStatus.parse(line)).toBeNull();
		},
	);
});

describe("active state and sub-state", () => {
	test.each([
		["<Idle>", "Idle", 0],
		["<Run|MPos:0,0,0|FS:0,0>", "Run", 0],
		["<Jog|MPos:0,0,0|FS:0,0>", "Jog", 0],
		["<Hold:0|MPos:0,0,0|FS:0,0>", "Hold", 0],
		["<Hold:1|MPos:0,0,0|FS:0,0>", "Hold", 1],
		["<Door:3|MPos:0,0,0|FS:0,0>", "Door", 3],
	])("%s -> %s / sub-state %i", (line, activeState, subState) => {
		expect(grbl(line)).toMatchObject({ activeState, subState });
		expect(hal(line)).toMatchObject({ activeState, subState });
	});

	test("a bare <Idle> yields no position keys at all", () => {
		expect(grbl("<Idle>")).toEqual({
			activeState: "Idle",
			subState: 0,
			pinState: {},
		});
	});
});

describe("position reporting", () => {
	test("MPos maps positionally onto x/y/z and keeps the raw strings", () => {
		// Values stay strings - downstream code does its own numeric conversion.
		expect(grbl("<Idle|MPos:3.000,2.000,0.000|FS:0,0>").mpos).toEqual({
			x: "3.000",
			y: "2.000",
			z: "0.000",
		});
	});

	test("a 4th MPos value maps onto the a axis", () => {
		expect(grbl("<Idle|MPos:1,2,3,4|FS:0,0>").mpos).toEqual({
			x: "1",
			y: "2",
			z: "3",
			a: "4",
		});
		expect(hal("<Idle|MPos:1,2,3,4|FS:0,0>").mpos).toEqual({
			x: "1",
			y: "2",
			z: "3",
			a: "4",
		});
	});

	test("WCO is parsed into its own axis map", () => {
		const line = "<Idle|MPos:5.000,2.000,0.000|FS:0,0|WCO:1.000,2.000,3.000>";
		expect(grbl(line).wco).toEqual({ x: "1.000", y: "2.000", z: "3.000" });
		expect(hal(line).wco).toEqual({ x: "1.000", y: "2.000", z: "3.000" });
	});

	test("wpos is absent unless the report carries WPos", () => {
		expect(grbl("<Idle|MPos:1,2,3|FS:0,0>")).not.toHaveProperty("wpos");
	});
});

describe("buffer, line number, feed and spindle", () => {
	test("Bf (v1.1) fills planner and rx", () => {
		expect(grbl("<Idle|MPos:0,0,0|Bf:15,128|FS:0,0>").buf).toEqual({
			planner: 15,
			rx: 128,
		});
	});

	test("FS fills feedrate and spindle; F fills feedrate only", () => {
		expect(grbl("<Run|MPos:0,0,0|FS:500,8000>")).toMatchObject({
			feedrate: 500,
			spindle: 8000,
		});
		const v09 = grbl("<Idle,MPos:0,0,0,Buf:0,RX:0,Ln:0,F:250.>");
		expect(v09.feedrate).toBe(250);
		expect(v09).not.toHaveProperty("spindle");
	});

	test("Ln is coerced to a number", () => {
		expect(grbl("<Jog|MPos:0,0,0|FS:0,0|Ln:42>").ln).toBe(42);
	});
});

describe("pin state and accessory state", () => {
	test("Pn expands into a per-pin boolean map", () => {
		expect(grbl("<Idle|MPos:0,0,0|Pn:PZ|FS:0,0>").pinState).toEqual({
			P: true,
			Z: true,
		});
	});

	test("pinState defaults to an empty object when Pn is absent", () => {
		expect(grbl("<Idle|MPos:0,0,0|FS:0,0>").pinState).toEqual({});
	});

	test("A is carried through verbatim", () => {
		expect(grbl("<Idle|MPos:0,0,0|A:SF|FS:0,0>").accessoryState).toBe("SF");
	});
});

describe("override values", () => {
	test("Ov becomes a numeric triple and stamps ovTimestamp", () => {
		const p = grbl("<Idle|MPos:0,0,0|FS:0,0|Ov:100,100,100>");
		expect(p.ov).toEqual([100, 100, 100]);
		expect(typeof p.ovTimestamp).toBe("number");
	});

	test("ov is absent when the report carries no Ov field", () => {
		expect(grbl("<Idle|MPos:0,0,0|FS:0,0>")).not.toHaveProperty("ov");
	});
});

describe("KNOWN DEFECT: the v0.9 Lim branch is dead code", () => {
	// GrblLineParserResultStatus computes a string pinState from `Lim:` and
	// then unconditionally executes `payload.pinState = {}` immediately
	// afterwards, before the `Pn` check. The Lim result is therefore always
	// discarded and v0.9 limit-pin reporting never reaches the UI.
	//
	// The same branch also tests bit 2 twice - `(value & (1 << 2)) ? 'A' : ''`
	// reuses the Z bit instead of bit 3 - so it would be wrong even if it ran.
	test("Lim never produces a pin state", () => {
		const line =
			"<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000,Buf:0,RX:0,Lim:007>";
		expect(grbl(line).pinState).toEqual({});
	});
});

describe("KNOWN DEFECT: grblHAL mis-parses v0.9 comma-delimited reports", () => {
	// The Grbl matcher handles the legacy comma-delimited form; the grblHAL one
	// does not. It swallows the literal token "WPos" as a 4th axis value, drops
	// the work position entirely, and loses the RX buffer count.
	//
	// Low practical impact - grblHAL speaks the v1.1 pipe-delimited form - but
	// pinned so any future unification of the two matchers is a deliberate act.
	const V09 =
		"<Idle,MPos:0.000,0.000,0.000,WPos:1.000,2.000,3.000,Buf:0,RX:5,Lim:000>";

	test("Grbl parses it correctly", () => {
		expect(grbl(V09)).toMatchObject({
			mpos: { x: "0.000", y: "0.000", z: "0.000" },
			wpos: { x: "1.000", y: "2.000", z: "3.000" },
			buf: { planner: 0, rx: 5 },
		});
	});

	test("grblHAL does not", () => {
		const p = hal(V09);
		expect(p.mpos).toEqual({
			x: "0.000",
			y: "0.000",
			z: "0.000",
			a: "WPos",
		});
		expect(p).not.toHaveProperty("wpos");
		expect(p.buf).toEqual({ planner: 0 });
	});
});

describe("grblHAL-specific fields", () => {
	test("every grblHAL status report carries a default SD block", () => {
		expect(hal("<Idle>").SD).toEqual(HAL_SD_DEFAULT);
		expect(hal("<Run|MPos:1,2,3|FS:0,0>").SD).toEqual(HAL_SD_DEFAULT);
	});
});

describe("the two parsers agree on v1.1 reports", () => {
	// Everything grblHAL actually receives in practice. Establishes how much of
	// the two status matchers is genuinely common.
	test.each([
		["<Idle|MPos:3.000,2.000,0.000|FS:0,0>"],
		["<Run|MPos:23.036,1.620,0.000|FS:500,0>"],
		["<Hold:0|MPos:5.000,2.000,0.000|FS:0,0>"],
		["<Idle|MPos:5.000,2.000,0.000|FS:0,0|WCO:0.000,0.000,0.000>"],
		["<Idle|MPos:1.000,2.000,3.000|Pn:PZ|FS:0,0>"],
		["<Idle|MPos:1.000,2.000,3.000|A:SF|FS:0,0>"],
		["<Jog|MPos:1.000,2.000,3.000|FS:1000,0|Ln:42>"],
	])("%s", (line) => {
		expect(halWithoutSd(line)).toEqual(grbl(line));
	});
});
