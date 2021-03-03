import React from 'react';
import classNames from 'classnames';
// import Dropdown, { MenuItem } from 'app/components/Dropdown';
import ToggleSwitch from 'app/components/ToggleSwitch';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import i18n from 'app/lib/i18n';
import styles from './index.styl';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
} from '../../constants';

import JogSpeeds from './General/JogSpeeds';
import MachineProfileOptions from './MachineProfiles/Options';

import Fieldset from './FieldSet';

const GeneralSettings = ({ active, state, actions }) => {
    const { units, reverseWidgets } = state;
    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles.settingsTitle}>
                General
            </h3>
            <div className={styles.toolMain}>

                <div className={styles.generalArea}>
                    <div style={{ width: '50% ' }}>
                        <Fieldset legend="Preferred Units">
                            <RadioGroup
                                name="units"
                                value={units}
                                depth={2}
                                onChange={(value, event) => actions.general.setUnits(value)}
                            >
                                <div>
                                    <RadioButton label={i18n._('Inches (G20)')} value={IMPERIAL_UNITS} />
                                    <RadioButton label={i18n._('Millimeters (G21)')} value={METRIC_UNITS} />
                                </div>
                            </RadioGroup>
                            <small className={styles['item-info']}>Units to be displayed throughout the interface</small>
                        </Fieldset>

                        <Fieldset legend="Machine Profile" className={styles['mb-0']}>
                            <MachineProfileOptions />
                        </Fieldset>
                    </div>

                    <div style={{ width: '50% ' }}>
                        <Fieldset legend="Jog Speed Presets">
                            <JogSpeeds />
                        </Fieldset>

                        <Fieldset legend="Reverse Workspace">
                            <ToggleSwitch
                                checked={reverseWidgets}
                                onChange={() => actions.general.setReverseWidgets()}
                            />
                            <small className={styles['item-info']}>Functionality appears on the left if toggled on.</small>
                        </Fieldset>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default GeneralSettings;
