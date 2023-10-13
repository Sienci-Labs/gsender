import React from 'react';

import styles from '../index.styl';

import Gamepad from './Gamepad';
import { GamepadContextProvider } from './components/Context';
import ModalRender from './ModalRender';

const GamepadWrapper = () => {
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
