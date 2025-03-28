import React, {
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';

import { Tooltip } from 'app/components/Tooltip';

const queue = [];

const Listener = forwardRef((props, ref) => {
    const [detectedButtonPress, setDetectedButtonPress] = useState(false);
    useImperativeHandle(ref, () => ({ handleButtonPress }));
    useEffect(() => {
        return () => {
            clearTimeouts();
        };
    }, []);

    const clearTimeouts = () => {
        queue.forEach((item) => clearTimeout(item));
    };

    const handleButtonPress = () => {
        setDetectedButtonPress(true);

        const timeout = () => {
            setDetectedButtonPress(false);
        };

        clearTimeouts();

        queue.push(setTimeout(timeout, 3000));
    };

    return (
        <Tooltip content="Button press indicator, animates when a button is pressed on your gamepad">
            <div
                className={`flex items-center justify-center p-4 rounded-full bg-gray-200 ${detectedButtonPress ? 'bg-blue-500' : ''}`}
            >
                <i
                    className={`fas fa-gamepad text-2xl ${detectedButtonPress ? 'text-white animate-pulse' : 'text-gray-700'}`}
                />
            </div>
        </Tooltip>
    );
});

Listener.displayName = 'Listener';

export default Listener;
