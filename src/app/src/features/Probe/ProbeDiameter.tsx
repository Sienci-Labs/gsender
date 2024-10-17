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

import React, { useState } from 'react';
import cx from 'classnames';

import {
    TOUCHPLATE_TYPE_AUTOZERO,
    PROBE_TYPE_AUTO,
    PROBE_TYPE_TIP,
    PROBE_TYPE_DIAMETER,
} from 'app/lib/constants';

import { METRIC_UNITS } from '../../constants';
import { Actions, AvailableTool, ProbeCommand, State } from './definitions';
import { UNITS_EN } from 'app/definitions/general';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';

interface Props {
    actions: Actions;
    state: State;
    probeCommand: ProbeCommand;
}

const convertAvailableTools = (tools: AvailableTool[], units: UNITS_EN) => {
    const optionLabels = [];

    for (let tool of tools) {
        let diameter =
            units === METRIC_UNITS
                ? tool.metricDiameter
                : tool.imperialDiameter;
        optionLabels.push({
            value: `${diameter}`,
            label: `${diameter} ${units}`,
        });
    }
    return optionLabels;
};

const ProbeDiameter: React.FC<Props> = ({ actions, state, probeCommand }) => {
    const { _setToolDiameter, _setProbeType } = actions;
    let { availableTools, units, touchplate, toolDiameter } = state;
    const { touchplateType } = touchplate;

    const [value, setValue] = useState(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? 'Auto'
            : String(toolDiameter),
    );

    const tools = [...availableTools];

    const handleChange = (value: string): void => {
        if (value === PROBE_TYPE_AUTO || value === PROBE_TYPE_TIP) {
            _setProbeType(value);
            _setToolDiameter({ value: null });
        } else {
            _setProbeType(PROBE_TYPE_DIAMETER);
            _setToolDiameter({ value: Number(value) });
        }
        setValue(value);
    };

    const options = [];

    const toolsObjects = convertAvailableTools(tools, units);

    if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
        options.push(
            { value: PROBE_TYPE_AUTO, label: PROBE_TYPE_AUTO },
            { value: PROBE_TYPE_TIP, label: PROBE_TYPE_TIP },
        );
    }

    options.push(...toolsObjects);

    return (
        <div
            className={cx('flex flex-row w-full items-center justify-center', {
                hidden: !probeCommand.tool,
            })}
        >
            <Select
                onValueChange={handleChange}
                value={value}
                disabled={!probeCommand.tool}
            >
                <SelectTrigger className="w-[180px] bg-white rounded-md border-solid border-[1px] border-gray-300">
                    <SelectValue placeholder="Select a Probe Type" />
                </SelectTrigger>
                <SelectContent className="flex-1 bg-white">
                    <SelectGroup className="bg-white">
                        {options.map((option, _index) => {
                            return (
                                <SelectItem
                                    value={option.value}
                                    className="bg-white "
                                >
                                    {option.label}
                                </SelectItem>
                            );
                        })}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
};

export default ProbeDiameter;
