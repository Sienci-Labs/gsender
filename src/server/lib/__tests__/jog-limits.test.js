import { determineMaxMovement, getAxisMaximumLocation } from "../homing";
import {
	axisTravelLimit,
	computeTravelBudget,
	normalizeMposToMetric,
} from "../jog-limits";

// The two implementations that used to live inline in GrblController and
// GrblHalController, transcribed verbatim so we can assert the unified helper
// reproduces them. They are the oracles for these tests, not production code.
const legacyGrblCalculateAxisValue = ({ direction, position, maxTravel }) => {
	const OFFSET = 1;
	const FIXED = 2;
	if (position === 0) {
		return (maxTravel * direction).toFixed(FIXED);
	}
	if (direction === 1) {
		return Number(position - OFFSET).toFixed(FIXED);
	}
	return Number(-1 * (maxTravel - position - OFFSET)).toFixed(FIXED);
};

const legacyHalCalculateAxisValue = ({ direction, position, maxTravel }) => {
	const OFFSET = -1;
	const FIXED = 2;
	if (position === 0) {
		return ((maxTravel + OFFSET) * direction).toFixed(FIXED);
	}
	if (direction === 1) {
		return Number(position + OFFSET).toFixed(FIXED);
	}
	return Number(-1 * (maxTravel - position + OFFSET)).toFixed(FIXED);
};

describe("axisTravelLimit", () => {
	const positions = [0, 1, 12.5, 50, 99, 100];
	const directions = [1, -1];
	const maxTravel = 100;

	it("matches the legacy grblHAL implementation exactly", () => {
		positions.forEach((position) => {
			directions.forEach((direction) => {
				expect(axisTravelLimit({ direction, position, maxTravel })).toBe(
					Number(
						legacyHalCalculateAxisValue({ direction, position, maxTravel }),
					),
				);
			});
		});
	});

	it("matches the legacy Grbl implementation everywhere except position 0", () => {
		positions
			.filter((position) => position !== 0)
			.forEach((position) => {
				directions.forEach((direction) => {
					expect(axisTravelLimit({ direction, position, maxTravel })).toBe(
						Number(
							legacyGrblCalculateAxisValue({ direction, position, maxTravel }),
						),
					);
				});
			});
	});

	it("keeps the safety margin at position 0, where the legacy Grbl version lost it", () => {
		expect(axisTravelLimit({ direction: 1, position: 0, maxTravel })).toBe(99);
		expect(
			Number(
				legacyGrblCalculateAxisValue({ direction: 1, position: 0, maxTravel }),
			),
		).toBe(100);
	});

	it("reproduces the legacy Grbl Z special case that was deleted", () => {
		// Grbl computed Z as: dir === 1 ? |mpos.z + 1| : -1 * ($132 - 1) - mpos.z
		const $132 = 100;
		[-30, -1, -99].forEach((mposZ) => {
			expect(
				axisTravelLimit({
					direction: 1,
					position: Math.abs(mposZ),
					maxTravel: $132,
				}),
			).toBe(Math.abs(mposZ + 1));

			expect(
				axisTravelLimit({
					direction: -1,
					position: Math.abs(mposZ),
					maxTravel: $132,
				}),
			).toBe(-1 * ($132 - 1) - mposZ);
		});
	});
});

describe("normalizeMposToMetric", () => {
	it("passes metric positions through untouched", () => {
		expect(normalizeMposToMetric({ x: -10, y: 5.25, z: -3 }, false)).toEqual({
			x: -10,
			y: 5.25,
			z: -3,
		});
	});

	it("converts inch positions to millimetres", () => {
		expect(normalizeMposToMetric({ x: 1, y: -2, z: 0 }, true)).toEqual({
			x: 25.4,
			y: -50.8,
			z: 0,
		});
	});

	it("never mutates the position it was given", () => {
		const mpos = { x: 1, y: 2, z: 3 };
		normalizeMposToMetric(mpos, true);
		expect(mpos).toEqual({ x: 1, y: 2, z: 3 });
	});
});

describe("computeTravelBudget", () => {
	const settings = {
		$13: "0",
		$23: "0",
		$130: "500",
		$131: "400",
		$132: "100",
	};
	const mpos = { x: -100, y: -200, z: -30 };
	const direction = { X: 1, Y: -1, Z: -1, A: 1 };

	it("is unbounded on every axis when soft limits are off", () => {
		expect(
			computeTravelBudget({
				direction,
				settings,
				mpos,
				softLimitsEnabled: false,
			}),
		).toEqual({ X: Infinity, Y: Infinity, Z: Infinity, A: Infinity });
	});

	it("leaves A unbounded even with soft limits on", () => {
		const budget = computeTravelBudget({
			direction,
			settings,
			mpos,
			softLimitsEnabled: true,
		});
		expect(budget.A).toBe(Infinity);
	});

	it("leaves axes that are not being jogged unbounded", () => {
		const budget = computeTravelBudget({
			direction: { X: 1 },
			settings,
			mpos,
			softLimitsEnabled: true,
		});
		expect(budget.Y).toBe(Infinity);
		expect(budget.Z).toBe(Infinity);
		expect(budget.X).not.toBe(Infinity);
	});

	it("uses the soft limit math when the machine is not homed", () => {
		const budget = computeTravelBudget({
			direction,
			settings,
			mpos,
			homingFlagSet: false,
			softLimitsEnabled: true,
		});

		expect(budget.X).toBe(
			axisTravelLimit({ direction: 1, position: 100, maxTravel: 500 }),
		);
		expect(budget.Y).toBe(
			axisTravelLimit({ direction: -1, position: 200, maxTravel: 400 }),
		);
		expect(budget.Z).toBe(
			axisTravelLimit({ direction: -1, position: 30, maxTravel: 100 }),
		);
	});

	it("defers to determineMaxMovement when the machine is homed", () => {
		["0", "1", "2", "3"].forEach(($23) => {
			const homedSettings = { ...settings, $23 };
			const budget = computeTravelBudget({
				direction,
				settings: homedSettings,
				mpos,
				homingFlagSet: true,
				softLimitsEnabled: true,
			});

			const [xMaxLoc, yMaxLoc] = getAxisMaximumLocation($23);
			expect(budget.X).toBe(Number(determineMaxMovement(100, 1, xMaxLoc, 500)));
			expect(budget.Y).toBe(
				Number(determineMaxMovement(200, -1, yMaxLoc, 400)),
			);
		});
	});

	it("converts an inch-reporting machine's position before clamping", () => {
		const imperial = { ...settings, $13: "1" };
		const budget = computeTravelBudget({
			direction: { Z: -1 },
			settings: imperial,
			mpos: { x: 0, y: 0, z: -1 }, // -1in === -25.4mm
			softLimitsEnabled: true,
		});

		expect(budget.Z).toBe(
			axisTravelLimit({ direction: -1, position: 25.4, maxTravel: 100 }),
		);
	});

	it("never mutates the machine position it was given", () => {
		const live = { x: -100, y: -200, z: -30 };
		computeTravelBudget({
			direction,
			settings: { ...settings, $13: "1" },
			mpos: live,
			softLimitsEnabled: true,
		});
		expect(live).toEqual({ x: -100, y: -200, z: -30 });
	});
});
