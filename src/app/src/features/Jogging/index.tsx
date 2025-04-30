import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import includes from 'lodash/includes';
import get from 'lodash/get';
import inRange from 'lodash/inRange';
import throttle from 'lodash/throttle';
import cx from 'classnames';

import { JogInput } from 'app/features/Jogging/components/JogInput';
import { JogWheel } from 'app/features/Jogging/components/JogWheel';
import { SpeedSelector } from 'app/features/Jogging/components/SpeedSelector';
import { ZJog } from 'app/features/Jogging/components/ZJog';
import { AJog } from 'app/features/Jogging/components/AJog';
import store from 'app/store';
import {
    cancelJog,
    jogAxis,
    startJogCommand,
} from 'app/features/Jogging/utils/Jogging';
import { FirmwareFlavour } from 'app/features/Connection';
import { RootState } from 'app/store/redux';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    JOGGING_CATEGORY,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING,
    WORKSPACE_MODE,
} from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { toast } from 'app/lib/toaster';
import controller from 'app/lib/controller';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import gamepad, { checkButtonHold } from 'app/lib/gamepad';
import { GamepadProfile } from 'app/lib/gamepad/definitions';
import { StopButton } from 'app/features/Jogging/components/StopButton';
import { useWidgetState } from 'app/hooks/useWidgetState';

import jogWheeelLabels from './assets/labels.svg';
import JogHelper from './utils/jogHelper';
import { preventDefault } from 'app/lib/dom-events';
import { checkThumbsticskAreIdle, JoystickLoop } from './JoystickLoop';

interface GamepadInstance {
    isHolding?: boolean;
    start: () => void;
    on: (event: string, callback: any) => void;
    off: (event: string, callback: any) => void;
}

export interface JogValueObject {
    xyStep: number;
    aStep: number;
    zStep: number;
    feedrate: number;
}

export function Jogging() {
    const { mode } = useWorkspaceState();
    const rotaryWidgetState = useWidgetState('rotary');
    const [initialized, setInitialized] = useState(false);
    const jogSpeedRef = useRef<JogValueObject>({
        xyStep: 0,
        zStep: 0,
        aStep: 0,
        feedrate: 0,
    });

    const [jogSpeed, setJogSpeed] = useState<JogValueObject>({
        xyStep: 0,
        zStep: 0,
        aStep: 0,
        feedrate: 0,
    });

    useEffect(() => {
        jogSpeedRef.current = jogSpeed;
    }, [jogSpeed]);

    const axes = useSelector((state: RootState) => {
        const controllerState = state.controller.state;
        return get(controllerState, 'axes.axes', ['X', 'Y', 'Z']);
    });

    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const workflowState = useSelector(
        (state: RootState) => state.controller.workflow.state,
    );
    const activeState = useSelector((state: RootState) => {
        return get(state, 'controller.state.status.activeState', 'Idle');
    });

    const firmwareType = useSelector(
        (state: RootState) => state.controller.type,
    );

    useEffect(() => {
        setFirmware(firmwareType as FirmwareFlavour);
    }, [firmwareType]);

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflowState === WORKFLOW_STATE_RUNNING) return false;

        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];

        return includes(states, activeState);
    }, [isConnected, workflowState, activeState])();

    const [firmware, setFirmware] = useState<FirmwareFlavour>('Grbl');

    const joystickLoop = useRef<JoystickLoop | null>(null);

    const handleJoystickJog = useCallback(
        (
            params: Record<string, number>,
            { doRegularJog }: { doRegularJog?: boolean } = {},
        ) => {
            const isInRotaryMode =
                store.get('workspace.mode', '') === WORKSPACE_MODE.ROTARY;

            const xyStep = jogSpeedRef.current.xyStep;
            const zStep = jogSpeedRef.current.zStep;
            const aStep = jogSpeedRef.current.aStep;
            const feedrate = jogSpeedRef.current.feedrate;

            const axisValue: Record<string, number> = {
                x: xyStep,
                y: xyStep,
                z: zStep,
                a: aStep,
            };

            if (doRegularJog) {
                const axisList: Record<string, number> = {};

                if (params.x) {
                    axisList.x = axisValue.x * params.x;
                }
                if (params.y) {
                    axisList.y = axisValue.y * params.y;
                }
                if (params.z) {
                    axisList.z = axisValue.z * params.z;
                }
                if (params.a) {
                    if (isInRotaryMode) {
                        axisList.y = axisValue.a * params.a;
                    } else {
                        axisList.A = axisValue.a * params.a;
                    }
                }

                jogAxis(axisList, feedrate);
                return;
            }

            // Check if params already contains a feedrate value (F property)
            // If so, extract it and remove it from params to avoid duplication
            const paramFeedrate = params.F;
            const jogParams = { ...params };

            if (paramFeedrate !== undefined) {
                delete jogParams.F;
                jogAxis(jogParams, paramFeedrate);
            } else {
                jogAxis(params, feedrate);
            }
        },
        [jogSpeed],
    );

    useEffect(() => {
        if (!initialized) {
            const jogValues = store.get('widgets.axes.jog.normal', {});
            const firmwareType = store.get(
                'widgets.connection.controller.type',
                'Grbl',
            );
            setFirmware(firmwareType);
            setJogSpeed({ ...jogValues });
            setInitialized(true);
        }
    }, [initialized]);

    useEffect(() => {
        // Use the type assertion with unknown first to avoid type errors
        const gamepadInstance =
            gamepad.getInstance() as unknown as GamepadInstance;

        gamepadInstance.on(
            'gamepad:axis',
            throttle(
                ({ detail: output }) => {
                    if (gamepadInstance.isHolding || !isConnected) {
                        return;
                    }

                    const { degrees, detail } = output;

                    const { axis } = detail;

                    // Add checks for detail.gamepad and detail.gamepad.id
                    if (!detail.gamepad || !detail.gamepad.id) {
                        return;
                    }

                    const gamepadProfiles = store.get(
                        'workspace.gamepad.profiles',
                        [],
                    ) as GamepadProfile[];

                    const currentProfile = gamepadProfiles.find(
                        (profile) =>
                            profile &&
                            profile.id &&
                            detail.gamepad &&
                            detail.gamepad.id &&
                            profile.id.includes(detail.gamepad.id),
                    );

                    if (!currentProfile) {
                        return;
                    }

                    const { joystickOptions } = currentProfile;
                    const { leftStick, rightStick } = degrees;

                    const activeStickDegrees = [
                        leftStick,
                        leftStick,
                        rightStick,
                        rightStick,
                    ][axis];
                    const activeStick = [
                        'stick1',
                        'stick1',
                        'stick2',
                        'stick2',
                    ][axis];

                    const isHoldingModifierButton = checkButtonHold(
                        'modifier',
                        currentProfile,
                    );

                    const actionType = !isHoldingModifierButton
                        ? 'primaryAction'
                        : 'secondaryAction';

                    const isUsingMPGMode = !!get(
                        joystickOptions,
                        `${activeStick}.mpgMode.${actionType}`,
                        false,
                    );

                    if (isUsingMPGMode) {
                        return;
                    }

                    const computeAxesAndDirection = (degrees: number) => {
                        const stick = get(joystickOptions, activeStick, null);

                        if (!stick) {
                            return [];
                        }

                        const { horizontal, vertical } = stick;

                        const getDirection = (isReversed: boolean) =>
                            !isReversed ? 1 : -1;

                        const MOVEMENT_DISTANCE = 1;

                        const stickX = {
                            axis: horizontal[actionType],
                            positiveDirection:
                                MOVEMENT_DISTANCE *
                                getDirection(horizontal.isReversed),
                            negativeDirection:
                                MOVEMENT_DISTANCE *
                                getDirection(!horizontal.isReversed),
                        };

                        const stickY = {
                            axis: vertical[actionType],
                            positiveDirection:
                                MOVEMENT_DISTANCE *
                                getDirection(vertical.isReversed),
                            negativeDirection:
                                MOVEMENT_DISTANCE *
                                getDirection(!vertical.isReversed),
                        };

                        // X-axis Positive
                        if (
                            inRange(degrees, 0, 30) ||
                            inRange(degrees, 330, 360)
                        ) {
                            return [
                                stickX.axis
                                    ? {
                                          [stickX.axis]:
                                              stickX.positiveDirection,
                                      }
                                    : null,
                            ];
                        }

                        // Top Right
                        if (inRange(degrees, 31, 59)) {
                            return [
                                stickX.axis
                                    ? {
                                          [stickX.axis]:
                                              stickX.positiveDirection,
                                      }
                                    : null,
                                stickY.axis
                                    ? {
                                          [stickY.axis]:
                                              stickY.positiveDirection,
                                      }
                                    : null,
                            ];
                        }

                        // Y-axis Positive
                        if (inRange(degrees, 60, 120)) {
                            return [
                                null,
                                stickY.axis
                                    ? {
                                          [stickY.axis]:
                                              stickY.positiveDirection,
                                      }
                                    : null,
                            ];
                        }

                        // Top Left
                        if (inRange(degrees, 121, 149)) {
                            return [
                                stickX.axis
                                    ? {
                                          [stickX.axis]:
                                              stickX.negativeDirection,
                                      }
                                    : null,
                                stickY.axis
                                    ? {
                                          [stickY.axis]:
                                              stickY.positiveDirection,
                                      }
                                    : null,
                            ];
                        }

                        // X-axis Negative
                        if (inRange(degrees, 150, 210)) {
                            return [
                                stickX.axis
                                    ? {
                                          [stickX.axis]:
                                              stickX.negativeDirection,
                                      }
                                    : null,
                            ];
                        }

                        // Bottom Left
                        if (inRange(degrees, 211, 239)) {
                            return [
                                stickX.axis
                                    ? {
                                          [stickX.axis]:
                                              stickX.negativeDirection,
                                      }
                                    : null,
                                stickY.axis
                                    ? {
                                          [stickY.axis]:
                                              stickY.negativeDirection,
                                      }
                                    : null,
                            ];
                        }

                        // Y-axis Negative
                        if (inRange(degrees, 240, 300)) {
                            return [
                                null,
                                stickY.axis
                                    ? {
                                          [stickY.axis]:
                                              stickY.negativeDirection,
                                      }
                                    : null,
                            ];
                        }

                        // Bottom Right
                        if (inRange(degrees, 301, 329)) {
                            return [
                                stickX.axis
                                    ? {
                                          [stickX.axis]:
                                              stickX.positiveDirection,
                                      }
                                    : null,
                                stickY.axis
                                    ? {
                                          [stickY.axis]:
                                              stickY.negativeDirection,
                                      }
                                    : null,
                            ];
                        }

                        return [];
                    };

                    const data = computeAxesAndDirection(activeStickDegrees);

                    if (!joystickLoop.current) {
                        joystickLoop.current = new JoystickLoop({
                            gamepadProfile: currentProfile,
                            jog: handleJoystickJog,
                            standardJog: handleJoystickJog,
                            cancelJog: cancelJog,
                            feedrate: jogSpeedRef.current.feedrate,
                            multiplier: { leftStick: 1, rightStick: 1 },
                        });
                    }

                    const thumbsticksAreIdle = checkThumbsticskAreIdle(
                        detail.gamepad.axes,
                        currentProfile,
                    );

                    if (thumbsticksAreIdle) {
                        joystickLoop.current.stop();
                        return;
                    }

                    const { isRunning, activeAxis: currentActiveAxis } =
                        joystickLoop.current;

                    const isUsingSameThumbstick =
                        currentActiveAxis === axis ||
                        (currentActiveAxis === 0 && axis === 1) ||
                        (currentActiveAxis === 1 && axis === 0) ||
                        (currentActiveAxis === 2 && axis === 3) ||
                        (currentActiveAxis === 3 && axis === 2);

                    if (!isUsingSameThumbstick && isRunning) {
                        return;
                    }

                    joystickLoop.current.setOptions({
                        gamepadProfile: currentProfile,
                        feedrate: jogSpeedRef.current.feedrate,
                        activeAxis: axis,
                        axes: data,
                        multiplier: {
                            leftStick: detail.distance,
                            rightStick: detail.distance,
                        },
                        degrees: activeStickDegrees,
                    });
                    joystickLoop.current.start(axis);
                },
                50,
                { leading: false, trailing: true },
            ),
        );

        return () => {
            if (joystickLoop.current) {
                joystickLoop.current.stop();
                joystickLoop.current = null;
            }
        };
    }, [isConnected, handleJoystickJog]);

    const jogHelper = useRef<JogHelper | null>(null);

    const canJog = () =>
        [WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED].includes(workflowState);

    function updateJogValues(values: JogValueObject) {
        setJogSpeed(values);
    }
    function updateXYStep(step: number) {
        const newJogSpeed = {
            xyStep: step,
            zStep: jogSpeed.zStep,
            aStep: jogSpeed.aStep,
            feedrate: jogSpeed.feedrate,
        };
        setJogSpeed(newJogSpeed);
    }
    function updateZStep(step: number) {
        const newJogSpeed = {
            xyStep: jogSpeed.xyStep,
            zStep: step,
            aStep: jogSpeed.aStep,
            feedrate: jogSpeed.feedrate,
        };
        setJogSpeed(newJogSpeed);
    }
    function updateAStep(step: number) {
        const newJogSpeed = {
            xyStep: jogSpeed.xyStep,
            zStep: jogSpeed.zStep,
            aStep: step,
            feedrate: jogSpeed.feedrate,
        };
        setJogSpeed(newJogSpeed);
    }
    function updateFeedrate(frate: number) {
        const newJogSpeed = {
            xyStep: jogSpeed.xyStep,
            zStep: jogSpeed.zStep,
            aStep: jogSpeed.aStep,
            feedrate: frate,
        };
        setJogSpeed(newJogSpeed);
    }

    const stopContinuousJog = () => {
        controller.command('jog:stop');
    };

    const handleShortcutJog = ({
        axis,
    }: {
        axis: { [key: string]: number } | null;
    }) => {
        const currentJogSpeed = jogSpeedRef.current;

        if (!axis || !canJog()) {
            return;
        }

        const axisValue = {
            X: currentJogSpeed.xyStep,
            Y: currentJogSpeed.xyStep,
            Z: currentJogSpeed.zStep,
            A: currentJogSpeed.aStep,
        };

        const jogCB = (given: Record<string, number>, feedrate: number) => {
            startJogCommand(given, feedrate, false);
        };

        const startContinuousJogCB = (
            coordinates: Record<string, number>,
            feedrate: number,
        ) => {
            const normalizedCoordinates: Record<string, number> = {};

            // Convert each coordinate value to either 1 or -1 based on its sign
            Object.keys(coordinates).forEach((key) => {
                normalizedCoordinates[key] = coordinates[key] > 0 ? 1 : -1;
            });

            startJogCommand(normalizedCoordinates, feedrate, true);
        };

        const stopContinuousJogCB = () => {
            stopContinuousJog();
        };

        if (!jogHelper.current) {
            jogHelper.current = new JogHelper({
                jogCB,
                startContinuousJogCB,
                stopContinuousJogCB,
            });
        }

        const axisList: Record<string, number> = {};

        if (axis.x) {
            axisList.X = axisValue.X * axis.x;
        }
        if (axis.y) {
            axisList.Y = axisValue.Y * axis.y;
        }
        if (axis.z) {
            axisList.Z = axisValue.Z * axis.z;
        }
        if (axis.a) {
            axisList.A = axisValue.A * axis.a;
        }

        jogHelper.current.onKeyDown(axisList, currentJogSpeed.feedrate);
    };

    const handleShortcutStop = () => {
        if (!jogHelper.current) {
            return;
        }

        jogHelper.current.onKeyUp();
    };

    const shuttleControlFunctions = {
        JOG: (
            _: Event,
            { axis = null }: { axis: { [key: string]: number } | null },
        ) => {
            const isInRotaryMode =
                store.get('workspace.mode', '') === WORKSPACE_MODE.ROTARY;

            const firmware = controller.type;

            const controllerIsGrbl = firmware === 'Grbl';

            if (controllerIsGrbl && axis.a && !isInRotaryMode) {
                return;
            }

            handleShortcutJog({ axis });
        },
        UPDATE_WORKSPACE_MODE: () => {
            const currentWorkspaceMode = store.get(
                'workspace.mode',
                WORKSPACE_MODE.DEFAULT,
            );
            const workspaceModesList: string[] = Object.values(WORKSPACE_MODE);
            const currentWorkspaceModeIndex = workspaceModesList.findIndex(
                (mode) => mode === currentWorkspaceMode,
            );
            const nextWorkspaceMode =
                workspaceModesList[currentWorkspaceModeIndex + 1] ??
                workspaceModesList[0];

            store.replace('workspace.mode', nextWorkspaceMode);

            toast.info(
                `Workspace Mode set to ${nextWorkspaceMode.charAt(0).toUpperCase() + nextWorkspaceMode.slice(1).toLowerCase()}`,
            );
        },
    };

    const shuttleControlEvents = {
        JOG_A_PLUS: {
            // Jog A+
            id: 100,
            title: 'Jog: A+',
            keys: ['ctrl', '6'].join('+'),
            cmd: 'JOG_A_PLUS',
            payload: {
                axis: { a: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_A_MINUS: {
            // Jog A-
            id: 101,
            title: 'Jog: A-',
            keys: ['ctrl', '4'].join('+'),
            cmd: 'JOG_A_MINUS',
            payload: {
                axis: { a: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        SWITCH_WORKSPACE_MODE: {
            id: 103,
            title: 'Switch Between Workspace Modes',
            keys: ['ctrl', '5'].join('+'),
            cmd: 'SWITCH_WORKSPACE_MODE',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.UPDATE_WORKSPACE_MODE,
        },
        JOG_X_P: {
            title: 'Jog: X+',
            keys: 'shift+right',
            gamepadKeys: '15',
            keysName: 'Arrow Right',
            cmd: 'JOG_X_P',
            payload: {
                axis: { x: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_M: {
            title: 'Jog: X-',
            keys: 'shift+left',
            gamepadKeys: '14',
            keysName: 'Arrow Left',
            cmd: 'JOG_X_M',
            payload: {
                axis: { x: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Y_P: {
            title: 'Jog: Y+',
            keys: 'shift+up',
            gamepadKeys: '12',
            keysName: 'Arrow Up',
            cmd: 'JOG_Y_P',
            payload: {
                axis: { y: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Y_M: {
            title: 'Jog: Y-',
            keys: 'shift+down',
            gamepadKeys: '13',
            keysName: 'Arrow Down',
            cmd: 'JOG_Y_M',
            payload: {
                axis: { y: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Z_P: {
            title: 'Jog: Z+',
            keys: 'shift+pageup',
            gamepadKeys: '5',
            keysName: 'Left Button',
            cmd: 'JOG_Z_P',
            payload: {
                axis: { z: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Z_M: {
            title: 'Jog: Z-',
            keys: 'shift+pagedown',
            gamepadKeys: '4',
            keysName: 'Right Button',
            cmd: 'JOG_Z_M',
            payload: {
                axis: { z: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_P_Y_M: {
            title: 'Jog: X+ Y-',
            keys: '',
            gamepadKeys: '13+15',
            keysName: 'Arrow Right and Arrow Down',
            cmd: 'JOG_X_P_Y_M',
            payload: {
                axis: { x: 1, y: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_M_Y_P: {
            title: 'Jog: X- Y+',
            keys: '',
            gamepadKeys: '13+14',
            keysName: 'Arrow Left and Arrow Down',
            cmd: 'JOG_X_M_Y_P',
            payload: {
                axis: { x: -1, y: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_Y_P: {
            title: 'Jog: X+ Y+',
            keys: '',
            gamepadKeys: '12+15',
            keysName: 'Arrow Right and Arrow Up',
            cmd: 'JOG_X_Y_P',
            payload: {
                axis: { x: 1, y: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_Y_M: {
            title: 'Jog: X- Y-',
            keys: '',
            gamepadKeys: '13+14',
            keysName: 'Arrow Left and Arrow Down',
            cmd: 'JOG_X_Y_M',
            payload: {
                axis: { x: -1, y: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        STOP_JOG: {
            // this one is for the shortcut. can be used at any time, even when not continuous jogging.
            title: 'Stop Jog',
            keys: '',
            cmd: 'STOP_JOG',
            payload: { force: true },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: (event: Event, _: Record<string, number> | null) => {
                if (event) {
                    preventDefault(event);
                }

                controller.command('jog:stop');
            },
        },
        STOP_CONT_JOG: {
            // this one is for other functions to call when continuous jogging
            cmd: 'STOP_CONT_JOG',
            payload: { force: true },
            preventDefault: false,
            callback: (event: Event) => {
                if (event) {
                    preventDefault(event);
                }

                handleShortcutStop();
            },
        },
        // JOG_SPEED_I: {
        //     title: 'Increase Jog Speed',
        //     keys: '=',
        //     gamepadKeys: '7',
        //     keysName: 'Right Trigger',
        //     cmd: 'JOG_SPEED_I',
        //     payload: {
        //         speed: 'increase'
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.JOG_SPEED
        // },
        // JOG_SPEED_D: {
        //     title: 'Decrease Jog Speed',
        //     keys: '-',
        //     gamepadKeys: '6',
        //     keysName: 'Left Trigger',
        //     cmd: 'JOG_SPEED_D',
        //     payload: {
        //         speed: 'decrease'
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.JOG_SPEED
        // }
    };

    // @ts-expect-error
    useKeybinding(shuttleControlEvents);
    // @ts-expect-error
    useShuttleEvents(shuttleControlEvents);

    const isRotaryMode = mode === 'ROTARY';

    return (
        <>
            <div className="flex flex-row w-full gap-2 justify-around items-center select-none xl:mt-4">
                <div className="min-w-[180px] relative">
                    <JogWheel
                        distance={jogSpeed.xyStep}
                        feedrate={jogSpeed.feedrate}
                        canClick={canClick}
                    />
                    <img
                        className="absolute top-0 left-0 pointer-events-none"
                        src={jogWheeelLabels}
                        alt="Jog wheel arrows"
                    />
                    <StopButton
                        disabled={!isConnected}
                        onClick={() => cancelJog(activeState, firmware)}
                    />
                    {/*<img
                        src={stopSign}
                        className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 hover:fill-red-200"
                        alt="E-Stop button"

                        onClick={() => cancelJog(activeState, firmware)}
                    />*/}
                </div>
                <div className="flex justify-center gap-4">
                    <ZJog
                        distance={jogSpeed.zStep}
                        feedrate={jogSpeed.feedrate}
                        canClick={canClick}
                    />
                    {axes && (isRotaryMode || rotaryWidgetState.tab.show) && (
                        <AJog
                            distance={jogSpeed.aStep}
                            feedrate={jogSpeed.feedrate}
                            canClick={canClick}
                        />
                    )}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex w-full items-center justify-center">
                    <div
                        className={cx('grid gap-x-1 items-center', {
                            'grid-cols-2 gap-y-3':
                                (rotaryWidgetState.tab.show &&
                                    firmwareType === 'grblHAL') ||
                                isRotaryMode,
                            'grid-cols-1 gap-y-1':
                                !rotaryWidgetState.tab.show && !isRotaryMode,
                        })}
                    >
                        <JogInput
                            label="XY"
                            currentValue={jogSpeed.xyStep}
                            onChange={updateXYStep}
                        />
                        <JogInput
                            label="Z"
                            currentValue={jogSpeed.zStep}
                            onChange={updateZStep}
                        />
                        {(firmwareType === 'grblHAL' || isRotaryMode) &&
                            rotaryWidgetState.tab.show && (
                                <JogInput
                                    label="A°"
                                    currentValue={jogSpeed.aStep}
                                    onChange={updateAStep}
                                />
                            )}
                        <JogInput
                            label="at"
                            currentValue={jogSpeed.feedrate}
                            onChange={updateFeedrate}
                        />
                    </div>
                </div>
                <div className="flex float-right">
                    <SpeedSelector handleClick={updateJogValues} />
                </div>
            </div>
        </>
    );
}
