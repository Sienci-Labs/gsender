import get from 'lodash/get';

type MpgActionType = 'primaryAction' | 'secondaryAction';

type BuildMpgCommandParams = {
    joystickOptions: any;
    activeStick: 'stick1' | 'stick2';
    actionType: MpgActionType;
    gamepadDetail: any;
    activeStickDegrees: number;
    firmwareType: string;
    isInRotaryMode: boolean;
    canJog: boolean;
    currentProfile: any;
    baseDistanceByAxis: Record<string, number>;
    baseFeedrate: number;
};

type MpgJogCommand = Record<string, number> | null;

export class MPGJogManager {
    private rotationStateByKey: Record<
        string,
        { lastDegrees: number | null; accumulatedDegrees: number }
    > = {};

    buildCommand(params: BuildMpgCommandParams): MpgJogCommand {
        const {
            joystickOptions,
            activeStick,
            actionType,
            gamepadDetail,
            activeStickDegrees,
            firmwareType,
            isInRotaryMode,
            canJog,
            currentProfile,
            baseDistanceByAxis,
            baseFeedrate,
        } = params;

        const mpgAxis = get(
            joystickOptions,
            `${activeStick}.mpgMode.${actionType}`,
            null,
        );
        const isUsingMpg = mpgAxis !== null && mpgAxis !== undefined;
        if (!isUsingMpg || !canJog) {
            return null;
        }

        const mpgIsReversed = !!get(
            joystickOptions,
            `${activeStick}.mpgMode.isReversed`,
            false,
        );
        const [stickAxisXIndex, stickAxisYIndex] =
            activeStick === 'stick1' ? [0, 1] : [2, 3];
        const stickX = Number(
            get(gamepadDetail, `gamepad.axes.${stickAxisXIndex}`, 0),
        );
        const stickY = Number(
            get(gamepadDetail, `gamepad.axes.${stickAxisYIndex}`, 0),
        );
        const stickMagnitude = Math.sqrt(stickX ** 2 + stickY ** 2);
        const zeroThreshold =
            Number(get(joystickOptions, 'zeroThreshold', 30)) / 100;

        const lockoutButton = get(currentProfile, 'lockout.button', null);
        const isHoldingLockoutButton =
            lockoutButton === null
                ? true
                : !!get(
                      gamepadDetail,
                      `gamepad.buttons.${lockoutButton}.pressed`,
                      false,
                  );

        if (stickMagnitude < zeroThreshold || !isHoldingLockoutButton) {
            const resetKey = `${activeStick}.${actionType}`;
            this.rotationStateByKey[resetKey] = {
                lastDegrees: null,
                accumulatedDegrees: 0,
            };
            return null;
        }

        const normalizedMpgAxis = String(mpgAxis).toLowerCase();
        const resolvedMpgAxis =
            normalizedMpgAxis === 'a' && isInRotaryMode
                ? 'y'
                : normalizedMpgAxis;

        if (
            firmwareType === 'Grbl' &&
            normalizedMpgAxis === 'a' &&
            !isInRotaryMode
        ) {
            return null;
        }

        const baseDistance = baseDistanceByAxis[normalizedMpgAxis] ?? 0;
        if (!baseDistance) {
            return null;
        }

        const rotationKey = `${activeStick}.${actionType}`;
        const rotationState = this.rotationStateByKey[rotationKey] ?? {
            lastDegrees: null,
            accumulatedDegrees: 0,
        };

        if (rotationState.lastDegrees === null) {
            rotationState.lastDegrees = activeStickDegrees;
            this.rotationStateByKey[rotationKey] = rotationState;
            return null;
        }

        let deltaDegrees = activeStickDegrees - rotationState.lastDegrees;
        if (deltaDegrees > 180) {
            deltaDegrees -= 360;
        } else if (deltaDegrees < -180) {
            deltaDegrees += 360;
        }

        rotationState.lastDegrees = activeStickDegrees;
        rotationState.accumulatedDegrees += deltaDegrees;

        // Four MPG pulses per full stick revolution.
        const DEGREES_PER_PULSE = 90;
        if (Math.abs(rotationState.accumulatedDegrees) < DEGREES_PER_PULSE) {
            this.rotationStateByKey[rotationKey] = rotationState;
            return null;
        }

        // In this angle system, positive deltas are CCW. Map CW to positive jog.
        const rotationDirectionSign = rotationState.accumulatedDegrees > 0 ? -1 : 1;
        const signedDirection = mpgIsReversed
            ? -rotationDirectionSign
            : rotationDirectionSign;

        const pulses = Math.floor(
            Math.abs(rotationState.accumulatedDegrees) / DEGREES_PER_PULSE,
        );
        // Keep remainder so continuous rotation keeps generating pulses.
        rotationState.accumulatedDegrees =
            rotationState.accumulatedDegrees % DEGREES_PER_PULSE;
        this.rotationStateByKey[rotationKey] = rotationState;

        const scaledDistance = baseDistance * pulses;
        const scaledFeedrate = Math.max(
            1,
            Math.round(baseFeedrate * Math.max(stickMagnitude, 0.25)),
        );

        return {
            [resolvedMpgAxis]: scaledDistance * signedDirection,
            F: scaledFeedrate,
        };
    }

    reset() {
        this.rotationStateByKey = {};
    }
}
