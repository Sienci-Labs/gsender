import React, { useState } from 'react';

import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { ROTARY_AXIS_101_VALUE, WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';
import { useSelector } from 'react-redux';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const StepsToggle = () => {
    const [workspaceMode, setWorkspaceMode] = useState(store.get('workspace.mode', DEFAULT));
    // const firmwareType = get(reduxStore.getState(), 'controller.type');
    const firmwareType = useSelector(state => state.controller.type);
    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;
        setWorkspaceMode(newMode);
        updateWorkspaceMode(newMode);
        if (firmwareType === 'Grbl') {
            // setWiringNotification(true);
            Confirm({ title: 'Wiring change',
                cancelLabel: null,
                confirmLabel: 'OK',
                content: `Rotary mode turned ${toggled ? 'ON' : 'OFF'}. Please make sure you have correct wiring for the new setup.` });
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
        </>
    );
};

export default StepsToggle;
