import { useState, useEffect, useRef } from 'react';

type GamepadButtonState = {
    pressed: boolean;
    value: number;
};

type GamepadAxisState = number;

type GamepadState = {
    buttons: GamepadButtonState[];
    axes: GamepadAxisState[];
    connected: boolean;
    id: string;
};

const useGamepad = (gamepadID: string) => {
    const [gamepad, setGamepad] = useState<Gamepad | null>(null);
    const [gamepadState, setGamepadState] = useState<GamepadState | null>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const handleGamepadConnected = (event: GamepadEvent) => {
            console.log(event.gamepad, gamepadID);
            if (event.gamepad.id === gamepadID) {
                setGamepad(event.gamepad);
            }
        };

        const handleGamepadDisconnected = (event: GamepadEvent) => {
            if (event.gamepad.id === gamepadID) {
                setGamepad(null);
                setGamepadState(null);
            }
        };

        const updateGamepadState = () => {
            const gamepads = navigator.getGamepads();
            const currentGamepad = Array.from(gamepads).find(
                (gp) => gp !== null && gp.id === gamepadID,
            );

            if (currentGamepad) {
                // Only update gamepad reference if it's different
                if (gamepad !== currentGamepad) {
                    setGamepad(currentGamepad);
                }

                // Check if state has actually changed before updating
                const newState = {
                    buttons: Array.from(currentGamepad.buttons).map(
                        (button) => ({
                            pressed: button.pressed,
                            value: button.value,
                        }),
                    ),
                    axes: Array.from(currentGamepad.axes),
                    connected: true,
                    id: currentGamepad.id,
                };

                // Only update state if it's different from current state
                if (
                    !gamepadState ||
                    JSON.stringify(gamepadState.buttons) !==
                        JSON.stringify(newState.buttons) ||
                    JSON.stringify(gamepadState.axes) !==
                        JSON.stringify(newState.axes) ||
                    gamepadState.connected !== newState.connected ||
                    gamepadState.id !== newState.id
                ) {
                    setGamepadState(newState);
                }
            }

            frameRef.current = requestAnimationFrame(updateGamepadState);
        };

        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener(
            'gamepaddisconnected',
            handleGamepadDisconnected,
        );

        // Check if the gamepad is already connected
        const gamepads = navigator.getGamepads();
        const existingGamepad = Array.from(gamepads).find(
            (gp) => gp !== null && gp.id === gamepadID,
        );

        if (existingGamepad) {
            setGamepad(existingGamepad);
        }

        frameRef.current = requestAnimationFrame(updateGamepadState);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            window.removeEventListener(
                'gamepadconnected',
                handleGamepadConnected,
            );
            window.removeEventListener(
                'gamepaddisconnected',
                handleGamepadDisconnected,
            );
        };
    }, [gamepadID]);

    return { gamepad, gamepadState };
};

export default useGamepad;
