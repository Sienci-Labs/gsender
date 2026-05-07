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

import React, { useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import pubsub from 'pubsub-js';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import controller from 'app/lib/controller';
import { useWizardAPI, useWizardContext } from 'app/features/Helper/context';
import { Terminal } from 'lucide-react';
import { useSelector } from 'react-redux';

const Actions = ({ actions = [], stepIndex, substepIndex }) => {
    const {
        markActionAsComplete,
        completeSubStep,
        scrollToActiveStep,
        setIsLoading,
        updateSubstepOverlay,
    } = useWizardAPI();
    const { isLoading } = useWizardContext();
    const activeState = useSelector((state) =>
        get(state, 'controller.state.status.activeState', ''),
    );

    const isNotIdle = () => {
        return activeState !== GRBL_ACTIVE_STATE_IDLE;
    };

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('wizard:next', (msg, indexes) => {
                const { stepIndex: stepIn, substepIndex: subStepIn } = indexes;
                if (stepIn === stepIndex && subStepIn === substepIndex) {
                    // Batch all state updates so the component doesn't unmount
                    // mid-handler (React 17 doesn't auto-batch async callbacks)
                    unstable_batchedUpdates(() => {
                        markActionAsComplete(stepIndex, substepIndex);
                        const activeValues = completeSubStep(
                            stepIndex,
                            substepIndex,
                        );
                        updateSubstepOverlay(activeValues);
                        scrollToActiveStep(activeValues);
                        setIsLoading(false);
                    });
                }
            }),
            pubsub.subscribe('error', (msg, error) => {
                setIsLoading(false);
            }),
        ];

        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
        };
    }, []);

    return (
        <>
            {actions.length > 0 && (
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-amber-400 mb-1">
                    Run G-Code
                </div>
            )}
            <div className="flex flex-col gap-2">
                {actions.map((action, index) => {
                    const cbWithCompletion = () => {
                        setIsLoading(true);
                        controller.command(
                            'wizard:step',
                            stepIndex,
                            substepIndex,
                        );
                        action.cb();
                    };
                    return (
                        <React.Fragment key={`action-${uniqueId()}`}>
                            {isLoading && index === 0 ? (
                                <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
                                    Running…
                                </span>
                            ) : !isLoading && (
                                <div className="flex items-center justify-between px-3 py-2 rounded border border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#0d0d12]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Terminal size={12} className="shrink-0 text-gray-400 dark:text-cyan-400" />
                                        <code className="text-xs font-mono text-sky-700 dark:text-cyan-400 truncate">
                                            {action.label}
                                        </code>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isNotIdle()}
                                        onClick={cbWithCompletion}
                                        className="ml-3 shrink-0 text-xs font-medium px-3 py-1 rounded bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white disabled:opacity-35 disabled:pointer-events-none transition-colors"
                                    >
                                        Run
                                    </button>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
};

export default Actions;
