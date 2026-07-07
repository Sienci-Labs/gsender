import { toast } from "app/lib/toaster";
import prefStore from "app/store";
import reduxStore from "app/store/redux";
import get from "lodash/get";

export const FRONT_RIGHT = "FR";
export const FRONT_LEFT = "FL";
export const BACK_RIGHT = "BR";
export const BACK_LEFT = "BL";
export const OTHER = "OT";
export const POSITIVE_DIRECTION = 1;
export const NEGATIVE_DIRECTION = -1;

const OFFSET_DISTANCE = 1;

export const getHomingLocation = (value: string) => {
	// convert settting to number and bitmask it with 7 (000111) in order to strip out A -> C axes and just leave XYZ
	let setting = Number(value);
	// eslint-disable-next-line no-bitwise
	setting &= 7;

	if (setting === 0) {
		return BACK_RIGHT;
	} else if (setting === 1) {
		return BACK_LEFT;
	} else if (setting === 2) {
		return FRONT_RIGHT;
	} else if (setting === 3) {
		return FRONT_LEFT;
	} else {
		return OTHER;
	}
};

const getMachineMovementLimits = (pullOff: number): number[] => {
	const store = reduxStore.getState();
	const settings = get(store, "controller.settings.settings");
	const { $130: xMax, $131: yMax } = settings;

	const xLimit = (Number(xMax) - pullOff).toFixed(3);
	const yLimit = (Number(yMax) - pullOff).toFixed(3);

	return [Number(xLimit), Number(yLimit)];
};

// Direction (in machine space) from the home corner toward the opposite
// corner, per axis. Mirrors src/server/lib/homing.js's getAxisMaximumLocation.
export const getAxisMaximumLocation = (homingMask: string): [number, number] => {
	const homingLocation = getHomingLocation(homingMask);
	if (homingLocation === BACK_RIGHT) {
		return [NEGATIVE_DIRECTION, NEGATIVE_DIRECTION];
	} else if (homingLocation === BACK_LEFT) {
		return [POSITIVE_DIRECTION, NEGATIVE_DIRECTION];
	} else if (homingLocation === FRONT_RIGHT) {
		return [NEGATIVE_DIRECTION, POSITIVE_DIRECTION];
	}
	return [POSITIVE_DIRECTION, POSITIVE_DIRECTION];
};

// Machine bed rectangle in work-coordinate scene space (mm), matching how
// wpos is already work-relative with no extra offset math in the renderer.
export function computeMachineBedWorkRect(args: {
	homingMaskSetting: string;
	machineWidthMm: number;
	machineDepthMm: number;
	wcsOffset: { x: number; y: number };
}): { min: { x: number; y: number }; max: { x: number; y: number } } {
	const [signX, signY] = getAxisMaximumLocation(args.homingMaskSetting);
	const cornerX = signX * args.machineWidthMm;
	const cornerY = signY * args.machineDepthMm;
	const machineMinX = Math.min(0, cornerX);
	const machineMaxX = Math.max(0, cornerX);
	const machineMinY = Math.min(0, cornerY);
	const machineMaxY = Math.max(0, cornerY);
	return {
		min: {
			x: machineMinX - args.wcsOffset.x,
			y: machineMinY - args.wcsOffset.y,
		},
		max: {
			x: machineMaxX - args.wcsOffset.x,
			y: machineMaxY - args.wcsOffset.y,
		},
	};
}

// Get a single bit from integer at position.  It does not use 0 indexing so pretend that arrays start at 1 :)
export function isBitSetInNumber(value: string, bitPosition: number) {
	const number = Number(value);
	// eslint-disable-next-line no-bitwise
	return (number & (1 << bitPosition)) !== 0;
}

const getPositionMovements = (
	requestedPosition: string,
	homingPosition: string,
	homingFlag: boolean,
	pullOff: number,
) => {
	const [xLimit, yLimit] = getMachineMovementLimits(pullOff);
	// If homing flag not set, we treat all movements as negative space
	if (!homingFlag) {
		homingPosition = BACK_RIGHT;
	}

	if (!xLimit || !yLimit) {
		toast.error(
			"Unable to find machine limits - make sure they're set in preferences",
			{ position: "bottom-right" },
		);
		return [null, null];
	}

	if (homingPosition === FRONT_RIGHT) {
		if (requestedPosition === FRONT_RIGHT) {
			return [pullOff * -1, pullOff];
		} else if (requestedPosition === FRONT_LEFT) {
			return [xLimit * -1, pullOff];
		} else if (requestedPosition === BACK_LEFT) {
			return [xLimit * -1, yLimit];
		} else {
			// Back Right
			return [pullOff * -1, yLimit];
		}
	} else if (homingPosition === FRONT_LEFT) {
		if (requestedPosition === FRONT_RIGHT) {
			return [xLimit, pullOff];
		} else if (requestedPosition === FRONT_LEFT) {
			return [pullOff, pullOff];
		} else if (requestedPosition === BACK_RIGHT) {
			return [xLimit, yLimit];
		} else {
			// Back Right
			return [pullOff, yLimit];
		}
	} else if (homingPosition === BACK_LEFT) {
		if (requestedPosition === FRONT_RIGHT) {
			return [xLimit, yLimit * -1];
		} else if (requestedPosition === FRONT_LEFT) {
			return [pullOff, yLimit * -1];
		} else if (requestedPosition === BACK_LEFT) {
			return [pullOff, pullOff * -1];
		} else {
			// Back Right
			return [xLimit, pullOff * -1];
		}
	} else if (homingPosition === BACK_RIGHT) {
		if (requestedPosition === FRONT_RIGHT) {
			return [pullOff * -1, yLimit * -1];
		} else if (requestedPosition === FRONT_LEFT) {
			return [xLimit * -1, yLimit * -1];
		} else if (requestedPosition === BACK_LEFT) {
			return [xLimit * -1, pullOff * -1];
		} else {
			// Back Right
			return [pullOff * -1, pullOff * -1];
		}
	}

	return [null, null];
};

export const getMovementGCode = (
	requestedPosition: string,
	homingPositionSetting: string,
	homingFlag: boolean,
	pullOff: number,
) => {
	const gcode = [];

	gcode.push(`G53 G21 G0 Z-${OFFSET_DISTANCE}`); // Always move up to the limit of Z travel minus offset
	const homingPosition = getHomingLocation(homingPositionSetting);

	// Change homing flag for grblHal specifically
	const controllerType = prefStore.get(
		"widgets.connection.controller.type",
		"grbl",
	);

	if (controllerType === "grblHAL") {
		const store = reduxStore.getState();
		const settings = get(store, "controller.settings.settings");
		const { $22: homingValue } = settings;
		homingFlag = isBitSetInNumber(homingValue, 3);
	}

	const [xMovement, yMovement] = getPositionMovements(
		requestedPosition,
		homingPosition,
		homingFlag,
		pullOff,
	);

	if (xMovement === null || yMovement === null) {
		toast.error(
			"Unable to calculate position movements based on inputs - check arguments passed",
			{ position: "bottom-right" },
		);
		return [];
	}
	gcode.push(`G53 G21 G0 X${xMovement} Y${yMovement}`);

	return gcode;
};
