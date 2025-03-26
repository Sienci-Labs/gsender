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

import { useState, useEffect, KeyboardEvent } from 'react';
import cx from 'classnames';
import { X, Plus } from 'lucide-react';

import {
    TOUCHPLATE_TYPE_AUTOZERO,
    PROBE_TYPE_AUTO,
    PROBE_TYPE_TIP,
    PROBE_TYPE_DIAMETER,
} from 'app/lib/constants';
import { UNITS_EN } from 'app/definitions/general';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';

import { Input } from 'app/components/Input';
import { Button } from 'app/components/Button';

import { METRIC_UNITS } from '../../constants';
import { Actions, AvailableTool, ProbeCommand, State } from './definitions';

type CustomValue = {
    value: string;
    label: string;
    isCustom: boolean;
};

interface Props {
    actions: Actions;
    state: State;
    probeCommand: ProbeCommand;
}

const convertAvailableTools = (tools: AvailableTool[], units: UNITS_EN) => {
    return tools.map((tool) => ({
        value: String(
            tool[
                units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter'
            ],
        ),
        label: String(
            tool[
                units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter'
            ],
        ),
        isCustom: false,
    }));
};

const ProbeDiameter = ({ actions, state, probeCommand }: Props) => {
    const { _setToolDiameter, _setProbeType } = actions;
    let { availableTools, units, touchplate, toolDiameter } = state;
    const { touchplateType } = touchplate;

    const [value, setValue] = useState(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? 'Auto'
            : String(toolDiameter),
    );
    const [customValues, setCustomValues] = useState<CustomValue[]>(() => {
        const saved = localStorage.getItem('probeCustomValues');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('probeCustomValues', JSON.stringify(customValues));
    }, [customValues]);

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

    const handleCreateOption = (inputValue: string) => {
        const newValue = Number(inputValue);
        if (isNaN(newValue)) return;

        const newCustomValue: CustomValue = {
            value: inputValue,
            label: inputValue,
            isCustom: true,
        };

        setCustomValues((prev) => [...prev, newCustomValue]);
        handleChange(inputValue);
    };

    const handleDeleteOption = (valueToDelete: string) => {
        setCustomValues((prev) =>
            prev.filter((v) => v.value !== valueToDelete),
        );
        if (value === valueToDelete) {
            const firstTool = tools[0];
            if (firstTool) {
                const diameter =
                    units === METRIC_UNITS
                        ? firstTool.metricDiameter
                        : firstTool.imperialDiameter;
                handleChange(String(diameter));
            }
        }
    };

    const options = [];

    const toolsObjects = convertAvailableTools(tools, units);

    if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
        options.push(
            { value: PROBE_TYPE_AUTO, label: PROBE_TYPE_AUTO, isCustom: false },
            { value: PROBE_TYPE_TIP, label: PROBE_TYPE_TIP, isCustom: false },
        );
    }

    options.push(...toolsObjects, ...customValues);

    return (
        <div className={cx('w-full', { hidden: !probeCommand.tool })}>
            <div className="flex flex-col space-y-2">
                <Select
                    value={value}
                    onValueChange={handleChange}
                    disabled={!probeCommand.tool}
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select diameter" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectGroup>
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex items-center justify-between"
                                >
                                    <SelectItem value={option.value}>
                                        {option.label} {units}
                                    </SelectItem>
                                    {option.isCustom && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteOption(
                                                    option.value,
                                                );
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </SelectGroup>
                        <div className="p-2 border-t">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    placeholder={`Custom diameter (${units})`}
                                    onKeyDown={(
                                        e: KeyboardEvent<HTMLInputElement>,
                                    ) => {
                                        if (e.key === 'Enter') {
                                            handleCreateOption(
                                                e.currentTarget.value,
                                            );
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                    sizing="sm"
                                />
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        const input = e.currentTarget
                                            .previousElementSibling as HTMLInputElement;
                                        if (input && input.value) {
                                            handleCreateOption(input.value);
                                            input.value = '';
                                        }
                                    }}
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default ProbeDiameter;
