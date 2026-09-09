/*
 * Equivalence tests for the line-parser result classes that exist twice, once
 * under Grbl/ and once under Grblhal/.
 *
 * Purpose: demonstrate that for the seven classes below the two copies are
 * behaviourally identical, so collapsing them into `controllers/shared/` is a
 * pure deduplication. Each case asserts that both copies produce the same
 * payload for the same line, and both decline the same lines.
 *
 * `parse()` returns `{ type, payload }` where `type` is the class itself. The
 * class identity necessarily differs between the two copies, so only `payload`
 * and match/no-match are compared.
 *
 * Ok, Version, Startup, Parameters, ParserState and Status are deliberately
 * NOT in this file - those pairs genuinely differ. See
 * lineParserRouting.test.js for the Ok divergence.
 */

import GrblAlarm from "../Grbl/GrblLineParserResultAlarm";
import GrblEcho from "../Grbl/GrblLineParserResultEcho";
import GrblError from "../Grbl/GrblLineParserResultError";
import GrblFeedback from "../Grbl/GrblLineParserResultFeedback";
import GrblHelp from "../Grbl/GrblLineParserResultHelp";
import GrblOption from "../Grbl/GrblLineParserResultOption";
import GrblSettings from "../Grbl/GrblLineParserResultSettings";

import HalAlarm from "../Grblhal/GrblHalLineParserResultAlarm";
import HalEcho from "../Grblhal/GrblHalLineParserResultEcho";
import HalError from "../Grblhal/GrblHalLineParserResultError";
import HalFeedback from "../Grblhal/GrblHalLineParserResultFeedback";
import HalHelp from "../Grblhal/GrblHalLineParserResultHelp";
import HalOption from "../Grblhal/GrblHalLineParserResultOption";
import HalSettings from "../Grblhal/GrblHalLineParserResultSettings";

// [label, Grbl copy, grblHAL copy, matching lines, non-matching lines]
const PAIRS = [
	[
		"Alarm",
		GrblAlarm,
		HalAlarm,
		["ALARM:1", "ALARM: 9", "ALARM:Hard limit triggered"],
		["alarm:1", "ALARM:", "ok", "[MSG:x]", ""],
	],
	[
		"Echo",
		GrblEcho,
		HalEcho,
		["[echo:G1X1]", "[echo:M3 S1000]"],
		["[ECHO:x]", "[echo:]", "[MSG:x]", "echo:x", ""],
	],
	[
		"Error",
		GrblError,
		HalError,
		["error:9", "error: 20", "error:Bad number format"],
		["ERROR:9", "error:", "ok", ""],
	],
	[
		"Feedback",
		GrblFeedback,
		HalFeedback,
		// Feedback is the bracketed catch-all: with or without the MSG: prefix.
		["[MSG:Pgm End]", "[Caution: Unlocked]", "[MSG:Reset to continue]"],
		["MSG:Pgm End", "[]", "ok", ""],
	],
	[
		"Help",
		GrblHelp,
		HalHelp,
		["[HLP:$$ $# $G]", "[HLP:$J=]"],
		["[hlp:x]", "[HLP:]", "[MSG:x]", ""],
	],
	[
		"Option",
		GrblOption,
		HalOption,
		["[OPT:VL,15,128]", "[OPT:V,15,128]"],
		["[opt:x]", "[OPT:]", "[MSG:x]", ""],
	],
	[
		"Settings",
		GrblSettings,
		HalSettings,
		[
			"$10=511",
			"$132=200.000 (z max travel, mm)",
			"$100=250.000",
			"$1=25 (step idle delay, msec)",
		],
		["10=511", "ok", "[MSG:x]", ""],
	],
];

describe.each(PAIRS)(
	"%s: Grbl and grblHAL copies are equivalent",
	(_label, Grbl, Hal, matching, nonMatching) => {
		test.each(matching.map((l) => [l]))(
			"both parse %p to the same payload",
			(line) => {
				const g = Grbl.parse(line);
				const h = Hal.parse(line);

				expect(g).not.toBeNull();
				expect(h).not.toBeNull();
				expect(g.payload).toEqual(h.payload);

				// Each returns its own class as the type tag.
				expect(g.type).toBe(Grbl);
				expect(h.type).toBe(Hal);
			},
		);

		test.each(nonMatching.map((l) => [l]))("both decline %p", (line) => {
			expect(Grbl.parse(line)).toBeNull();
			expect(Hal.parse(line)).toBeNull();
		});
	},
);

describe("payload snapshots", () => {
	// Exact payloads, so a regex tweak in either copy shows up as a diff rather
	// than silently changing what downstream consumers receive.
	const CASES = [
		[
			GrblAlarm,
			HalAlarm,
			"ALARM:Hard limit triggered",
			{
				message: "Hard limit triggered",
			},
		],
		[GrblEcho, HalEcho, "[echo:G1X1]", { message: "G1X1" }],
		[GrblError, HalError, "error:9", { message: "9" }],
		[GrblFeedback, HalFeedback, "[MSG:Pgm End]", { message: "Pgm End" }],
		[GrblHelp, HalHelp, "[HLP:$$ $#]", { message: "$$ $#" }],
		[GrblOption, HalOption, "[OPT:VL,15,128]", { message: "VL,15,128" }],
		[
			GrblSettings,
			HalSettings,
			"$132=200.000 (z max travel, mm)",
			{
				name: "$132",
				value: "200.000",
				message: "z max travel, mm",
			},
		],
		// The trailing-space trim in the Settings matcher is load-bearing.
		[
			GrblSettings,
			HalSettings,
			"$100=250.000 ",
			{
				name: "$100",
				value: "250.000",
				message: "",
			},
		],
	];

	test.each(CASES)(
		"%# %p yields the expected payload",
		(Grbl, Hal, line, expected) => {
			expect(Grbl.parse(line).payload).toEqual(expected);
			expect(Hal.parse(line).payload).toEqual(expected);
		},
	);
});
