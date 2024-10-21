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

import Tooltip from 'app/components/Tooltip';
import ToggleSwitch from 'app/components/Switch';
import { TOUCHPLATE_TYPE_AUTOZERO } from 'app/lib/constants';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

import styles from '../index.module.styl';

const ProbeSettings = ({ state, probeActions, values, type }) => {
    const { probeSettings, units } = state;

    return (
        <Fieldset legend="Probing Settings" style={{ height: '100%' }}>
            {type !== TOUCHPLATE_TYPE_AUTOZERO && (
                <>
                    <Tooltip
                        content="Probe speed during initial touch-off"
                        location="default"
                    >
                        <Input
                            label="Fast Find"
                            value={values.fastFeedrate}
                            onChange={probeActions.changeFastFeedrate}
                            additionalProps={{
                                type: 'number',
                                id: 'fastFeedrate',
                            }}
                            units={`${units}/min`}
                        />
                    </Tooltip>
                    <Tooltip
                        content="Probe speed during second touch-off - slower for more accuracy"
                        location="default"
                    >
                        <Input
                            label="Slow Find"
                            value={values.normalFeedrate}
                            onChange={probeActions.changeNormalFeedrate}
                            additionalProps={{
                                type: 'number',
                                id: 'normalFeedrate',
                            }}
                            units={`${units}/min`}
                        />
                    </Tooltip>
                    <Tooltip
                        content="Specify far the probe reverses after a successful touch"
                        location="default"
                    >
                        <Input
                            label="Retraction"
                            value={values.retractionDistance}
                            onChange={probeActions.changeRetractionDistance}
                            additionalProps={{
                                type: 'number',
                                id: 'retraction',
                            }}
                            units={units}
                        />
                    </Tooltip>
                    <Tooltip
                        content="Maximum distance for Z probe"
                        location="default"
                    >
                        <Input
                            label="Z Probe Distance"
                            value={values.zProbeDistance}
                            onChange={probeActions.changeZProbeDistance}
                            additionalProps={{
                                type: 'number',
                                id: 'zProbeDistance',
                            }}
                            units={units}
                        />
                    </Tooltip>
                </>
            )}
            <Tooltip
                content="Toggle check to see if your probe is connected correctly"
                location="default"
            >
                <div className={styles.inputSpread}>
                    <label htmlFor="probeConnectivityTest">
                        Probe connectivity test
                    </label>
                    <ToggleSwitch
                        checked={probeSettings.connectivityTest}
                        onChange={probeActions.changeConnectivityTest}
                    />
                </div>
            </Tooltip>
        </Fieldset>
    );
};

export default ProbeSettings;
