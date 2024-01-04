import React, { useState, useEffect } from 'react';

import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import { WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';
import { get } from 'lodash';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const RotaryToggle = () => {
    const [workspaceMode, setWorkspaceMode] = useState(store.get('workspace.mode', DEFAULT));

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
            store.removeListener('change', updateWorkspaceMode);
        };
    }, []);

    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;
        updateWorkspaceMode(newMode);
    };

    return (
        <ToggleSwitch
            label="4th Axis"
            secondaryLabel="Rotary"
            checked={workspaceMode === ROTARY}
            onChange={handleToggle}
            size="small"
            style={{ marginBottom: '1rem' }}
        />
    );
};

export default RotaryToggle;
