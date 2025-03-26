import { useState, useEffect } from 'react';

import GamepadManager from '../gamepad';
import { GamepadDetail } from '../gamepad/definitions';

export const useGamepadListener = ({
    profile,
    axisThreshold,
}: {
    profile: string[];
    axisThreshold: number;
}) => {
    const [buttons, setButtons] = useState<Array<GamepadButton>>([]);
    const [axes, setAxes] = useState(null);

    useEffect(() => {
        const gamepad = GamepadManager.getInstance();

        gamepad.on('gamepad:button', buttonListener);
        gamepad.on('gamepad:axis', axisListener);

        return () => {
            gamepad.off('gamepad:button', buttonListener);
            gamepad.off('gamepad:axis', axisListener);
        };
    }, []);

    const buttonListener = ({ detail }: GamepadDetail): void => {
        const { gamepad } = detail;

        if (profile && !profile.includes(gamepad.id)) {
            console.error('Gamepad profile not found');
            return;
        }

        setButtons([...detail.gamepad.buttons]);
    };

    const axisListener = ({ detail }: { detail: GamepadDetail }): void => {
        const { gamepad } = detail.detail;

        if (profile && !profile.includes(gamepad.id)) {
            console.error('Gamepad profile not found');
            return;
        }

        // Map values under threshold to zero for easier hook usage when determining whether
        // that certain axis was changed or not
        setAxes(
            gamepad.axes.map((axis) =>
                Math.abs(axis) < axisThreshold ? 0 : axis,
            ),
        );
    };

    return { buttons, axes };
};
