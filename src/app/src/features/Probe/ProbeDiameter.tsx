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

import { useState, useEffect, KeyboardEvent, useCallback, useRef } from 'react';
import cx from 'classnames';
import { X, Plus, ChevronDown } from 'lucide-react';

import {
    TOUCHPLATE_TYPE_AUTOZERO,
    PROBE_TYPE_AUTO,
    PROBE_TYPE_TIP,
    PROBE_TYPE_DIAMETER,
} from 'app/lib/constants';
import { UNITS_EN } from 'app/definitions/general';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';

import { Input } from 'app/components/shadcn/Input';
import { Button } from 'app/components/Button';

import { METRIC_UNITS, PROBING_CATEGORY } from '../../constants';
import {
    Actions,
    AvailableTool,
    PROBE_TYPES_T,
    ProbeCommand,
    State,
} from './definitions';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';

type CustomValue = {
    value: string;
    label: string;
    isCustom: boolean;
    isDeleted?: boolean;
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
    const { touchplate, toolDiameter } = state;
    const { touchplateType } = touchplate;
    let { availableTools, units } = state;
    //console.log(availableTools);

    // Add refs to track current state
    const valueRef = useRef<string>(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? PROBE_TYPE_AUTO
            : String(toolDiameter),
    );
    const customValuesRef = useRef<CustomValue[]>([]);
    const unitsRef = useRef<UNITS_EN>(units);
    const availableToolsRef = useRef<AvailableTool[]>(availableTools);
    const actionsRef = useRef(actions);
    // Add ref for the input element
    const inputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useState(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? PROBE_TYPE_AUTO
            : String(toolDiameter),
    );
    const [customValues, setCustomValues] = useState<CustomValue[]>(() => {
        const saved = localStorage.getItem('probeCustomValues');
        const loadedValues = saved ? JSON.parse(saved) : [];
        return loadedValues;
    });

    // Initialize the customValuesRef with initial values
    useEffect(() => {
        // Set initial custom values to the ref
        customValuesRef.current = customValues;
    }, []);

    // Update refs when state changes
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        customValuesRef.current = customValues;
    }, [customValues]);

    useEffect(() => {
        unitsRef.current = units;
    }, [units]);

    useEffect(() => {
        availableToolsRef.current = availableTools;
    }, [availableTools]);

    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    useEffect(() => {
        // Keep local state in sync with prop changes
        setValue(
            touchplateType === TOUCHPLATE_TYPE_AUTOZERO
                ? PROBE_TYPE_AUTO
                : String(toolDiameter),
        );
    }, [touchplateType]);

    useEffect(() => {
        localStorage.setItem('probeCustomValues', JSON.stringify(customValues));
    }, [customValues]);

    const tools = [...availableTools].sort(
        (a, b) => a.metricDiameter - b.metricDiameter,
    );

    // Create stable callback that doesn't change on each render
    const handleChange = useCallback((value: string): void => {
        const currentActions = actionsRef.current;
        if (value === PROBE_TYPE_AUTO || value === PROBE_TYPE_TIP) {
            currentActions._setProbeType(value);
            currentActions._setToolDiameter({ value: null });
        } else {
            currentActions._setProbeType(PROBE_TYPE_DIAMETER);
            currentActions._setToolDiameter({ value: Number(value) });
        }
        setValue(value);
        inputRef.current.value = '';
    }, []);

    const handleCreateOption = useCallback(
        (inputValue: string) => {
            const newValue = Number(inputValue);
            if (isNaN(newValue) || newValue <= 0) {
                return;
            }
            const formattedValue = String(newValue);
            const toolUnits =
                unitsRef.current === METRIC_UNITS
                    ? 'metricDiameter'
                    : 'imperialDiameter';
            const existingToolValues = availableToolsRef.current.map((tool) =>
                String(tool[toolUnits]),
            );
            const existingCustomValues = customValuesRef.current.map(
                (cv) => cv.value,
            );

            if (
                existingToolValues.includes(formattedValue) ||
                existingCustomValues.includes(formattedValue)
            ) {
                handleChange(formattedValue);
                return;
            }

            const newCustomValue: CustomValue = {
                value: formattedValue,
                label: formattedValue,
                isCustom: true,
            };

            const updatedCustomValues = [
                ...customValuesRef.current,
                newCustomValue,
            ];

            setCustomValues(updatedCustomValues);
            customValuesRef.current = updatedCustomValues;

            handleChange(formattedValue);
        },
        [handleChange],
    );

    const handleDeleteOption = useCallback(
        (valueToDelete: string) => {
            // Check if it's a custom value
            const isCustomValue = customValuesRef.current.some(
                (v) => v.value === valueToDelete,
            );

            if (isCustomValue) {
                // Handle custom value deletion
                const updatedCustomValues = customValuesRef.current.filter(
                    (v) => v.value !== valueToDelete,
                );
                setCustomValues(updatedCustomValues);
                customValuesRef.current = updatedCustomValues;
            } else {
                // Handle default tool deletion by adding it to custom values with a deleted flag
                const newCustomValue: CustomValue = {
                    value: valueToDelete,
                    label: valueToDelete,
                    isCustom: true,
                    isDeleted: true,
                };
                const updatedCustomValues = [
                    ...customValuesRef.current,
                    newCustomValue,
                ];
                setCustomValues(updatedCustomValues);
                customValuesRef.current = updatedCustomValues;
            }

            if (valueRef.current === valueToDelete) {
                const firstTool = availableToolsRef.current[0];
                if (firstTool) {
                    const toolUnits =
                        unitsRef.current === METRIC_UNITS
                            ? 'metricDiameter'
                            : 'imperialDiameter';
                    const diameter = String(firstTool[toolUnits]);
                    handleChange(diameter);
                }
            }
        },
        [handleChange],
    );

    // Create stable callback functions for shuttle events
    const probeDiameterScrollUp = useCallback(() => {
        const currentValue = valueRef.current;
        const currentUnits = unitsRef.current;
        const currentTools = availableToolsRef.current;
        const currentCustomValues = customValuesRef.current;

        if (
            currentValue === PROBE_TYPE_AUTO ||
            currentValue === PROBE_TYPE_TIP
        ) {
            return;
        }

        const toolUnits =
            currentUnits === METRIC_UNITS
                ? 'metricDiameter'
                : 'imperialDiameter';

        const standardOptions = currentTools.map((tool) =>
            String(tool[toolUnits]),
        );
        const allOptions = [
            ...new Set([
                ...standardOptions,
                ...currentCustomValues.map((cv) => cv.value),
            ]),
        ];

        allOptions.sort((a, b) => Number(a) - Number(b));

        const currentIndex = allOptions.indexOf(currentValue);

        if (currentIndex === -1) {
            return;
        }

        let newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = allOptions.length - 1;
        }

        handleChange(allOptions[newIndex]);
    }, [handleChange]);

    const probeDiameterScrollDown = useCallback(() => {
        const currentValue = valueRef.current;
        const currentUnits = unitsRef.current;
        const currentTools = availableToolsRef.current;
        const currentCustomValues = customValuesRef.current;

        if (
            currentValue === PROBE_TYPE_AUTO ||
            currentValue === PROBE_TYPE_TIP
        ) {
            return;
        }

        const toolUnits =
            currentUnits === METRIC_UNITS
                ? 'metricDiameter'
                : 'imperialDiameter';

        const standardOptions = currentTools.map((tool) =>
            String(tool[toolUnits]),
        );
        const allOptions = [
            ...new Set([
                ...standardOptions,
                ...currentCustomValues.map((cv) => cv.value),
            ]),
        ];

        allOptions.sort((a, b) => Number(a) - Number(b));

        const currentIndex = allOptions.indexOf(currentValue);

        if (currentIndex === -1) {
            return;
        }

        let newIndex = currentIndex + 1;
        if (newIndex >= allOptions.length) {
            newIndex = 0;
        }

        handleChange(allOptions[newIndex]);
    }, [handleChange]);

    const shuttleControlEvents = useRef({
        PROBE_DIAMETER_SCROLL_UP: {
            title: 'Probe Diameter Scroll Up',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_UP',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeDiameterScrollUp,
        },
        PROBE_DIAMETER_SCROLL_DOWN: {
            title: 'Probe Diameter Scroll Down',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_DOWN',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeDiameterScrollDown,
        },
    }).current;

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    const options = [];

    const toolsObjects = convertAvailableTools(tools, units);

    if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
        options.push(
            { value: PROBE_TYPE_AUTO, label: PROBE_TYPE_AUTO, isCustom: false },
            { value: PROBE_TYPE_TIP, label: PROBE_TYPE_TIP, isCustom: false },
        );
    }

    // Filter out deleted tools
    const deletedValues = customValues
        .filter((cv) => cv.isDeleted)
        .map((cv) => cv.value);

    const filteredToolsObjects = toolsObjects.filter(
        (tool) => !deletedValues.includes(tool.value),
    );

    options.push(
        ...filteredToolsObjects,
        ...customValues.filter((cv) => !cv.isDeleted),
    );

    function getUnitString(option: PROBE_TYPES_T) {
        if (option === 'Tip' || option === 'Auto') {
            return '';
        }
        return units;
    }

    function checkIsDeletable(value: string) {
        // Allow deletion of all tools except 'Auto' and 'Tip'
        return value !== PROBE_TYPE_AUTO && value !== PROBE_TYPE_TIP;
    }

    options.sort((a, b) => {
        const isNumR = /^\d+.?\d*$/;
        const isANum = isNumR.test(a.value);
        const isBNum = isNumR.test(b.value);
        // check if number
        if (isANum && isBNum) {
            return Number(a.value) - Number(b.value);
        } else if (!isANum && !isBNum) {
            return a.value.localeCompare(b.value); // we want letters first
        } else {
            return isANum ? 1 : -1; // we want words at the top
        }
    });

    return (
        <div className={cx('w-full', { hidden: !probeCommand.tool })}>
            <div className="flex flex-col space-y-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            role="combobox"
                            className="w-full justify-between bg-white dark:bg-gray-800"
                            disabled={!probeCommand.tool}
                        >
                            {value ? (
                                <span>
                                    {value}{' '}
                                    {getUnitString(value as PROBE_TYPES_T)}
                                </span>
                            ) : (
                                'Select diameter'
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-white">
                        <div className="max-h-[300px] overflow-y-auto">
                            {options.length > 0 ? (
                                options.map((option) => (
                                    <div
                                        key={option.value}
                                        className={cx(
                                            'flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 cursor-pointer rounded min-h-10',
                                            {
                                                'bg-blue-50 dark:bg-gray-800 hover:bg-blue-50':
                                                    option.value === value,
                                            },
                                        )}
                                        onClick={() =>
                                            handleChange(option.value)
                                        }
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>
                                                {option.label}{' '}
                                                {getUnitString(
                                                    option.value as PROBE_TYPES_T,
                                                )}
                                            </span>
                                            {checkIsDeletable(option.value) && (
                                                <Button
                                                    className="ml-2 hover:text-red-500 rounded p-0"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteOption(
                                                            option.value,
                                                        );
                                                    }}
                                                    size="sm"
                                                >
                                                    <X className="h-6 w-6 cursor-pointer" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full min-h-10">
                                    <p className="text-gray-500">
                                        No tools available, add one below.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="pt-2 border-t">
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder={`Custom diameter (${units})`}
                                    onKeyDown={(
                                        e: KeyboardEvent<HTMLInputElement>,
                                    ) => {
                                        if (e.key === 'Enter') {
                                            handleCreateOption(
                                                inputRef.current.value,
                                            );
                                        }
                                    }}
                                    sizing="sm"
                                    ref={inputRef}
                                />
                                <Button
                                    onClick={() => {
                                        if (inputRef.current.value) {
                                            handleCreateOption(
                                                inputRef.current.value,
                                            );
                                        }
                                    }}
                                    size="sm"
                                    text="Add"
                                    icon={<Plus className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

export default ProbeDiameter;
