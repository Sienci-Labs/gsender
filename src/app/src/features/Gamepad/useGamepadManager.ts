import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    updateConnectedGamepads,
    updateJogSettings,
    setActiveProfile,
    registerProfile,
    updateProfile,
    deleteProfile,
} from 'app/store/redux/slices/gamepadSlice';
import { RootState } from 'app/store/redux';

import { GamepadManagerState, GamepadProfile, GamepadAction } from './types';
import { GrblJogController } from './GrblJogController';

const DEFAULT_DEADZONE = 0.1;

type UseGamepadManagerProps = {
    onSendGrblCommand: (command: string) => void;
    onError?: (error: string) => void;
};

type GamepadManagerActions = {
    state: GamepadManagerState;
    addProfile: (profile: GamepadProfile) => void;
    updateProfile: (profile: GamepadProfile) => void;
    deleteProfile: (profileId: string) => void;
    setActiveProfile: (profileId: string | null) => void;
    updateJogSettings: (
        settings: Partial<
            Pick<GamepadManagerState, 'jogSpeed' | 'jogMode' | 'jogIncrement'>
        >,
    ) => void;
};

export const useGamepadManager = ({
    onSendGrblCommand,
    onError,
}: UseGamepadManagerProps): GamepadManagerActions => {
    const dispatch = useDispatch();
    const state = useSelector((state: RootState) => state.gamepad);

    const frameRef = useRef<number>(null);
    const lastTimestamps = useRef<Record<string, number>>({});
    const grblController = useRef(
        new GrblJogController(onSendGrblCommand, onError),
    );

    const handleGamepadConnected = (event: GamepadEvent) => {
        const { gamepad } = event;
        const newGamepad = {
            connected: true,
            id: gamepad.id,
            buttons: gamepad.buttons.map((btn, index) => ({
                index,
                pressed: btn.pressed,
                value: btn.value,
            })),
            axes: gamepad.axes.map((value, index) => ({
                index,
                value,
                deadzone: DEFAULT_DEADZONE,
            })),
            timestamp: gamepad.timestamp,
        };

        dispatch(
            updateConnectedGamepads({
                ...state.connectedGamepads,
                [gamepad.id]: newGamepad,
            }),
        );
    };

    const handleGamepadDisconnected = (event: GamepadEvent) => {
        const { gamepad } = event;
        const newConnectedGamepads = { ...state.connectedGamepads };
        delete newConnectedGamepads[gamepad.id];
        dispatch(updateConnectedGamepads(newConnectedGamepads));
    };

    const processGamepadInput = () => {
        const gamepads = navigator.getGamepads();

        gamepads.forEach((gamepad) => {
            if (!gamepad) return;

            // Skip if no new input since last frame
            if (lastTimestamps.current[gamepad.id] === gamepad.timestamp)
                return;
            lastTimestamps.current[gamepad.id] = gamepad.timestamp;

            const profile = state.profiles.find(
                (p) => p.id === state.activeProfile,
            );
            if (!profile) return;

            // Process buttons
            gamepad.buttons.forEach((button, index) => {
                if (button.pressed) {
                    const action = profile.buttonMappings[index];
                    if (action) {
                        executeGamepadAction(action);
                    }
                }
            });

            // Process axes
            gamepad.axes.forEach((value, index) => {
                const settings = profile.axisSettings[index];
                if (settings) {
                    const deadzone = settings.deadzone ?? profile.deadzone;
                    if (Math.abs(value) > deadzone) {
                        const adjustedValue = settings.invert ? -value : value;
                        handleAxisInput(index, adjustedValue);
                    } else {
                        // Stop continuous jogging when axis returns to neutral
                        const axisMap: Record<number, 'X' | 'Y' | 'Z' | 'A'> = {
                            0: 'X',
                            1: 'Y',
                            2: 'Z',
                            3: 'A',
                        };
                        const axis = axisMap[index];
                        if (axis) {
                            grblController.current.stopContinuousJog(axis);
                        }
                    }
                }
            });

            // Update state with new gamepad data
            dispatch(
                updateConnectedGamepads({
                    ...state.connectedGamepads,
                    [gamepad.id]: {
                        connected: true,
                        id: gamepad.id,
                        buttons: gamepad.buttons.map((btn, index) => ({
                            index,
                            pressed: btn.pressed,
                            value: btn.value,
                        })),
                        axes: gamepad.axes.map((value, index) => ({
                            index,
                            value,
                            deadzone:
                                profile.axisSettings[index]?.deadzone ??
                                profile.deadzone,
                        })),
                        timestamp: gamepad.timestamp,
                    },
                }),
            );
        });

        frameRef.current = requestAnimationFrame(processGamepadInput);
    };

    const executeGamepadAction = (action: GamepadAction) => {
        switch (action.type) {
            case 'JOG_CONTINUOUS':
                if (action.axis) {
                    grblController.current.startContinuousJog(
                        action.axis,
                        1,
                        state.jogSpeed,
                    );
                }
                break;
            case 'JOG_INCREMENT':
                if (action.axis) {
                    grblController.current.jogIncremental(
                        action.axis,
                        state.jogIncrement,
                        state.jogSpeed,
                    );
                }
                break;
            case 'FEED_OVERRIDE':
                if (typeof action.value === 'number') {
                    grblController.current.setFeedOverride(action.value);
                }
                break;
            case 'RAPID_OVERRIDE':
                if (typeof action.value === 'number') {
                    grblController.current.setRapidOverride(action.value);
                }
                break;
            case 'SPINDLE_OVERRIDE':
                if (typeof action.value === 'number') {
                    grblController.current.setSpindleOverride(action.value);
                }
                break;
            case 'CUSTOM_COMMAND':
                if (action.command) {
                    onSendGrblCommand(action.command);
                }
                break;
        }
    };

    const handleAxisInput = (axisIndex: number, value: number) => {
        const profile = state.profiles.find(
            (p) => p.id === state.activeProfile,
        );
        if (!profile) return;

        const axisSettings = profile.axisSettings[axisIndex];
        if (!axisSettings) return;

        // Map axis index to GRBL axis
        const axisMap: Record<number, 'X' | 'Y' | 'Z' | 'A'> = {
            0: 'X', // Left/Right
            1: 'Y', // Up/Down
            2: 'Z', // Triggers
            3: 'A', // Additional axis if available
        };

        const axis = axisMap[axisIndex];
        if (!axis) return;

        const adjustedValue = value * axisSettings.sensitivity;
        if (state.jogMode === 'continuous') {
            if (Math.abs(adjustedValue) > axisSettings.deadzone) {
                grblController.current.startContinuousJog(
                    axis,
                    Math.sign(adjustedValue),
                    state.jogSpeed,
                );
            } else {
                grblController.current.stopContinuousJog(axis);
            }
        } else {
            const incrementalDistance = adjustedValue * state.jogIncrement;
            if (Math.abs(incrementalDistance) > axisSettings.deadzone) {
                grblController.current.jogIncremental(
                    axis,
                    incrementalDistance,
                    state.jogSpeed,
                );
            }
        }
    };

    useEffect(() => {
        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener(
            'gamepaddisconnected',
            handleGamepadDisconnected,
        );
        frameRef.current = requestAnimationFrame(processGamepadInput);

        return () => {
            window.removeEventListener(
                'gamepadconnected',
                handleGamepadConnected,
            );
            window.removeEventListener(
                'gamepaddisconnected',
                handleGamepadDisconnected,
            );
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [state.activeProfile, state.profiles]);

    return {
        state,
        addProfile: (profile: GamepadProfile) =>
            dispatch(registerProfile(profile)),
        updateProfile: (profile: GamepadProfile) =>
            dispatch(updateProfile(profile)),
        deleteProfile: (profileId: string) =>
            dispatch(deleteProfile(profileId)),
        setActiveProfile: (profileId: string | null) =>
            dispatch(setActiveProfile(profileId)),
        updateJogSettings: (
            settings: Partial<
                Pick<
                    GamepadManagerState,
                    'jogSpeed' | 'jogMode' | 'jogIncrement'
                >
            >,
        ) => dispatch(updateJogSettings(settings)),
    };
};
