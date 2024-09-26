import React, { useEffect } from 'react';

import styles from '../index.styl';

import Gamepad from './Gamepad';
import { GamepadContextProvider } from './components/Context';
import ModalRender from './ModalRender';
import { collectUserUsageData } from '../../../../lib/heatmap';
import { USAGE_TOOL_NAME } from '../../../../constants';

const GamepadWrapper = () => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.SHORTCUTS.GAMEPAD);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    return (
        <GamepadContextProvider>
            <div className={styles.container}>
                <Gamepad />
                <ModalRender />
            </div>
        </GamepadContextProvider>
    );
};

export default GamepadWrapper;
