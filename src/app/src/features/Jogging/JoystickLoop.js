import gamepad, { checkButtonHold } from "app/lib/gamepad";
import get from "lodash/get";
import inRange from "lodash/inRange";
import throttle from "lodash/throttle";
import {
	continuousJogAxis,
	stopContinuousJog,
	updateContinuousJog,
} from "./utils/Jogging";

// The stream is retargeted at the same rate the gamepad handler is throttled
// to. There is no per-tick work left to justify anything faster.
export const JOYSTICK_UPDATE_MS = 50;

export const checkThumbsticskAreIdle = (axes, profile) => {
	const deadZone =
		profile?.joystickOptions?.zeroThreshold &&
		profile?.joystickOptions?.zeroThreshold / 100;

	if (!deadZone || deadZone === 0) {
		return axes?.every((axis) => axis === 0);
	}

	return axes?.every((axis) => inRange(axis, -deadZone, deadZone));
};

export class JoystickLoop {
	timeoutAmount = 600; // 600 ms to be consistent with jog controls

	startTime = 0;

	jogMovementDuration = null;

	jogMovementStartTime = null;

	currentJogDirection = null;

	constructor({ gamepadProfile, jog, cancelJog, feedrate, multiplier }) {
		this.isRunning = false;
		this.gamepadProfile = gamepadProfile;
		this.jog = jog;
		this.cancelJog = throttle(cancelJog, 50, {
			leading: false,
			trailing: true,
		});
		this.feedrate = feedrate;
		this.multiplier = multiplier;
		this.axisHistory = [[], [], [], []]; // Rolling history for 4 axes
		this.currentDirection = null; // For direction hysteresis
		this.pendingDirection = null; // For direction debouncing
		this.pendingDirectionCount = 0; // How many frames the pending direction has been stable
		this.streamActive = false; // Whether the server is streaming a jog for us
		this.variableAxisSmoothed = [0, 0, 0, 0]; // EMA smoothing for variable jog
		this.horizontalDominantAxis = null; // Hysteresis for X/Y dominance
	}

	_getCurrentGamepad = () => {
		const gamepadInstance = gamepad.getInstance();

		const currentHandler = gamepadInstance.handlers.find((handler) =>
			this.gamepadProfile.id.includes(handler?.gamepad?.id),
		);

		if (!currentHandler) {
			return null;
		}

		return currentHandler?.gamepad;
	};

	_smoothAxisValue = (axisIndex, rawValue) => {
		const HISTORY_SIZE = 3;
		const history = this.axisHistory[axisIndex];

		history.push(rawValue);
		if (history.length > HISTORY_SIZE) {
			history.shift();
		}

		return history.reduce((sum, val) => sum + val, 0) / history.length;
	};

	_getDirectionKey = (degrees) => {
		if (inRange(degrees, 0, 22.5) || inRange(degrees, 337.5, 360)) return "X+";
		if (inRange(degrees, 22.5, 67.5)) return "X+Y+";
		if (inRange(degrees, 67.5, 112.5)) return "Y+";
		if (inRange(degrees, 112.5, 157.5)) return "X-Y+";
		if (inRange(degrees, 157.5, 202.5)) return "X-";
		if (inRange(degrees, 202.5, 247.5)) return "X-Y-";
		if (inRange(degrees, 247.5, 292.5)) return "Y-";
		if (inRange(degrees, 292.5, 337.5)) return "X+Y-";
		return null;
	};

	_smoothVariableAxisValue = (axisIndex, rawValue) => {
		const EMA_ALPHA = 0.35;
		const previous = this.variableAxisSmoothed[axisIndex] ?? 0;
		const smoothed = previous + EMA_ALPHA * (rawValue - previous);
		this.variableAxisSmoothed[axisIndex] = smoothed;

		return smoothed;
	};

	// Only the requested speed. The server clamps it against each axis' own max
	// rate, which a single max($110,$111,$112) here always got wrong for
	// diagonals and for Z.
	//
	// The "movement override" setting used to scale the distance of each
	// individual jog command. There is no per-command distance any more, so it
	// scales speed instead - the same thing the operator was reaching for.
	_computeFeedrate = (stickValue) => {
		const override = get(
			this.gamepadProfile,
			"joystickOptions.movementDistanceOverride",
			100,
		);
		const feedrate = this.feedrate * (override / 100);

		const fixedSpeedMode = get(
			this.gamepadProfile,
			"joystickOptions.fixedSpeedMode",
			false,
		);

		if (fixedSpeedMode) {
			return Math.round(feedrate);
		}

		// A missing or malformed stick scalar must read as "no jog", never as a
		// NaN that the firmware ends up seeing as F1.
		if (!Number.isFinite(stickValue)) {
			return 0;
		}

		return Math.round(Math.abs(feedrate * stickValue));
	};

	_getAxesAndDirection = ({ degrees, activeAxis }) => {
		const { joystickOptions } = this.gamepadProfile;

		const activeStick = ["stick1", "stick1", "stick2", "stick2"][activeAxis];

		const { horizontal, vertical } = joystickOptions[activeStick];

		const getDirection = (isReversed) => (!isReversed ? 1 : -1);

		const MOVEMENT_DISTANCE = 1;

		const isHoldingModifierButton = checkButtonHold(
			"modifier",
			this.gamepadProfile,
		);

		const actionType = !isHoldingModifierButton
			? "primaryAction"
			: "secondaryAction";

		const stickX = {
			axis: horizontal[actionType],
			positiveDirection:
				MOVEMENT_DISTANCE * getDirection(horizontal.isReversed),
			negativeDirection:
				MOVEMENT_DISTANCE * getDirection(!horizontal.isReversed),
		};

		const stickY = {
			axis: vertical[actionType],
			positiveDirection: MOVEMENT_DISTANCE * getDirection(vertical.isReversed),
			negativeDirection: MOVEMENT_DISTANCE * getDirection(!vertical.isReversed),
		};

		// X-axis Positive
		if (inRange(degrees, 0, 15) || inRange(degrees, 345, 360)) {
			return [stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null];
		}

		// Top Right
		if (inRange(degrees, 16, 74)) {
			return [
				stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null,
				stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
			];
		}

		// Y-axis Positive
		if (inRange(degrees, 75, 105)) {
			return [
				null,
				stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
			];
		}

		// Top Left
		if (inRange(degrees, 106, 164)) {
			return [
				stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
				stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
			];
		}

		// X-axis Negative
		if (inRange(degrees, 165, 195)) {
			return [stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null];
		}

		// Bottom Left
		if (inRange(degrees, 196, 254)) {
			return [
				stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
				stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
			];
		}

		// Y-axis Negative
		if (inRange(degrees, 255, 285)) {
			return [
				null,
				stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
			];
		}

		// Bottom Right
		if (inRange(degrees, 286, 344)) {
			return [
				stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null,
				stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
			];
		}

		return [];
	};

	_runJog = () => {
		const {
			degrees,
			activeAxis,
			multiplier: { leftStick, rightStick },
		} = this;

		const currentGamepad = this._getCurrentGamepad();

		if (!currentGamepad) {
			return;
		}

		// Get axis values (smoothed for fixed speed mode, raw for variable mode)
		const rawAxesValues = currentGamepad?.axes;
		const fixedSpeedMode = get(
			this.gamepadProfile,
			"joystickOptions.fixedSpeedMode",
			false,
		);

		const axesValues = fixedSpeedMode
			? rawAxesValues.map((value, index) => this._smoothAxisValue(index, value))
			: rawAxesValues;

		// Direction locking for fixed speed mode only
		let degreesForAxes = degrees;
		if (fixedSpeedMode) {
			const DIRECTION_STABILITY_FRAMES = 1;
			const newDirectionKey = this._getDirectionKey(degrees);

			if (newDirectionKey !== this.pendingDirection) {
				this.pendingDirection = newDirectionKey;
				this.pendingDirectionCount = 1;
			} else {
				this.pendingDirectionCount++;
			}

			if (
				this.pendingDirectionCount >= DIRECTION_STABILITY_FRAMES &&
				this.currentDirection !== this.pendingDirection
			) {
				this.currentDirection = this.pendingDirection;
			}

			// Use stable direction center for axis calculation
			const directionCenters = {
				"X+": 0,
				"X+Y+": 45,
				"Y+": 90,
				"X-Y+": 135,
				"X-": 180,
				"X-Y-": 225,
				"Y-": 270,
				"X+Y-": 315,
			};
			degreesForAxes = this.currentDirection
				? directionCenters[this.currentDirection]
				: degrees;
		}

		const axes = this._getAxesAndDirection({
			degrees: degreesForAxes,
			activeAxis,
		});

		const numberOfAxes = axes.reduce(
			(acc, curr) => (curr !== null ? acc + 1 : acc),
			0,
		);

		const axesData =
			activeAxis < 2 ? axesValues.slice(0, 2) : axesValues.slice(2, 4);

		const lockoutButton = get(this.gamepadProfile, "lockout.button");
		const isHoldingLockoutButton = get(
			currentGamepad.buttons,
			`${lockoutButton}.pressed`,
			false,
		);

		const thumbsticksAreIdle = checkThumbsticskAreIdle(
			axesValues,
			this.gamepadProfile,
		);

		if (
			thumbsticksAreIdle ||
			((lockoutButton === 0 || lockoutButton) && !isHoldingLockoutButton)
		) {
			this.stop();
			return;
		}

		// Input conditioning stays here, where the raw stick values are. It now
		// shapes the direction and the speed scalar rather than a distance.
		let filteredAxesData = [...axesData];
		if (!fixedSpeedMode && activeAxis < 2) {
			const HORIZONTAL_EFFECTIVE_IDLE_THRESHOLD = 0.14;
			const HORIZONTAL_DOMINANCE_ENTER_RATIO = 1.8;
			const HORIZONTAL_DOMINANCE_EXIT_RATIO = 1.35;
			const stickBaseAxis = activeAxis < 2 ? 0 : 2;
			const [xAxisRaw = 0, yAxisRaw = 0] = filteredAxesData;
			const xAxis = this._smoothVariableAxisValue(stickBaseAxis, xAxisRaw);
			const yAxis = this._smoothVariableAxisValue(stickBaseAxis + 1, yAxisRaw);
			const absX = Math.abs(xAxis);
			const absY = Math.abs(yAxis);

			// Treat tiny XY stick movement as idle to avoid micro-jog spam.
			if (Math.max(absX, absY) < HORIZONTAL_EFFECTIVE_IDLE_THRESHOLD) {
				this.horizontalDominantAxis = null;
				return;
			}

			// Apply entry/exit hysteresis to prevent rapid X<->Y toggling.
			if (this.horizontalDominantAxis === "x") {
				if (absY > absX * HORIZONTAL_DOMINANCE_ENTER_RATIO) {
					this.horizontalDominantAxis = "y";
				} else if (absX < absY * HORIZONTAL_DOMINANCE_EXIT_RATIO) {
					this.horizontalDominantAxis = null;
				}
			} else if (this.horizontalDominantAxis === "y") {
				if (absX > absY * HORIZONTAL_DOMINANCE_ENTER_RATIO) {
					this.horizontalDominantAxis = "x";
				} else if (absY < absX * HORIZONTAL_DOMINANCE_EXIT_RATIO) {
					this.horizontalDominantAxis = null;
				}
			} else if (absX > absY * HORIZONTAL_DOMINANCE_ENTER_RATIO) {
				this.horizontalDominantAxis = "x";
			} else if (absY > absX * HORIZONTAL_DOMINANCE_ENTER_RATIO) {
				this.horizontalDominantAxis = "y";
			}

			if (this.horizontalDominantAxis === "x") {
				filteredAxesData = [xAxis, 0];
			} else if (this.horizontalDominantAxis === "y") {
				filteredAxesData = [0, yAxis];
			} else {
				filteredAxesData = [xAxis, yAxis];
			}
		}

		const multiplier = [leftStick, leftStick, rightStick, rightStick][
			activeAxis
		];

		const feedrate = this._computeFeedrate(
			numberOfAxes === 1
				? Math.max(...filteredAxesData.map((item) => Math.abs(item)))
				: multiplier,
		);

		if (!Number.isFinite(feedrate) || feedrate <= 0) {
			return;
		}

		// Fixed speed mode waits for the locked direction before committing.
		if (fixedSpeedMode && !this.currentDirection) {
			return;
		}

		// The two modes differ only in how the feedrate scalar above is worked
		// out; from here they are the same jog.
		const direction = filteredAxesData.reduce((acc, value, index) => {
			const axisData = axes[index];

			if (!axisData || !value) {
				return acc;
			}

			const [axis, axisDirection] = Object.entries(axisData)[0];
			acc[axis.toUpperCase()] = Math.sign(axisDirection);

			return acc;
		}, {});

		if (Object.keys(direction).length === 0) {
			return;
		}

		if (this.streamActive) {
			updateContinuousJog(direction, feedrate);
		} else {
			continuousJogAxis(direction, feedrate);
			this.streamActive = true;
		}
	};

	_axesArrayToObject = (arr) => {
		return arr.reduce((acc, curr) => {
			if (!curr) {
				return acc;
			}

			const [axis, axisValue] = Object.entries(curr)[0];

			acc[axis] = axisValue;

			return acc;
		}, {});
	};

	setOptions = ({
		gamepadProfile,
		feedrate,
		axes,
		multiplier,
		degrees,
		activeAxis,
	}) => {
		this.gamepadProfile = gamepadProfile;
		this.feedrate = feedrate;
		this.axes = axes;
		this.multiplier = multiplier;
		this.degrees = degrees;
		this.activeAxis = activeAxis;
	};

	start = (activeAxis) => {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.startTime = new Date();

		this.timeout = setTimeout(() => {
			this._runJog({ activeAxis });

			this.runLoop = setInterval(() => {
				this._runJog({ activeAxis });
			}, JOYSTICK_UPDATE_MS);
		}, this.timeoutAmount);
	};

	stop = () => {
		if (!this.isRunning) {
			return;
		}

		clearInterval(this.runLoop);
		clearTimeout(this.timeout);

		// Reset smoothing state
		this.axisHistory = [[], [], [], []];
		this.currentDirection = null;
		this.pendingDirection = null;
		this.pendingDirectionCount = 0;
		this.variableAxisSmoothed = [0, 0, 0, 0];
		this.horizontalDominantAxis = null;

		const wasStreaming = this.streamActive;
		this.streamActive = false;

		const timer = new Date() - this.startTime;

		// Released before the hold threshold: treat it as a tap and do a single
		// step jog instead.
		if (timer < this.timeoutAmount) {
			if (wasStreaming) {
				stopContinuousJog();
			}

			if (this.axes.every((item) => item === null)) {
				this.isRunning = false;
				return;
			}

			const axes = this._axesArrayToObject(this.axes);

			this.jog(axes, { doRegularJog: true });
			this.isRunning = false;
			return;
		}

		if (wasStreaming) {
			stopContinuousJog();
		} else {
			this.cancelJog();
		}

		this.isRunning = false;
	};
}
