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
import CreatableSelect from 'react-select/creatable';
import styles from './index.styl';
import { METRIC_UNITS } from '../../constants';


const convertAvailableTools = (tools, units) => {
    const optionLabels = [];

    for (let tool of tools) {
        let diameter = (units === METRIC_UNITS) ? tool.metricDiameter : tool.imperialDiameter;
        optionLabels.push({
            value: diameter,
            label: `${diameter} ${units}`
        });
    }
    return optionLabels;
};

const inputStyle = {
    container: base => ({
        ...base,
        flex: 1
    })
};

const ProbeDiameter = ({ actions, state }) => {
    const { setToolDiameter } = actions;
    const { availableTools, units, toolDiameter } = state;

    const handleChange = (value) => {
        setToolDiameter(value);
    };
    const options = convertAvailableTools(availableTools, units);

    return (
        <div>
            <label className="control-label">Tool Diameter</label>
            <div className={styles.probeDiameterWrapper}>
                <CreatableSelect
                    isClearable
                    styles={inputStyle}
                    onChange={handleChange}
                    value={{ label: `${toolDiameter} ${units}` }}
                    options={options}
                    menuPlacement="top"
                    singleValue
                />
            </div>
        </div>

    );
};

export default ProbeDiameter;
