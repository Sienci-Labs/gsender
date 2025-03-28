import React, { useEffect } from 'react';

import Gamepad from './Gamepad';
import { GamepadContextProvider } from './components/Context';
import ModalRender from './ModalRender';

const GamepadWrapper = () => {
    return (
        <GamepadContextProvider>
            <div>
                <Gamepad />
                <ModalRender />
            </div>
        </GamepadContextProvider>
    );
};

export default GamepadWrapper;
