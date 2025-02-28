import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'app/store/redux';

import { JogAxis } from './types';

import controller from 'app/lib/controller';

type AxisConfig = {
    axisIndex: number;
    invert?: boolean;
    sensitivity?: number;
    deadzone?: number;
    onMove?: (value: number) => void;
    onMoveStart?: () => void;
    onMoveEnd?: () => void;
};

type JogConfig = {
    axis: JogAxis;
    feedRate: number;
    mode: 'continuous' | 'incremental';
    increment?: number;
};

export function useGamepadAxis(config: AxisConfig, jogConfig?: JogConfig) {
    const isEditing = useSelector(
        (state: RootState) => state.gamepad.isEditing,
    );
    const lastValue = useRef<number>(0);
    const isMoving = useRef<boolean>(false);

    useEffect(() => {
        if (isEditing) return;

        const processAxis = (gamepad: Gamepad) => {
            const value = gamepad.axes[config.axisIndex] ?? 0;
            const adjustedValue = config.invert ? -value : value;
            const deadzone = config.deadzone ?? 0.1;

            if (Math.abs(adjustedValue) > deadzone) {
                const normalizedValue =
                    (Math.abs(adjustedValue) - deadzone) / (1 - deadzone);
                const scaledValue =
                    normalizedValue *
                    Math.sign(adjustedValue) *
                    (config.sensitivity ?? 1);

                if (!isMoving.current) {
                    isMoving.current = true;
                    config.onMoveStart?.();
                }

                if (jogConfig) {
                    handleJog(scaledValue, jogConfig);
                } else {
                    config.onMove?.(scaledValue);
                }

                lastValue.current = scaledValue;
            } else if (isMoving.current) {
                isMoving.current = false;
                config.onMoveEnd?.();
                lastValue.current = 0;

                if (jogConfig?.mode === 'continuous') {
                    // Stop continuous jogging when axis returns to neutral
                    controller.command('jog:stop');
                }
            }
        };

        const handleGamepadInput = () => {
            const gamepads = navigator.getGamepads();
            gamepads.forEach((gamepad) => {
                if (gamepad) {
                    processAxis(gamepad);
                }
            });
            frameRef.current = requestAnimationFrame(handleGamepadInput);
        };

        const frameRef = { current: requestAnimationFrame(handleGamepadInput) };

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            if (isMoving.current) {
                config.onMoveEnd?.();
                if (jogConfig?.mode === 'continuous') {
                    controller.command('jog:stop');
                }
            }
        };
    }, [config, jogConfig, isEditing]);
}

function handleJog(value: number, config: JogConfig) {
    if (!controller.connected) return;

    if (config.mode === 'continuous') {
        // For continuous jogging, use the value to determine speed
        const jogSpeed = value * config.feedRate;
        controller.command('jog:start', {
            axis: config.axis,
            feedRate: Math.abs(jogSpeed),
            direction: Math.sign(jogSpeed),
        });
    } else if (config.mode === 'incremental' && config.increment) {
        // For incremental jogging, use the value to determine increment size
        const distance = value * config.increment;
        controller.command('jog:move', {
            axis: config.axis,
            distance,
            feedRate: config.feedRate,
        });
    }
}
