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

import {
    useState,
    useEffect,
    KeyboardEvent,
    useCallback,
    useRef,
    useMemo,
} from 'react';
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

import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
    PROBING_CATEGORY,
} from '../../constants';
import {
    Actions,
    AvailableTool,
    PROBE_TYPES_T,
    ProbeCommand,
    State,
} from './definitions';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import store from 'app/store';

type Props = {
    actions: Actions;
    state: State;
    probeCommand: ProbeCommand;
};

type Option = {
    value: string;
    label: string;
};

const convertAvailableTools = (
    tools: AvailableTool[],
    units: UNITS_EN,
): Option[] => {
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
    }));
};

const ProbeDiameter = ({ actions, state, probeCommand }: Props) => {
    const { touchplate, toolDiameter } = state;
    const { touchplateType } = touchplate;
    let { availableTools, units } = state;

    const [value, setValue] = useState(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? PROBE_TYPE_AUTO
            : String(toolDiameter),
    );

    const inputRef = useRef<HTMLInputElement>(null);

    // Subscribe to store changes
    useEffect(() => {
        const handleStoreChange = () => {
            const updatedTools = store.get('workspace.tools', []);
            if (
                JSON.stringify(updatedTools) !== JSON.stringify(availableTools)
            ) {
                availableTools = updatedTools;
            }
        };

        store.on('change', handleStoreChange);
        return () => {
            store.removeListener('change', handleStoreChange);
        };
    }, [availableTools]);

    // Memoize the options to prevent unnecessary recalculations
    const options = useMemo(() => {
        const baseOptions: Option[] = [];
        const toolsObjects = convertAvailableTools(availableTools, units);

        if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
            baseOptions.push(
                { value: PROBE_TYPE_AUTO, label: PROBE_TYPE_AUTO },
                { value: PROBE_TYPE_TIP, label: PROBE_TYPE_TIP },
            );
        }

        baseOptions.push(...toolsObjects);

        return baseOptions.sort((a, b) => {
            const isNumR = /^\d+.?\d*$/;
            const isANum = isNumR.test(a.value);
            const isBNum = isNumR.test(b.value);
            if (isANum && isBNum) {
                return Number(a.value) - Number(b.value);
            } else if (!isANum && !isBNum) {
                return a.value.localeCompare(b.value);
            } else {
                return isANum ? 1 : -1;
            }
        });
    }, [availableTools, units, touchplateType]);

    useEffect(() => {
        setValue(
            touchplateType === TOUCHPLATE_TYPE_AUTOZERO
                ? PROBE_TYPE_AUTO
                : String(toolDiameter),
        );
    }, [touchplateType]);

    useEffect(() => {
        if (units === METRIC_UNITS) {
            const metricValue = availableTools.find(
                (tool) =>
                    tool.metricDiameter === toolDiameter ||
                    tool.imperialDiameter === toolDiameter,
            );

            if (metricValue) {
                setValue(String(metricValue.metricDiameter));
            }

            return;
        }

        if (units === IMPERIAL_UNITS) {
            const imperialValue = availableTools.find(
                (tool) =>
                    tool.imperialDiameter === toolDiameter ||
                    tool.metricDiameter === toolDiameter,
            );

            if (imperialValue) {
                setValue(String(imperialValue.imperialDiameter));
            }

            return;
        }
    }, [units]);

    const handleChange = useCallback(
        (value: string): void => {
            if (value === PROBE_TYPE_AUTO || value === PROBE_TYPE_TIP) {
                actions._setProbeType(value);
                actions._setToolDiameter({ value: null });
            } else {
                actions._setProbeType(PROBE_TYPE_DIAMETER);
                actions._setToolDiameter({ value: Number(value) });
            }
            setValue(value);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [actions],
    );

    const handleCreateOption = useCallback(
        (inputValue: string) => {
            const newValue = Number(inputValue);
            if (isNaN(newValue) || newValue <= 0) {
                return;
            }

            const formattedValue = String(newValue);
            const toolUnits =
                units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter';
            const existingToolValues = availableTools.map((tool) =>
                String(tool[toolUnits]),
            );

            if (existingToolValues.includes(formattedValue)) {
                handleChange(formattedValue);
                return;
            }

            // Create new tool and add to store
            const newTool: AvailableTool = {
                metricDiameter:
                    units === METRIC_UNITS
                        ? newValue
                        : Number((newValue * 25.4).toFixed(2)),
                imperialDiameter:
                    units === METRIC_UNITS
                        ? Number((newValue / 25.4).toFixed(2))
                        : newValue,
                type: 'End Mill',
            };

            const updatedTools = [...availableTools, newTool];
            store.set('workspace.tools', updatedTools);
            handleChange(formattedValue);
        },
        [handleChange, availableTools, units],
    );

    const handleDeleteOption = useCallback(
        (valueToDelete: string) => {
            const toolUnits =
                units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter';
            const updatedTools = availableTools.filter(
                (tool) => String(tool[toolUnits]) !== valueToDelete,
            );

            // Update store first
            store.replace('workspace.tools', updatedTools);

            // Then handle selection if needed
            if (value === valueToDelete) {
                const firstTool = updatedTools[0];
                if (firstTool) {
                    const diameter = String(firstTool[toolUnits]);
                    handleChange(diameter);
                }
            }
        },
        [handleChange, availableTools, units, value],
    );

    const probeDiameterScrollUp = useCallback(() => {
        if (value === PROBE_TYPE_AUTO || value === PROBE_TYPE_TIP) {
            return;
        }

        const currentIndex = options.findIndex((opt) => opt.value === value);
        if (currentIndex === -1) {
            return;
        }

        let newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = options.length - 1;
        }

        handleChange(options[newIndex].value);
    }, [handleChange, options, value]);

    const probeDiameterScrollDown = useCallback(() => {
        if (value === PROBE_TYPE_AUTO || value === PROBE_TYPE_TIP) {
            return;
        }

        const currentIndex = options.findIndex((opt) => opt.value === value);
        if (currentIndex === -1) {
            return;
        }

        let newIndex = currentIndex + 1;
        if (newIndex >= options.length) {
            newIndex = 0;
        }

        handleChange(options[newIndex].value);
    }, [handleChange, options, value]);

    const shuttleControlEvents = useRef({
        PROBE_DIAMETER_SCROLL_UP: {
            title: 'Tool Diameter scroll up',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_UP',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeDiameterScrollUp,
        },
        PROBE_DIAMETER_SCROLL_DOWN: {
            title: 'Tool Diameter scroll down',
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

    function getUnitString(option: PROBE_TYPES_T) {
        if (option === 'Tip' || option === 'Auto') {
            return '';
        }

        return units;
    }

    const renderOptions = () => {
        if (options.length === 0) {
            return (
                <div className="flex items-center justify-center h-full min-h-10">
                    <p className="text-gray-500">
                        No tools available, add one below.
                    </p>
                </div>
            );
        }

        return options.map((option) => (
            <div
                key={option.value}
                className={cx(
                    'flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 cursor-pointer rounded min-h-10',
                    {
                        'bg-robin-200 dark:bg-gray-800 hover:bg-robin-200':
                            option.value === value,
                    },
                )}
                onClick={() => handleChange(option.value)}
            >
                <div className="flex items-center justify-between w-full">
                    <span>
                        {option.label}{' '}
                        {getUnitString(option.value as PROBE_TYPES_T)}
                    </span>

                    {options.length > 1 && (
                        <Button
                            className="ml-2 hover:text-red-500 rounded p-0"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOption(option.value);
                            }}
                            size="sm"
                        >
                            {option.value !== PROBE_TYPE_AUTO &&
                                option.value !== PROBE_TYPE_TIP && (
                                    <X className="h-6 w-6 cursor-pointer" />
                                )}
                        </Button>
                    )}
                </div>
            </div>
        ));
    };

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
                            {renderOptions()}
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
