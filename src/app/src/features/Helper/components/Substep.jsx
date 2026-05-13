/*
 * Copyright (C) 2022 Sienci Labs Inc.
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
import { Info } from 'lucide-react';
import Actions from './Actions';

const Substep = ({ step, index, stepIndex, firstRunOnly }) => {
    return (
        <div className="flex flex-col gap-3" id={`step-${stepIndex}-${index}`}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-amber-400">
                {step.title}
            </div>

            <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {typeof step.description === 'function'
                    ? step.description()
                    : step.description}
            </div>

            {firstRunOnly && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-orange-200 dark:border-orange-800 bg-amber-50 dark:bg-orange-950/40">
                    <Info size={13} className="shrink-0 mt-0.5 text-orange-500 dark:text-orange-400" />
                    <span className="text-sm text-orange-800 dark:text-orange-300">
                        <span className="font-semibold">One-time setup:</span>{' '}
                        measures the initial tool so subsequent tools can be compared against it.
                    </span>
                </div>
            )}
            <Actions
                actions={step.actions}
                index={index}
                stepIndex={stepIndex}
                substepIndex={index}
            />
        </div>
    );
};

export default Substep;
