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
            title="Help with Gamepad"
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
                <p>
                    Your gamepad setup needs to work correctly for shortcuts to behave as expected.{' '}
                    If you are experiencing issues, use this online diagnostics tool to verify its stability:
                </p>

                <a href="https://hardwaretester.com/gamepad" target="_blank" rel="noopener noreferrer">
                    Hardware Tester
                </a>
            </div>
        </ToolModal>
    );
};

export default HelpModal;
