/*
 * Contract tests for the shared line-parser result classes.
 *
 * These seven classes were previously duplicated byte-for-byte under Grbl/ and
 * Grblhal/. They now live once in controllers/shared/ and are imported by both
 * firmware parsers, so the equivalence this file used to assert between two
 * copies is now structural.
 *
 * What remains worth pinning is the parsing contract itself: which lines each
 * matcher accepts, which it declines, and the exact payload downstream
 * consumers receive.
 */

import LineParserResultAlarm from "../shared/LineParserResultAlarm";
import LineParserResultEcho from "../shared/LineParserResultEcho";
import LineParserResultError from "../shared/LineParserResultError";
import LineParserResultFeedback from "../shared/LineParserResultFeedback";
import LineParserResultHelp from "../shared/LineParserResultHelp";
import LineParserResultOption from "../shared/LineParserResultOption";
import LineParserResultSettings from "../shared/LineParserResultSettings";

// [label, class, matching lines, non-matching lines]
const MATCHERS = [
	[
		"Alarm",
		LineParserResultAlarm,
		["ALARM:1", "ALARM: 9", "ALARM:Hard limit triggered"],
		["alarm:1", "ALARM:", "ok", "[MSG:x]", ""],
	],
	[
		"Echo",
		LineParserResultEcho,
		["[echo:G1X1]", "[echo:M3 S1000]"],
		["[ECHO:x]", "[echo:]", "[MSG:x]", "echo:x", ""],
	],
	[
		"Error",
		LineParserResultError,
		["error:9", "error: 20", "error:Bad number format"],
		["ERROR:9", "error:", "ok", ""],
	],
	[
		"Feedback",
		LineParserResultFeedback,
		// The bracketed catch-all: with or without the MSG: prefix.
		["[MSG:Pgm End]", "[Caution: Unlocked]", "[MSG:Reset to continue]"],
		["MSG:Pgm End", "[]", "ok", ""],
	],
	[
		"Help",
		LineParserResultHelp,
		["[HLP:$$ $# $G]", "[HLP:$J=]"],
		["[hlp:x]", "[HLP:]", "[MSG:x]", ""],
	],
	[
		"Option",
		LineParserResultOption,
		["[OPT:VL,15,128]", "[OPT:V,15,128]"],
		["[opt:x]", "[OPT:]", "[MSG:x]", ""],
	],
	[
		"Settings",
		LineParserResultSettings,
		[
			"$10=511",
			"$132=200.000 (z max travel, mm)",
			"$100=250.000",
			"$1=25 (step idle delay, msec)",
		],
		["10=511", "ok", "[MSG:x]", ""],
	],
];

describe.each(MATCHERS)("%s", (_label, Matcher, matching, nonMatching) => {
	test.each(matching.map((l) => [l]))("accepts %p", (line) => {
		const result = Matcher.parse(line);
		expect(result).not.toBeNull();
		// Each result tags itself with its own class; the runners dispatch on
		// that identity, never on the class name.
		expect(result.type).toBe(Matcher);
	});

	test.each(nonMatching.map((l) => [l]))("declines %p", (line) => {
		expect(Matcher.parse(line)).toBeNull();
	});
});

describe("payload shapes", () => {
	// Exact payloads, so a regex tweak shows up as a diff rather than silently
	// changing what downstream consumers receive.
	const CASES = [
		[
			LineParserResultAlarm,
			"ALARM:Hard limit triggered",
			{ message: "Hard limit triggered" },
		],
		[LineParserResultEcho, "[echo:G1X1]", { message: "G1X1" }],
		[LineParserResultError, "error:9", { message: "9" }],
		[LineParserResultFeedback, "[MSG:Pgm End]", { message: "Pgm End" }],
		[LineParserResultHelp, "[HLP:$$ $#]", { message: "$$ $#" }],
		[LineParserResultOption, "[OPT:VL,15,128]", { message: "VL,15,128" }],
		[
			LineParserResultSettings,
			"$132=200.000 (z max travel, mm)",
			{ name: "$132", value: "200.000", message: "z max travel, mm" },
		],
		// The trailing-space trim in the Settings matcher is load-bearing.
		[
			LineParserResultSettings,
			"$100=250.000 ",
			{ name: "$100", value: "250.000", message: "" },
		],
	];

	test.each(CASES)("%# %p", (Matcher, line, expected) => {
		expect(Matcher.parse(line).payload).toEqual(expected);
	});
});

describe("both firmware parsers resolve to the same shared classes", () => {
	// The point of the consolidation: one class object, reached from either
	// firmware's parser, so a fix lands once.
	test("Grbl and grblHAL import the identical class objects", async () => {
		const grblParser = await import("../Grbl/GrblLineParser");
		const halParser = await import("../Grblhal/GrblHalLineParser");

		const g = new grblParser.default().parse("ALARM:1");
		const h = new halParser.default().parse("ALARM:1");

		expect(g.type).toBe(LineParserResultAlarm);
		expect(h.type).toBe(LineParserResultAlarm);
		expect(g.type).toBe(h.type);
	});
});
