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
                <small className={styles['item-info']}>What units would you like gSender to show you?</small>
            </div>
            <div className={styles.addMargin}>
                <Tooltip content="Flip the location of the Visualizer with Machine Controls" location="default">
                    <ToggleSwitch
                        label="Visualizer on right Side"
                        checked={reverseWidgets}
                        onChange={() => actions.general.setReverseWidgets()}
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default Workspace;
