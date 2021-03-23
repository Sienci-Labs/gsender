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
import Baudrates from './General/Baudrates';
import Input from './Input';

const GeneralSettings = ({ active, state, actions }) => {
    const { units, reverseWidgets, autoReconnect, safeRetractHeight } = state;
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
                    <div className={styles.halfContainer}>
                        <Fieldset legend="Connection">
                            <div className={styles.addMargin}>
                                <Baudrates baudrate={state.baudrate} onChange={(option) => actions.general.setBaudrate(option)} />
                                <br />
                                <ToggleSwitch
                                    checked={autoReconnect}
                                    onChange={() => actions.general.setAutoReconnect()}
                                />
                                <small className={styles['item-info']}>Re-connect automatically</small>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Workspace">
                            <div className={styles.addMargin}>
                                <RadioGroup
                                    name="units"
                                    value={units}
                                    depth={2}
                                    onChange={(value, event) => actions.general.setUnits(value)}
                                >
                                    <div>
                                        <RadioButton className={styles.prefferedradio} label={i18n._('Inches (G20)')} value={IMPERIAL_UNITS} />
                                        <RadioButton className={styles.prefferedradio} label={i18n._('Millimeters (G21)')} value={METRIC_UNITS} />
                                    </div>
                                </RadioGroup>
                                <small className={styles['item-info']}>Units to be displayed throughout the interface</small>
                            </div>
                            <div className={styles.addMargin}>
                                <ToggleSwitch
                                    checked={reverseWidgets}
                                    onChange={() => actions.general.setReverseWidgets()}
                                />
                                <small className={styles['item-info']}>Reverse workspace layout</small>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <ToggleSwitch
                                    checked={state.showWarning}
                                    onChange={() => actions.general.setShowWarning(!state.showWarning)}
                                />
                                <small className={styles['item-info']}>Warn if file contains invalid G-Code</small>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 5fr' }}>
                                <ToggleSwitch
                                    checked={state.showLineWarnings}
                                    onChange={() => actions.general.setShowLineWarnings(!state.showLineWarnings)}
                                />
                                <small className={styles['item-info']}>Warn if invalid line is detected during job run</small>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Jog Speed Presets">
                            <JogSpeeds />
                        </Fieldset>
                    </div>
                    <div style={{ width: '48%' }}>
                        <Fieldset legend="Machine Profile" className={styles['mb-0']}>
                            <MachineProfileOptions />
                        </Fieldset>
                        <Fieldset legend="Movement">
                            <Input
                                label="Safe Height"
                                units={units}
                                value={safeRetractHeight}
                                onChange={(e) => actions.general.setSafeRetractHeight(e)}
                                additionalProps={{ name: 'safeRetractHeight', type: 'number' }}
                            />
                        </Fieldset>

                    </div>
                </div>
            </div>

        </div>
    );
};

export default GeneralSettings;
