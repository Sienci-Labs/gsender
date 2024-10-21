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

import React, { useEffect, useState } from 'react';

import store from 'app/store';
import pubsub from 'pubsub-js';
import TouchPlate from './TouchPlate';
import ProbeSettings from './ProbeSettings';
import Tools from './Tools';

import GeneralArea from '../components/GeneralArea';
import SettingWrapper from '../components/SettingWrapper';
import { collectUserUsageData } from '../../../lib/heatmap';
import { METRIC_UNITS, USAGE_TOOL_NAME } from '../../../constants';
import { convertToImperial } from '../calculate';

const Probe = ({ active, state, actions }) => {
    const [type, setType] = useState(
        store.get('workspace.probeProfile.touchplateType'),
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.PROBE);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    const { probeSettings, probe, units } = state;
    const probeActions = actions.probe;

    const values = {
        length:
            units === METRIC_UNITS
                ? probe.plateLength
                : convertToImperial(probe.plateLength),
        width:
            units === METRIC_UNITS
                ? probe.plateWidth
                : convertToImperial(probe.plateWidth),
        xyThickness:
            units === METRIC_UNITS
                ? probe.xyThickness
                : convertToImperial(probe.xyThickness),
        zThickness:
            units === METRIC_UNITS
                ? probe.zThickness
                : convertToImperial(probe.zThickness),
        fastFeedrate:
            units === METRIC_UNITS
                ? probeSettings.fastFeedrate
                : convertToImperial(probeSettings.fastFeedrate),
        normalFeedrate:
            units === METRIC_UNITS
                ? probeSettings.normalFeedrate
                : convertToImperial(probeSettings.normalFeedrate),
        retractionDistance:
            units === METRIC_UNITS
                ? probeSettings.retractionDistance
                : convertToImperial(probeSettings.retractionDistance),
        zProbeDistance:
            units === METRIC_UNITS
                ? probeSettings.zProbeDistance
                : convertToImperial(probeSettings.zProbeDistance),
    };

    const handleTouchplateTypeChange = (option) => {
        const { value } = option;
        store.set('workspace.probeProfile.touchplateType', value);
        setType(value);
        pubsub.publish('probe:updated');
    };

    return (
        <SettingWrapper title="Probe" show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <TouchPlate
                        actions={actions}
                        state={state}
                        values={values}
                        type={type}
                        onTypeChange={handleTouchplateTypeChange}
                    />
                    <ProbeSettings
                        probeActions={probeActions}
                        state={state}
                        values={values}
                        type={type}
                    />
                </GeneralArea.Half>

                <GeneralArea.Half>
                    <Tools state={state} actions={actions} />
                </GeneralArea.Half>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default Probe;
