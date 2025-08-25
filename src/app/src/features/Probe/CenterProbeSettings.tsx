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
import { CenterProbeParameters } from './definitions';
import { METRIC_UNITS } from '../../constants';
import { UNITS_EN } from 'app/definitions/general';
import { mm2in, in2mm } from 'app/lib/units';

interface Props {
    centerProbeParams: CenterProbeParameters;
    onParamsChange: (params: Partial<CenterProbeParameters>) => void;
    units: UNITS_EN;
}

// Simple tooltip component
interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
            </div>
            {isVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-lg z-50 max-w-xs break-words">
                    {content}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
            )}
        </div>
    );
};

const CenterProbeSettings: React.FC<Props> = ({
    centerProbeParams,
    onParamsChange,
    units,
}) => {
    const isImperial = units !== METRIC_UNITS;
    const unitsLabel = isImperial ? 'in' : 'mm';
    
    // Convert stored values (always in mm) to display values
    const getDisplayValue = (value: number): number => {
        if (typeof value !== 'number' || isNaN(value)) {
            return isImperial ? 0.394 : 10; // Default fallback values
        }
        return isImperial ? Number(mm2in(value).toFixed(4)) : value;
    };
    
    // Convert display values to stored values (always in mm)
    const getStoredValue = (displayValue: number): number => {
        if (typeof displayValue !== 'number' || isNaN(displayValue)) {
            return 10; // Default fallback in mm
        }
        return isImperial ? in2mm(displayValue) : displayValue;
    };
    const handleLocationChange = (value: 'inner' | 'outer') => {
        onParamsChange({ probeLocation: value });
    };

    const handleProbeZChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onParamsChange({ probeZ: event.target.checked });
    };


    const handleDimensionChange = (axis: 'x' | 'y') => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const displayValue = parseFloat(event.target.value);
        if (!isNaN(displayValue)) {
            const storedValue = getStoredValue(displayValue);
            onParamsChange({
                workpieceDimensions: {
                    ...centerProbeParams.workpieceDimensions,
                    [axis]: storedValue,
                },
            });
        }
    };

    const handleSearchFeedRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const displayValue = parseFloat(event.target.value);
        if (!isNaN(displayValue)) {
            // For feed rates, we need to convert appropriately:
            // Display shows mm/min or in/min, but we store in mm/min
            const storedValue = isImperial ? displayValue * 25.4 : displayValue;
            onParamsChange({ searchFeedRate: storedValue });
        }
    };

    const getSearchFeedRateDisplay = (): number => {
        const storedRate = centerProbeParams.searchFeedRate || 2000;
        // Convert mm/min to in/min for imperial display
        return isImperial ? Number((storedRate / 25.4).toFixed(1)) : storedRate;
    };

    return (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg">Center Probe Settings</h3>
            
            {/* Probe Location */}
            <div className="flex flex-col">
                <label className="font-medium text-sm mb-2">Probe Location</label>
                <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="probeLocation"
                            value="inner"
                            checked={centerProbeParams.probeLocation === 'inner'}
                            onChange={() => handleLocationChange('inner')}
                            className="mr-2"
                        />
                        <span className="text-sm">Inner (probe from inside)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="probeLocation"
                            value="outer"
                            checked={centerProbeParams.probeLocation === 'outer'}
                            onChange={() => handleLocationChange('outer')}
                            className="mr-2"
                        />
                        <span className="text-sm">Outer (probe from outside)</span>
                    </label>
                </div>
            </div>

            {/* Probe Z Option - Only for outer probing */}
            {centerProbeParams.probeLocation === 'outer' && (
                <div className="flex flex-col">
                    <Tooltip content="Performs Z probing before XY probing to establish material surface as Z0">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={centerProbeParams.probeZ || false}
                                onChange={handleProbeZChange}
                                className="mr-2"
                            />
                            <span className="font-medium text-sm">Probe Z first (sets new Z0 reference)</span>
                        </label>
                    </Tooltip>
                </div>
            )}

            {/* Workpiece Dimensions */}
            <div className="flex flex-col">
                <label className="font-medium text-sm mb-2">
                    {centerProbeParams.probeLocation === 'inner' ? `Hole Dimensions (${unitsLabel})` : `Workpiece Dimensions (${unitsLabel})`}
                </label>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-3">
                    <div className="flex items-center">
                        <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                        <div className="text-xs text-red-800 dark:text-red-200">
                            <strong>IMPORTANT:</strong> Measure dimensions accurately to prevent probe damage.
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <Tooltip content={centerProbeParams.probeLocation === 'inner' 
                            ? 'Hole width - values too large will crash probe into walls' 
                            : 'Workpiece width - values too small cause early plunge'}>
                            <label className="text-sm mb-1 cursor-help">
                                X Dimension
                            </label>
                        </Tooltip>
                        <input
                            type="number"
                            value={getDisplayValue(centerProbeParams.workpieceDimensions?.x || 10)}
                            onChange={handleDimensionChange('x')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            min={isImperial ? "0.004" : "0.1"}
                            step={isImperial ? "0.001" : "0.1"}
                        />
                    </div>
                    <div className="flex flex-col">
                        <Tooltip content={centerProbeParams.probeLocation === 'inner' 
                            ? 'Hole height - values too large will crash probe into walls' 
                            : 'Workpiece height - values too small cause early plunge'}>
                            <label className="text-sm mb-1 cursor-help">
                                Y Dimension
                            </label>
                        </Tooltip>
                        <input
                            type="number"
                            value={getDisplayValue(centerProbeParams.workpieceDimensions?.y || 10)}
                            onChange={handleDimensionChange('y')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            min={isImperial ? "0.004" : "0.1"}
                            step={isImperial ? "0.001" : "0.1"}
                        />
                    </div>
                </div>
            </div>

            {/* Rapid Movement */}
            <div className="flex flex-col">
                <Tooltip content={`Uses G38.3 to add extra safety when doing rapid movement. The higher this value is, the less its effective on stopping when something goes wrong. (Default: ${isImperial ? '78.7 in/min' : '2000 mm/min'})`}>
                    <label className="font-medium text-sm mb-2 cursor-help">
                        Rapid Movement ({isImperial ? 'in/min' : 'mm/min'})
                    </label>
                </Tooltip>
                <input
                    type="number"
                    value={getSearchFeedRateDisplay()}
                    onChange={handleSearchFeedRateChange}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    min={isImperial ? "39.4" : "1000"}
                    max={isImperial ? "393.7" : "10000"}
                    step={isImperial ? "39.4" : "100"}
                />
            </div>
        </div>
    );
};

export default CenterProbeSettings;