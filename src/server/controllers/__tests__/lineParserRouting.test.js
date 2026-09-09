/*
 * Characterization tests for GrblLineParser / GrblHalLineParser routing.
 *
 * These pin the CURRENT behaviour of both parsers: which result class a given
 * firmware line is routed to, and the exact payload that comes back. They are
 * deliberately written against a normalized type label rather than the concrete
 * class identity, so that they keep asserting the same thing while the result
 * classes are being deduplicated into `controllers/shared/`.
 *
 * If a change here needs updating, that is a behaviour change to firmware
 * parsing - not a refactor. Treat a diff in this file as a review flag.
 */

import GrblLineParser from "../Grbl/GrblLineParser";
import GrblHalLineParser from "../Grblhal/GrblHalLineParser";

// Result classes are named GrblLineParserResultX / GrblHalLineParserResultX, and
// the codebase contains a few transposed spellings (GrbHal..., GbrlHal...).
// Strip the firmware prefix so the assertions describe the semantic result type
// and survive the shared-class rename.
const FIRMWARE_PREFIX = /^(GrblHal|GrbHal|GbrlHal|GrblHAL|Grbl)/;

// An unrecognised line is NOT null: both parsers fall through to
// `{ type: null, payload: { raw: line } }`. Preserve that distinction here.
const routeOf = (parser, line) => {
	const result = parser.parse(line);
	return {
		type: result.type ? result.type.name.replace(FIRMWARE_PREFIX, "") : null,
		payload: result.payload,
	};
};

const grbl = (line) => routeOf(new GrblLineParser(), line);
const grblHal = (line) => routeOf(new GrblHalLineParser(), line);

describe("lines both parsers agree on", () => {
	// [line, expected semantic type, expected payload (minus `raw`)]
	const AGREED = [
		["ALARM:1", "LineParserResultAlarm", { message: "1" }],
		[
			"ALARM:Hard/soft limit",
			"LineParserResultAlarm",
			{
				message: "Hard/soft limit",
			},
		],
		["error:9", "LineParserResultError", { message: "9" }],
		[
			"error:Modal group violation",
			"LineParserResultError",
			{
				message: "Modal group violation",
			},
		],
		["[echo:G1X1]", "LineParserResultEcho", { message: "G1X1" }],
		["[HLP:$$ $# $G]", "LineParserResultHelp", { message: "$$ $# $G" }],
		[
			"[Caution: Unlocked]",
			"LineParserResultFeedback",
			{
				message: "Caution: Unlocked",
			},
		],
		[
			"$10=511",
			"LineParserResultSettings",
			{
				name: "$10",
				value: "511",
				message: "",
			},
		],
		[
			"$132=200.000 (z max travel, mm)",
			"LineParserResultSettings",
			{
				name: "$132",
				value: "200.000",
				message: "z max travel, mm",
			},
		],
	];

	test.each(AGREED)("%s -> %s on both parsers", (line, type, payload) => {
		const expected = { type, payload: { ...payload, raw: line } };
		expect(grbl(line)).toEqual(expected);
		expect(grblHal(line)).toEqual(expected);
	});
});

describe("lines the two parsers route differently", () => {
	// These divergences are real and intentional to preserve for now: the
	// grblHAL parser registers GrblHalLineParserResultInfo, which matches the
	// generic `[XXXX:...]` shape ahead of Echo/Option/Feedback. The Grbl parser
	// has no such class, so the same line falls through to a different handler.
	//
	// Consequence: `[MSG:...]`, by far the most common feedback line, yields a
	// different payload SHAPE per firmware - {message} on Grbl vs {name, value}
	// on grblHAL. Downstream that is a `feedback` event on one and an `info`
	// event on the other. Recorded here so a later harmonization is a conscious
	// decision rather than an accident.

	test("[MSG:...] is Feedback on Grbl but Info on grblHAL", () => {
		expect(grbl("[MSG:Pgm End]")).toEqual({
			type: "LineParserResultFeedback",
			payload: { message: "Pgm End", raw: "[MSG:Pgm End]" },
		});
		expect(grblHal("[MSG:Pgm End]")).toEqual({
			type: "LineParserResultInfo",
			payload: { name: "MSG", value: "Pgm End", raw: "[MSG:Pgm End]" },
		});
	});

	test("[OPT:...] is Option on Grbl but Info on grblHAL", () => {
		// GrblHalLineParser has never registered an Option matcher, so [OPT:...]
		// falls through to Info. The duplicate GrblHalLineParserResultOption.js
		// was dead code and has been removed; Grbl's copy now lives in shared/.
		expect(grbl("[OPT:VL,15,128]")).toEqual({
			type: "LineParserResultOption",
			payload: { message: "VL,15,128", raw: "[OPT:VL,15,128]" },
		});
		expect(grblHal("[OPT:VL,15,128]")).toEqual({
			type: "LineParserResultInfo",
			payload: { name: "OPT", value: "VL,15,128", raw: "[OPT:VL,15,128]" },
		});
	});
});

describe("ok", () => {
	// Ok carries no fields beyond `raw` on either firmware.
	test("routes to Ok with a raw-only payload on both parsers", () => {
		expect(grbl("ok")).toEqual({
			type: "LineParserResultOk",
			payload: { raw: "ok" },
		});
		expect(grblHal("ok")).toEqual({
			type: "LineParserResultOk",
			payload: { raw: "ok" },
		});
	});
});

describe("registration order is load-bearing", () => {
	// GrblLineParserResultFeedback matches ANY bracketed line (/^\[(?:MSG:)?(.+)\]$/),
	// so every more specific bracketed parser must stay registered ahead of it.
	// These assertions fail loudly if the list is ever reordered.
	test("specific bracketed parsers win over the Feedback catch-all on Grbl", () => {
		expect(grbl("[echo:X]").type).toBe("LineParserResultEcho");
		expect(grbl("[HLP:X]").type).toBe("LineParserResultHelp");
		expect(grbl("[OPT:X]").type).toBe("LineParserResultOption");
		expect(grbl("[VER:1.1f.20170801]").type).toBe("LineParserResultVersion");
		// ...and an unrecognised bracketed line still lands on Feedback.
		expect(grbl("[anything else]").type).toBe("LineParserResultFeedback");
	});

	test("specific bracketed parsers win over the Feedback catch-all on grblHAL", () => {
		expect(grblHal("[echo:X]").type).toBe("LineParserResultEcho");
		expect(grblHal("[HLP:X]").type).toBe("LineParserResultHelp");
		expect(grblHal("[anything else]").type).toBe("LineParserResultFeedback");
	});
});

describe("non-matching input", () => {
	// Both parsers fall through to a null type rather than returning null, and
	// still echo the original line back as `raw`. Callers rely on that shape.
	test.each([["   "], ["not a grbl line at all"]])(
		"%p falls through to a null type on both parsers",
		(line) => {
			const expected = { type: null, payload: { raw: line } };
			expect(grbl(line)).toEqual(expected);
			expect(grblHal(line)).toEqual(expected);
		},
	);
});

describe("the Ok matchers are NOT equivalent between firmwares", () => {
	// Grbl uses /^o*k*$/ and grblHAL uses /^ok$/. The Grbl pattern accepts the
	// empty string and any run of o's followed by any run of k's.
	//
	// In practice GrblRunner.parse() strips trailing whitespace and bails on an
	// empty result before the parser is reached, so the empty-string case is
	// masked today. The looser matches below are not masked. An `ok` while the
	// workflow is RUNNING drives sender.ack() + sender.next() in
	// GrblController, so anything spuriously matching here advances stream
	// accounting.
	//
	// Recorded as a divergence, NOT fixed here: tightening Grbl's regex is a
	// behaviour change and needs a maintainer ruling.
	const LOOSE = ["", "o", "k", "ooo", "kk", "ookkk"];

	test.each(LOOSE.map((l) => [l]))(
		"Grbl accepts %p as ok; grblHAL does not",
		(line) => {
			expect(grbl(line).type).toBe("LineParserResultOk");
			expect(grblHal(line).type).not.toBe("LineParserResultOk");
		},
	);

	test("both agree on a well-formed ok", () => {
		expect(grbl("ok").type).toBe("LineParserResultOk");
		expect(grblHal("ok").type).toBe("LineParserResultOk");
	});
});
