import React, { useState } from 'react';

import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToolModal from 'app/components/ToolModal/ToolModal';
import Button from 'app/components/FunctionButton/FunctionButton';
import reduxStore from 'app/store/redux';
import get from 'lodash/get';
import { ROTARY_AXIS_101_VALUE, WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';
import styles from './index.styl';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const StepsToggle = () => {
    const [workspaceMode, setWorkspaceMode] = useState(store.get('workspace.mode', DEFAULT));
    // eslint-disable-next-line no-unused-vars
    const [wiringNotification, setWiringNotification] = useState(false);
    const firmwareType = get(reduxStore.getState(), 'controller.type');
    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;
        setWorkspaceMode(newMode);
        updateWorkspaceMode(newMode);

        if (firmwareType === 'Grbl') {
            setWiringNotification(true);
        }
    };

    return (
        <>
            <Tooltip
                content={`Enabling rotary axis mode will update your $101 value to ${ROTARY_AXIS_101_VALUE} steps per mm`}
                location="default"
            >
                <ToggleSwitch
                    label="Rotary Axis Mode"
                    checked={workspaceMode === ROTARY}
                    onChange={handleToggle}
                    size="small"
                    style={{ marginBottom: '1rem' }}
                />
            </Tooltip>
            {wiringNotification ? (
                <ToolModal
                    title="Wiring change"
                    size="xs"
                    onClose={() => setWiringNotification(false)}
                >
                    <div className={styles.wiringMessage}>
                        Rotary mode turned {workspaceMode === ROTARY ? 'ON' : 'OFF'}. Please make sure you have correct wiring for the new setup.
                        <Button
                            primary
                            onClick={() => setWiringNotification(false)}
                            style={{ maxWidth: '10rem',
                                margin: '1rem auto' }}
                        >OK
                        </Button>
                    </div>
                </ToolModal>
            ) : ''}
        </>
    );
};

export default StepsToggle;
