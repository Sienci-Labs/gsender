import * as grbl from "../Grbl/constants";
import GrblParserState from "../Grbl/GrblLineParserResultParserState";
import * as hal from "../Grblhal/constants";
import HalParserState from "../Grblhal/GrblHalLineParserResultParserState";

const GRBL_GROUPS = [
	[
		"motion",
		["G0", "G1", "G2", "G3", "G38.2", "G38.3", "G38.4", "G38.5", "G80"],
	],
	["wcs", ["G54", "G55", "G56", "G57", "G58", "G59"]],
	["plane", ["G17", "G18", "G19"]],
	["units", ["G20", "G21"]],
	["distance", ["G90", "G91"]],
	["feedrate", ["G93", "G94"]],
	["program", ["M0", "M1", "M2", "M30"]],
	["spindle", ["M3", "M4", "M5"]],
	["coolant", ["M7", "M8", "M9"]],
];

const HAL_GROUPS = [
	[
		"motion",
		["G0", "G1", "G2", "G3", "G5", "G38.2", "G38.3", "G38.4", "G38.5", "G80"],
	],
	["wcs", ["G54", "G55", "G56", "G57", "G58", "G59"]],
	["lathe", ["G7", "G8"]],
	["plane", ["G17", "G18", "G19"]],
	["units", ["G20", "G21"]],
	["distance", ["G90", "G91"]],
	["feedrate", ["G93", "G94"]],
	["program", ["M0", "M1", "M2", "M30"]],
	["cycle", ["G98", "G99"]],
	["spindle", ["M3", "M4", "M5"]],
	["coolant", ["M7", "M8", "M9"]],
];

// Import through the existing firmware modules to pin their public exports.
describe.each([
	["Grbl", grbl, "GRBL", GrblParserState, GRBL_GROUPS],
	["grblHAL", hal, "GRBL_HAL", HalParserState, HAL_GROUPS],
])("%s constants", (_label, constants, prefix, ParserState, groups) => {
	test.each(["Idle", "Run", "Hold", "Door", "Home", "Sleep", "Alarm", "Check"])(
		"preserves the %s active state",
		(state) => {
			expect(constants[`${prefix}_ACTIVE_STATE_${state.toUpperCase()}`]).toBe(
				state,
			);
		},
	);

	test("preserves alarm codes, wording, and order", () => {
		expect(constants[`${prefix}_ALARMS`]).toMatchSnapshot();
	});

	test("preserves modal groups and mode order", () => {
		expect(constants[`${prefix}_MODAL_GROUPS`]).toEqual(
			groups.map(([group, modes]) => ({ group, modes })),
		);
	});

	test.each(
		groups.flatMap(([group, modes]) => modes.map((mode) => [mode, group])),
	)("parses %s into the %s modal group", (mode, group) => {
		expect(ParserState.parse(`[GC:${mode}]`).payload).toEqual({
			modal: { [group]: mode },
		});
	});
});

test.each(["G5", "G7", "G8", "G98", "G99"])(
	"Grbl does not recognize the grblHAL-only mode %s",
	(mode) => {
		expect(GrblParserState.parse(`[GC:${mode}]`).payload).toEqual({});
	},
);

test("preserves Grbl settings input types", () => {
	expect(grbl.GRBL_SETTINGS_INPUT_TYPES).toEqual({
		NUMBER: "number",
		AXIS_MASK: "axis-mask",
		MASK_STATUS_REPORT: "mask-status-report",
		SWITCH: "switch",
	});
});

test("preserves grblHAL settings input types", () => {
	expect(hal.GRBL_HAL_SETTINGS_INPUT_TYPES).toEqual({
		NUMBER: "number",
		MASK: "mask",
		AXIS_MASK: "axis-mask",
		MASK_STATUS_REPORT: "mask-status-report",
		SWITCH: "switch",
		SELECT: "select",
		STRING: "string",
	});
});
