import React, { useState, useEffect } from 'react';

import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';
import { get } from 'lodash';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const currentMode = store.get('workspace.mode', DEFAULT);

const RotaryToggle = () => {
    const [workspaceMode, setWorkspaceMode] = useState(currentMode);

    useEffect(() => {
        const updateWorkspaceMode = (data) => {
            const mode = get(data, 'workspace.mode', null);

            if (!mode) {
                return;
            }

            setWorkspaceMode(mode);
        };

        store.on('change', updateWorkspaceMode);

        return () => {
            store.removeListener(updateWorkspaceMode);
        };
    }, []);

    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;
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
