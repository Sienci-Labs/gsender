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

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import classNames from 'classnames';

import styles from '../index.styl';
import AddProbe from './AddProbe';
import TooltipCustom from '../../../components/TooltipCustom/ToolTip';

import Tools from '../Tools/Tools';

import Fieldset from '../FieldSet';
import Input from '../Input';
import ToggleSwitch from '../../../components/ToggleSwitch';


const ProbeSettings = ({ active, state, actions }) => {
    const { probeSettings, probe, units } = state;
    const { functions } = probe;
    const probeActions = actions.probe;

    const values = {
        length: units === 'mm' ? probe.plateLength.mm : probe.plateLength.in,
        width: units === 'mm' ? probe.plateWidth.mm : probe.plateWidth.in,
        xyThickness: units === 'mm' ? probe.xyThickness.mm : probe.xyThickness.in,
        zThickness: units === 'mm' ? probe.zThickness.mm : probe.zThickness.in,
        fastFeedrate: units === 'mm' ? probeSettings.fastFeedrate.mm : probeSettings.fastFeedrate.in,
        normalFeedrate: units === 'mm' ? probeSettings.normalFeedrate.mm : probeSettings.normalFeedrate.in,
        retractionDistance: units === 'mm' ? probeSettings.retractionDistance.mm : probeSettings.retractionDistance.in,
    };

    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles['settings-title']}>Probe</h3>
            <div className={styles.generalArea}>
                <div style={{ width: '48%' }}>
                    <Fieldset legend="Probing Settings">
                        <TooltipCustom content="Specify starting point between Touch Plate and Tool" location="default">
                            <Input
                                label="Fast Find"
                                value={values.fastFeedrate}
                                onChange={probeActions.changeFastFeedrate}
                                additionalProps={{ type: 'number', id: 'fastFeedrate' }}
                                units={units}
                            />
                        </TooltipCustom>
                        <TooltipCustom content="Specify starting point between Touch Plate and Tool" location="default">
                            <Input
                                label="Slow Find"
                                value={values.normalFeedrate}
                                onChange={probeActions.changeNormalFeedrate}
                                additionalProps={{ type: 'number', id: 'normalFeedrate' }}
                                units={units}
                            />
                        </TooltipCustom>
                        <TooltipCustom content="Specify how high the head lifts while probing" location="default">
                            <Input
                                label="Retraction"
                                value={values.retractionDistance}
                                onChange={probeActions.changeRetractionDistance}
                                additionalProps={{ type: 'number', id: 'retraction' }}
                                units={units}
                            />
                        </TooltipCustom>
                        <TooltipCustom content="Toggle check to see if your probe is connected correctly" location="default">
                            <div className={styles.inputSpread}>
                                <label htmlFor="probeConnectivityTest">Probe connectivity test</label>
                                <ToggleSwitch
                                    checked={probeSettings.connectivityTest}
                                    onChange={probeActions.changeConnectivityTest}
                                />
                            </div>
                        </TooltipCustom>
                    </Fieldset>

                    <Fieldset legend="Touch Plate" className={styles['mb-0']}>
                        <AddProbe actions={actions} state={state} />

                        {
                            (functions.x && functions.y) && (
                                <div>
                                    <TooltipCustom content="Specify the length of your Touchplate" location="default">
                                        <Input
                                            label="Length"
                                            value={values.length}
                                            units={units}
                                            onChange={probeActions.changePlateLength}
                                            additionalProps={{ type: 'number', id: 'plateLength' }}
                                        />
                                    </TooltipCustom>
                                    <TooltipCustom content="Specify the width of your Touchplate" location="default">
                                        <Input
                                            label="Width"
                                            value={values.width}
                                            units={units}
                                            onChange={probeActions.changePlateWidth}
                                            additionalProps={{ type: 'number', id: 'plateWidth' }}
                                        />
                                    </TooltipCustom>
                                </div>
                            )
                        }

                    </Fieldset>

                </div>

                <div style={{ width: '48%' }}>
                    <Tools state={state} actions={actions} />
                </div>
            </div>
        </div>
    );
};

export default ProbeSettings;
