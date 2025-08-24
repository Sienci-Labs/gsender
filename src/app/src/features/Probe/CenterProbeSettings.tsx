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
import { CenterProbeParameters } from './definitions';

interface Props {
    centerProbeParams: CenterProbeParameters;
    onParamsChange: (params: Partial<CenterProbeParameters>) => void;
}

const CenterProbeSettings: React.FC<Props> = ({
    centerProbeParams,
    onParamsChange,
}) => {
    const handleLocationChange = (value: 'inner' | 'outer') => {
        onParamsChange({ probeLocation: value });
    };

    const handleProbeZChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onParamsChange({ probeZ: event.target.checked });
    };


    const handleDimensionChange = (axis: 'x' | 'y') => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = parseFloat(event.target.value);
        if (!isNaN(value)) {
            onParamsChange({
                workpieceDimensions: {
                    ...centerProbeParams.workpieceDimensions,
                    [axis]: value,
                },
            });
        }
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
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={centerProbeParams.probeZ || false}
                            onChange={handleProbeZChange}
                            className="mr-2"
                        />
                        <span className="font-medium text-sm">Probe Z first (sets new Z0 reference)</span>
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                        Performs Z probing before XY probing to establish material surface as Z0
                    </p>
                </div>
            )}

            {/* Workpiece Dimensions */}
            <div className="flex flex-col">
                <label className="font-medium text-sm mb-2">
                    {centerProbeParams.probeLocation === 'inner' ? 'Hole Dimensions (mm)' : 'Workpiece Dimensions (mm)'}
                </label>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-3">
                    <div className="flex items-start">
                        <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                        <div className="text-sm text-red-800 dark:text-red-200">
                            <strong>IMPORTANT:</strong> Incorrect dimensions can cause probe needle damage! 
                            {centerProbeParams.probeLocation === 'inner' 
                                ? ' Measure the hole dimensions accurately - values too large will crash the probe into the hole walls.'
                                : ' Measure the workpiece dimensions accurately - values too small will cause the probe to plunge too early and hit the material surface.'
                            }
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm mb-1">X Dimension</label>
                        <input
                            type="number"
                            value={centerProbeParams.workpieceDimensions.x}
                            onChange={handleDimensionChange('x')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            min="0.1"
                            step="0.1"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm mb-1">Y Dimension</label>
                        <input
                            type="number"
                            value={centerProbeParams.workpieceDimensions.y}
                            onChange={handleDimensionChange('y')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            min="0.1"
                            step="0.1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CenterProbeSettings;