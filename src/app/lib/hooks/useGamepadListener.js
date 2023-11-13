import { useState, useEffect } from 'react';

import gamepad from 'app/lib/gamepad';

export const useGamepadListener = ({ profile, axisThreshold } = {}) => {
    const [buttons, setButtons] = useState([]);
    const [axes, setAxes] = useState(null);

    useEffect(() => {
        gamepad.start();

        gamepad.on('gamepad:button', validator(buttonListener));
        gamepad.on('gamepad:axis', validator(axisListener));

        return () => {
            gamepad.removeEventListener('gamepad:button', validator(buttonListener));
            gamepad.removeEventListener('gamepad:axis', validator(axisListener));
        };
    }, []);

    const validator = (givenListener) => ({ detail }) => {
        const { gamepad } = detail;

        if (profile && !profile.includes(gamepad.id)) {
            console.error('Gamepad profile not found');
            return null;
        }

        return givenListener(detail);
    };

    const buttonListener = (detail) => {
        setButtons(detail.gamepad.buttons);
    };

    const axisListener = (detail) => {
        const { gamepad } = detail;

        if (!axisThreshold) {
            setAxes(gamepad.axes);
            return;
        }

        // Map values under threshold to zero for easier hook usage when determining whether
        // that certain axis was changed or not
        setAxes(gamepad.axes.map(axis => (Math.abs(axis) < axisThreshold ? 0 : axis)));
    };

    return { buttons, axes };
};
