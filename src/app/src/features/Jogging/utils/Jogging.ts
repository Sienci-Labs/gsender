import {
	GRBL_ACTIVE_STATE_IDLE,
	GRBL_ACTIVE_STATE_JOG,
	GRBLHAL,
} from "app/constants";
import type { FIRMWARE_TYPES_T } from "app/definitions/firmware";
import type { GRBL_ACTIVE_STATES_T } from "app/definitions/general";
import controller from "app/lib/controller";
import store from "app/store";
import map from "lodash/map";

export interface JogSpeeds {
	aStep: number;
	zStep: number;
	xyStep: number;
	feedrate: number;
}

export type JoggingSpeedOptions = "Rapid" | "Normal" | "Precise" | "Custom";

/**
 * Drop any axis whose limit switch is already triggered in the direction we are
 * about to move. Returns null when nothing is left to jog.
 */
export function filterAxesForLimits(axes: JogDistances): JogDistances | null {
	const preventJoggingPastLimits = store.get(
		"workspace.preventJoggingPastLimits",
		false,
	);

	if (!preventJoggingPastLimits) {
		return axes;
	}

	const pinState = (controller.state as any)?.status?.pinState || {};
	const filtered: JogDistances = { ...axes };

	// Block jogging in the negative direction if X-, Y-, or A- limit is triggered
	// Block jogging in the positive direction if Z+ limit is triggered (typical Z homing direction)
	const blockedWhenNegative = ["X", "Y", "A"];

	// Axis keys reach here in either case - the jog widgets send "X", the
	// gamepad and MPG paths send "x" - so match on both or the protection
	// silently does nothing.
	Object.keys(filtered).forEach((key) => {
		const axis = key.toUpperCase();
		const value = (filtered as Record<string, number>)[key];

		if (value === undefined || !pinState[axis]) {
			return;
		}

		const blocked = blockedWhenNegative.includes(axis) ? value < 0 : value > 0;

		if (blocked) {
			delete (filtered as Record<string, number>)[key];
		}
	});

	return Object.keys(filtered).length === 0 ? null : filtered;
}

export function jogAxis(params: JogDistances, feedrate: number) {
	const filtered = filterAxesForLimits(params);
	if (!filtered) {
		return;
	}
	params = filtered;

	const units = store.get("workspace.units", "mm");
	const modal = units === "mm" ? "G21" : "G20";
	const s = map(
		params,
		(value, letter) => `${letter.toUpperCase()}${value}`,
	).join(" ");
	const commands = [`$J=${modal} G91 ${s} F${feedrate}`];
	controller.command("gcode", commands);
}

export function continuousJogAxis(axes: JogDistances, feedrate: number) {
	const filtered = filterAxesForLimits(axes);
	if (!filtered) {
		return;
	}

	const units = store.get("workspace.units", "mm");
	controller.command("jog:start", filtered, feedrate, units);
}

/**
 * Retarget a jog that is already streaming. Direction and speed change without
 * a jog cancel, so a joystick can be swept around without the machine stopping.
 */
export function updateContinuousJog(axes: JogDistances, feedrate: number) {
	const filtered = filterAxesForLimits(axes);
	if (!filtered) {
		return;
	}

	controller.command("jog:update", filtered, feedrate);
}

/**
 * Add distance to an ongoing jog, as an MPG handwheel does. Successive pulses
 * blend into continuous motion rather than each starting a fresh move.
 */
export function feedJog(axes: JogDistances, feedrate: number) {
	const filtered = filterAxesForLimits(axes);
	if (!filtered) {
		return;
	}

	const units = store.get("workspace.units", "mm");
	controller.command("jog:feed", filtered, feedrate, units);
}

export function stopContinuousJog() {
	controller.command("jog:stop");
}

/**
 * Only a primary-button press may start a jog. A right-click would otherwise
 * start a continuous jog and then lose its release to the context menu,
 * leaving the machine moving. The pendant already guards this way.
 */
export function isPrimaryPress(event: { button?: number }) {
	if ("button" in event && typeof event.button === "number") {
		return event.button === 0;
	}
	return true;
}

export interface JogDistances {
	X?: number;
	Y?: number;
	Z?: number;
	A?: number;
	B?: number;
	C?: number;
}

export interface JoggerProps {
	distance: number;
	feedrate: number;
	canClick?: boolean;
	isRotaryMode?: boolean;
	threshold?: number;
}

export function cancelJog(
	state: GRBL_ACTIVE_STATES_T,
	firmwareType: FIRMWARE_TYPES_T,
) {
	if (state) {
		if (state === GRBL_ACTIVE_STATE_JOG) {
			return controller.command("jog:cancel");
		}
		if (state === GRBL_ACTIVE_STATE_IDLE) {
			return;
		}
		if (firmwareType === GRBLHAL) {
			return controller.command("reset:soft");
		}
		controller.command("reset");
	}
}

export function startJogCommand(
	axes: JogDistances,
	feed: number,
	continuous: boolean,
) {
	if (continuous) {
		continuousJogAxis(axes, feed);
	} else {
		jogAxis(axes, feed);
	}
}

export function xPlusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ X: distance }, feed, continuous);
}

export function xMinusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ X: distance * -1 }, feed, continuous);
}

export function yPlusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ Y: distance }, feed, continuous);
}

export function yMinusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ Y: distance * -1 }, feed, continuous);
}

export function zPlusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ Z: distance }, feed, continuous);
}

export function zMinusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ Z: distance * -1 }, feed, continuous);
}

export function aPlusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
	isRotaryMode = false,
) {
	if (isRotaryMode) {
		startJogCommand({ Y: distance }, feed, continuous);
	} else {
		startJogCommand({ A: distance }, feed, continuous);
	}
}

export function aMinusJog(
	distance: number,
	feed: number,
	continuous: boolean = false,
	isRotaryMode = false,
) {
	if (isRotaryMode) {
		startJogCommand({ Y: distance * -1 }, feed, continuous);
	} else {
		startJogCommand({ A: distance * -1 }, feed, continuous);
	}
}

export function xPlusYPlus(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ X: distance, Y: distance }, feed, continuous);
}
export function xPlusYMinus(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ X: distance, Y: distance * -1 }, feed, continuous);
}
export function xMinusYPlus(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ X: distance * -1, Y: distance }, feed, continuous);
}
export function xMinusYMinus(
	distance: number,
	feed: number,
	continuous: boolean = false,
) {
	startJogCommand({ X: distance * -1, Y: distance * -1 }, feed, continuous);
}
