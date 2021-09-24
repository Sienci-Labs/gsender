import React from 'react';

import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
} from 'app/constants';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Fieldset from '../components/Fieldset';

import styles from '../index.styl';

const Workspace = ({ state, actions }) => {
    const { units, reverseWidgets } = state;

    return (
        <Fieldset legend="Workspace">
            <div className={styles.addMargin}>
                <RadioGroup
                    name="units"
                    value={units}
                    depth={2}
                    onChange={(value, event) => actions.general.setUnits(value)}
                    size="small"
                >
                    <div>
                        <RadioButton className={styles.prefferedradio} label="Inches (G20)" value={IMPERIAL_UNITS} />
                        <RadioButton className={styles.prefferedradio} label="Millimeters (G21)" value={METRIC_UNITS} />
                    </div>
                </RadioGroup>
                <small className={styles['item-info']}>Units to be displayed throughout the interface</small>
            </div>
            <div className={styles.addMargin}>
                <Tooltip content="Flip the location of the Visualizer with Machine Controls" location="default">
                    <ToggleSwitch
                        label="Reverse workspace layout"
                        checked={reverseWidgets}
                        onChange={() => actions.general.setReverseWidgets()}
                        size="small"
                    />
                </Tooltip>
            </div>
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
