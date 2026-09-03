import defaultState from "app/store/defaultState";
import { StockTurningGenerator } from "../utils/Generator";

describe("Rotary Surfacing Output", () => {
	it("should not include a tool change when toolNumber is 0", () => {
		const generator = new StockTurningGenerator({
			...defaultState.widgets.rotary.stockTurning.options,
			toolNumber: 0,
		});

		const gcode = generator.generate().split("\n");

		expect(gcode.some((line) => line.startsWith("M6"))).toBe(false);
	});

	it("should insert M6 Tx immediately before the spindle start when toolNumber is above 0", () => {
		const generator = new StockTurningGenerator({
			...defaultState.widgets.rotary.stockTurning.options,
			toolNumber: 3,
		});

		const gcode = generator.generate().split("\n");
		const spindleRPM =
			defaultState.widgets.rotary.stockTurning.options.spindleRPM;

		const toolChangeIndex = gcode.indexOf("M6 T3");
		const spindleStartIndex = gcode.indexOf(`M3 S${spindleRPM}`);

		expect(toolChangeIndex).toBeGreaterThan(-1);
		expect(spindleStartIndex).toBeGreaterThan(-1);
		expect(toolChangeIndex).toBe(spindleStartIndex - 1);
	});
});
