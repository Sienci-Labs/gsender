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
import Actions from './Actions';

const Substep = ({ step, index, stepIndex, firstRunOnly }) => {
    return (
        <div className="flex flex-col gap-3" id={`step-${stepIndex}-${index}`}>
            {firstRunOnly && (
                <div className="rounded px-3 py-2.5 border bg-amber-50 dark:bg-[#1c1500] border-amber-300 dark:border-[#3a2e00]">
                    <div className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        One-time setup
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-300/80">
                        Runs on your first toolchange only — measures the initial tool so subsequent tools can be compared against it.
                    </div>
                </div>
            )}

            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-amber-400">
                {step.title}
            </div>

            <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {typeof step.description === 'function'
                    ? step.description()
                    : step.description}
            </div>

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
