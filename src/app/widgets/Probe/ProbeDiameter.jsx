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
import CreatableSelect from 'react-select/creatable';

import store from 'app/store';
import { TOUCHPLATE_TYPE_AUTOZERO, PROBE_TYPE_AUTO, PROBE_TYPE_TIP } from 'app/lib/constants';

import styles from './index.styl';
import { METRIC_UNITS } from '../../constants';


const convertAvailableTools = (tools, units) => {
    const optionLabels = [];

    for (let tool of tools) {
        if (tool !== PROBE_TYPE_AUTO || tool !== PROBE_TYPE_TIP) {
            let diameter = (units === METRIC_UNITS) ? tool.metricDiameter : tool.imperialDiameter;
            optionLabels.push({
                value: diameter,
                label: `${diameter} ${units}`
            });
        }
    }
    return optionLabels;
};

const inputStyle = {
    container: base => ({
        ...base,
        flex: 1
    })
};

const ProbeDiameter = ({ actions, state, probeCommand }) => {
    const { setToolDiameter } = actions;
    let { availableTools, units, toolDiameter } = state;

    if (toolDiameter === 'Tip' || toolDiameter === 'Auto') {
        units = '';
    }

    const handleChange = (value) => {
        setToolDiameter(value);
    };
    const options = [];

    const touchplateType = store.get('workspace.probeProfile.touchplateType');

    if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
        options.push(
            { value: PROBE_TYPE_AUTO, label: PROBE_TYPE_AUTO },
            { value: PROBE_TYPE_TIP, label: PROBE_TYPE_TIP },
        );
    }

    options.push(...convertAvailableTools(availableTools, units));

    return (
        <div className={styles.probeDiameterWrapper}>
            <CreatableSelect
                isClearable
                styles={inputStyle}
                onChange={handleChange}
                value={{ label: `${toolDiameter} ${units}` }}
                options={options}
                menuPlacement="top"
                isDisabled={!probeCommand.tool}
                singleValue
            />
        </div>
    );
};

export default ProbeDiameter;
