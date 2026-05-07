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
import get from 'lodash/get';
import cx from 'classnames';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import { useWizardAPI, useWizardContext } from 'app/features/Helper/context';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';

const Controls = () => {
    const {
        completeSubStep,
        decrementStep,
        scrollToActiveStep,
        hasIncompleteActions,
        updateSubstepOverlay,
    } = useWizardAPI();

    const { steps, activeStep } = useWizardContext();

    const activeState = useSelector((state) =>
        get(state, 'controller.state.status.activeState', ''),
    );

    const isNotIdle = () => activeState !== GRBL_ACTIVE_STATE_IDLE;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#111116]">
            <button
                type="button"
                onClick={() => {
                    const activeValues = decrementStep();
                    updateSubstepOverlay(activeValues);
                    scrollToActiveStep(activeValues);
                }}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md border border-gray-300 dark:border-[#3a3a48] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
                <ArrowLeft size={12} />
                Back
            </button>

            <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={cx(
                            'h-[3px] w-[18px] rounded-sm',
                            i <= activeStep
                                ? 'bg-blue-600 dark:bg-blue-400'
                                : 'bg-gray-300 dark:bg-[#2a2a35]',
                        )}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={() => {
                    const activeValues = completeSubStep();
                    updateSubstepOverlay(activeValues);
                    scrollToActiveStep(activeValues);
                }}
                disabled={hasIncompleteActions() || isNotIdle()}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            >
                Complete
                <ArrowRight size={12} />
            </button>
        </div>
    );
};

export default Controls;
