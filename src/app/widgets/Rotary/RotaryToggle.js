import React, { useState, useEffect } from 'react';

import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const currentMode = store.get('workspace.mode', DEFAULT);

const RotaryToggle = () => {
    const [workspaceMode, setWorkspaceMode] = useState(currentMode);

    useEffect(() => {
        const newMode = store.get('workspace.mode', DEFAULT);
        setWorkspaceMode(newMode);
    }, [store.get('workspace.mode', DEFAULT)]);

    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;
        setWorkspaceMode(newMode);
        updateWorkspaceMode(newMode);
    };

    return (
        <>
            <Tooltip
                content="Enabling rotary mode will update your firmware settings"
                location="default"
            >
                <ToggleSwitch
                    label="Rotary Mode"
                    checked={workspaceMode === ROTARY}
                    onChange={handleToggle}
                    size="small"
                    style={{ marginBottom: '1rem' }}
                />
            </Tooltip>
        </>
    );
};

export default RotaryToggle;
