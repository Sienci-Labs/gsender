import React from 'react';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Fieldset from '../components/Fieldset';

const Workspace = ({ state, actions }) => {
    return (
        <Fieldset legend="Workspace">
            <div style={{ marginBottom: '10px' }}>
                <Tooltip content="gSender will warn you on file load if any invalid commands are found" location="default">
                    <ToggleSwitch
                        label="Warn if file contains invalid G-Code"
                        checked={state.showWarning}
                        onChange={() => actions.general.setShowWarning(!state.showWarning)}
                        size="small"
                    />
                </Tooltip>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <Tooltip content="gSender will warn you while running if any invalid commands are found" location="default">
                    <ToggleSwitch
                        label="Warn if invalid line detected during job"
                        checked={state.showLineWarnings}
                        onChange={() => actions.general.setShowLineWarnings(!state.showLineWarnings)}
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default Workspace;
