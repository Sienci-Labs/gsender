import React, {
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';
import classnames from 'classnames';

import Tooltip from 'app/components/Tooltip';

import styles from '../index.module.styl';

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
        <Tooltip
            content="Button press indicator, animates when a button is pressed on your gamepad"
            wrapperClassName={classnames(styles.activeIndicator, {
                [styles.activeIndicatorOn]: detectedButtonPress,
            })}
        >
            <i
                className={classnames('fas fa-gamepad', {
                    [styles.activePulse]: detectedButtonPress,
                })}
            />
        </Tooltip>
    );
});

export default Listener;
