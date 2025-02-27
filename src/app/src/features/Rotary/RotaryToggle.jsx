import React, { useState, useEffect, useRef } from 'react';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

import store from 'app/store';
import controller from 'app/lib/controller';
import ToggleSwitch from 'app/components/Switch';
import { WORKSPACE_MODE, GRBLHAL } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';

const { DEFAULT, ROTARY } = WORKSPACE_MODE;

const RotaryToggle = ({ disabled }) => {
    const focusedEl = useRef(null);
    const [workspaceMode, setWorkspaceMode] = useState(
        store.get('workspace.mode', DEFAULT),
    );
    const { type: controllerType } = useSelector((state) => state.controller);

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

    useEffect(() => {
        // for some reason react-switch forces focus on a nested "input" component that i am unable to access the ref for
        // the only way to get out of that focus is to click within the rotary widget
        // or... do this :)
        focusedEl.current = document.activeElement;
        focusedEl.current.blur();
    }, [workspaceMode]); // whenever the workspace mode updates (when the switch is toggled), change the active element to the document body

    const handleToggle = (toggled) => {
        const newMode = toggled ? ROTARY : DEFAULT;
        updateWorkspaceMode(newMode);
        controller.command('updateRotaryMode', newMode === ROTARY);
    };

    return (
        <ToggleSwitch
            label={controllerType === GRBLHAL ? '4th Axis' : undefined}
            secondaryLabel="Rotary"
            checked={workspaceMode === ROTARY}
            onChange={handleToggle}
            size="small"
            style={{ marginBottom: '1rem' }}
            disabled={disabled}
        />
    );
};

export default RotaryToggle;
