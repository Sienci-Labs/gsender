/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React from 'react';
import classNames from 'classnames';
import ToggleSwitch from 'app/components/ToggleSwitch';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import i18n from 'app/lib/i18n';
import styles from './index.styl';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
} from '../../constants';
import JogSpeeds from './General/JogSpeeds';
import TooltipCustom from '../../components/TooltipCustom/ToolTip';
import MachineProfileOptions from './MachineProfiles/Options';
import Fieldset from './FieldSet';
import Baudrates from './General/Baudrates';
import Input from './Input';

const GeneralSettings = ({ active, state, actions }) => {
    const { units, reverseWidgets, autoReconnect, safeRetractHeight } = state;
    let baudRateDisabled = true;
    if (state.controller.type === '') {
        baudRateDisabled = false;
    }

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
                            <TooltipCustom content="Machine must be disconnected to change this value" location="top" disabled={!baudRateDisabled}>
                                <TooltipCustom content="Baudrate specifies how fast data is sent over a serial line." location="bottom">
                                    <div className={baudRateDisabled ? styles.disabled : styles.addMargin}>
                                        <Baudrates baudrate={state.baudrate} onChange={(option) => actions.general.setBaudrate(option)} />
                                        <br />
                                    </div>
                                </TooltipCustom>
                            </TooltipCustom>
                            <div className={styles.reconnect}>
                                <TooltipCustom content="Reconnect to the last machine you used automatically" location="default">
                                    <ToggleSwitch
                                        label="Re-connect automatically"
                                        checked={autoReconnect}
                                        onChange={() => actions.general.setAutoReconnect()}
                                        size="small"
                                    />
                                </TooltipCustom>
                            </div>
                        </Fieldset>

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
                                        <RadioButton className={styles.prefferedradio} label={i18n._('Inches (G20)')} value={IMPERIAL_UNITS} />
                                        <RadioButton className={styles.prefferedradio} label={i18n._('Millimeters (G21)')} value={METRIC_UNITS} />
                                    </div>
                                </RadioGroup>
                                <small className={styles['item-info']}>Units to be displayed throughout the interface</small>
                            </div>
                            <div className={styles.addMargin}>
                                <TooltipCustom content="Flip the location of the Visualizer with Machine Controls" location="default">
                                    <ToggleSwitch
                                        label="Reverse workspace layout"
                                        checked={reverseWidgets}
                                        onChange={() => actions.general.setReverseWidgets()}
                                        size="small"
                                    />
                                </TooltipCustom>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <TooltipCustom content="gSender will warn you on file load if any errorous commands are found in your file" location="default">
                                    <ToggleSwitch
                                        label="Warn if file contains invalid G-Code"
                                        checked={state.showWarning}
                                        onChange={() => actions.general.setShowWarning(!state.showWarning)}
                                        size="small"
                                    />
                                </TooltipCustom>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <TooltipCustom content="gSender will warn you while running if any errorous commands are found in your file" location="default">
                                    <ToggleSwitch
                                        label="Warn if invalid line detected during job"
                                        checked={state.showLineWarnings}
                                        onChange={() => actions.general.setShowLineWarnings(!state.showLineWarnings)}
                                        size="small"
                                    />
                                </TooltipCustom>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Jog Speed Presets">
                            <JogSpeeds />
                        </Fieldset>
                    </div>
                    <div style={{ width: '48%' }}>
                        <Fieldset legend="Machine Profile" className={styles['mb-0']}>
                            <MachineProfileOptions state={state} />
                        </Fieldset>
                        <Fieldset legend="Movement">
                            <TooltipCustom content="Amount Z-Axis will move before making any X/Y-Axis movements" location="default">
                                <Input
                                    label="Safe Height"
                                    units={units}
                                    value={safeRetractHeight}
                                    onChange={(e) => actions.general.setSafeRetractHeight(e)}
                                    additionalProps={{ name: 'safeRetractHeight', type: 'number' }}
                                />
                            </TooltipCustom>
                        </Fieldset>

                    </div>
                </div>
            </div>

        </div>
    );
};

export default GeneralSettings;
