import React, { useContext } from 'react';

import ToolModal from 'app/components/ToolModal/ToolModal';
import { GamepadContext } from './utils/context';
import { setCurrentModal } from './utils/actions';

const HelpModal = () => {
    const { dispatch } = useContext(GamepadContext);

    const closeModal = () => dispatch(setCurrentModal(null));

    return (
        <ToolModal
            onClose={closeModal}
            size="xs"
            title="Gamepad Help"
        >
            <div style={{ padding: '1rem' }}>
                <p>If you are experiencing issues connecting or using your gamepad, refer to this online diagnostics tool and verify if it is working there:</p>

                <a href="https://hardwaretester.com/gamepad" target="_blank" rel="noopener noreferrer">
                    Hardware Tester
                </a>
            </div>
        </ToolModal>
    );
};

export default HelpModal;
