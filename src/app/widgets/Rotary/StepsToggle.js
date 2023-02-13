import React, { useState } from 'react';

import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { ROTARY_AXIS_101_VALUE, WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const StepsToggle = () => {
    const [workspaceMode, setWorkspaceMode] = useState(store.get('workspace.mode', DEFAULT));

    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;

        setWorkspaceMode(newMode);
        updateWorkspaceMode(newMode);
    };

    return (
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
    );
};

export default StepsToggle;
