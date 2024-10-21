import React from 'react';

import { IMPERIAL_UNITS, METRIC_UNITS } from 'app/constants';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import Tooltip from 'app/components/Tooltip';
import ToggleSwitch from 'app/components/Switch';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

import styles from '../index.module.styl';

const Workspace = ({ state, actions }) => {
    const { units, reverseWidgets, customDecimalPlaces } = state;

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
                        <RadioButton
                            className={styles.prefferedradio}
                            label="Inches"
                            value={IMPERIAL_UNITS}
                        />
                        <RadioButton
                            className={styles.prefferedradio}
                            label="Millimeters"
                            value={METRIC_UNITS}
                        />
                    </div>
                </RadioGroup>
                <small className={styles['item-info']}>
                    What units would you like gSender to show you?
                </small>
            </div>
            <div className={styles.addMargin}>
                <Tooltip
                    content="Flip the location of the Visualizer with Machine Controls"
                    location="default"
                >
                    <ToggleSwitch
                        label="Visualizer on Right Side"
                        checked={reverseWidgets}
                        onChange={() => actions.general.setReverseWidgets()}
                        size="small"
                    />
                </Tooltip>
            </div>
            <div className={styles.addMargin}>
                <Tooltip
                    content="Default Value = 0 (2 decimal places for mm and 3 for inches). Anything other than 0 sets both MM and Inches to the selected decimal places. Min = 1, Max = 5"
                    location="default"
                >
                    <Input
                        label="DRO Zeros"
                        value={customDecimalPlaces}
                        onChange={(e) =>
                            actions.general.setCustomDecimalPlaces(e)
                        }
                        additionalProps={{
                            name: 'customDecimalPlaces',
                            type: 'number',
                            min: '0',
                            max: '4',
                        }}
                        hasRounding={false}
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default Workspace;
