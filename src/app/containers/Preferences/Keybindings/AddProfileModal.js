import React, { useState } from 'react';
// import Select from 'react-select';

// import store from 'app/store';
import ToolModal from 'app/components/ToolModal/ToolModal';
import Button from 'app/components/FunctionButton/FunctionButton';

// import styles from './index.styl';
import gamepad from '../../../lib/gamepad';

const AddProfileModal = ({ onClose }) => {
    const [gamepadInfo, setGamepadInfo] = useState([]);

    gamepad.on('gamepad:connect', (e) => {
        console.log(e);

        setGamepadInfo(e);

        console.log(gamepadInfo);
    });

    return (
        <ToolModal onClose={onClose} size="medium" title="Add Gamepad/Joystick Profile" style={{ height: '500px' }}>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                <p>Connect your device and press button on it</p>

                <Button primary>Add New Profile</Button>
            </div>
        </ToolModal>
    );
};

export default AddProfileModal;
