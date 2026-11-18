jest.mock("../logger", () => () => ({
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
	silly: jest.fn(),
}));

import getMacroSettings from "../get-macro-settings";
import translateExpression from "../translate-expression";
import evaluateAssignmentExpression from "../evaluate-assignment-expression";

describe("macro EEPROM settings", () => {
	const settings = getMacroSettings({
		$13: "0",
		$130: "800.000",
		$131: "1200",
		$300: "gSender-host",
		$301: "",
	});

	test("numeric values are numbers, others are left alone", () => {
		expect(settings.$130).toBe(800);
		expect(settings.$131).toBe(1200);
		expect(settings.$300).toBe("gSender-host");
		expect(settings.$301).toBe("");
	});

	test("handles missing settings", () => {
		expect(getMacroSettings(undefined)).toEqual({});
	});

	test("inline expressions resolve settings.$xxx", () => {
		const ctx = { settings };
		expect(translateExpression("G0 X[settings.$130]", ctx)).toBe("G0 X800");
		expect(
			translateExpression("G0 X[settings.$130 - 5] Y[settings.$131 + 1]", ctx),
		).toBe("G0 X795 Y1201");
	});

	test("existing simple expressions still translate", () => {
		expect(translateExpression("G0 X[posx] Y[posy]", { posx: 1, posy: 2 })).toBe(
			"G0 X1 Y2",
		);
	});

	test("assignments can read settings.$xxx", () => {
		const ctx = { settings };
		// controller strips the leading "%" before evaluating
		evaluateAssignmentExpression("x = settings.$130 / 2", ctx);
		expect(ctx.x).toBe(400);
	});
});
