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

import React, { useEffect, useRef, useState } from 'react';
import pubsub from 'pubsub-js';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import controller from 'app/lib/controller';
import { useWizardAPI, useWizardContext } from 'app/features/Helper/context';
import { Terminal, CheckCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

interface WizardAction {
    label: string;
    gcodeLines: string[];
}

interface TooltipState {
    index: number;
    rect: DOMRect;
    lines: string[];
}

interface CbRef {
    stepIndex: number;
    substepIndex: number;
    isLastSubstep: boolean;
    markActionAsComplete: (stepIndex: number, substepIndex: number) => void;
    completeSubStep: (stepIndex: number, substepIndex: number) => Record<string, number>;
    setIsLoading: (loading: boolean) => void;
}

interface ActionsProps {
    actions?: WizardAction[];
    stepIndex: number;
    substepIndex: number;
}

const AUTO_ADVANCE_DELAY_MS = 1500;

const Actions = ({ actions = [], stepIndex, substepIndex }: ActionsProps) => {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadingStartRef = useRef<number | null>(null);
    const {
        markActionAsComplete,
        completeSubStep,
        setIsLoading,
    } = useWizardAPI();
    const { isLoading, steps } = useWizardContext();
    const activeState = useSelector((state: Record<string, unknown>) =>
        get(state, 'controller.state.status.activeState', ''),
    );

    const isNotIdle = () => activeState !== GRBL_ACTIVE_STATE_IDLE;

    // Always-current ref so the pubsub handler never reads stale props/API.
    // The subscription is registered once ([] deps) but cbRef.current is
    // updated on every render before any async event can fire.
    const cbRef = useRef<CbRef | null>(null);
    const isLastSubstep =
        stepIndex === steps.length - 1 &&
        substepIndex === (steps[stepIndex]?.substeps?.length ?? 1) - 1;

    cbRef.current = {
        stepIndex,
        substepIndex,
        isLastSubstep,
        markActionAsComplete,
        completeSubStep,
        setIsLoading,
    };

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('wizard:next', (msg: string, indexes: { stepIndex: number; substepIndex: number }) => {
                const { stepIndex: stepIn, substepIndex: subStepIn } = indexes;
                const cb = cbRef.current;
                if (!cb) return;
                if (stepIn === cb.stepIndex && subStepIn === cb.substepIndex) {
                    const MIN_LOADING_MS = 1250;
                    const elapsed = Date.now() - (loadingStartRef.current ?? 0);
                    const delay = Math.max(0, MIN_LOADING_MS - elapsed);
                    setTimeout(() => {
                        cb.markActionAsComplete(cb.stepIndex, cb.substepIndex);
                        cb.setIsLoading(false);
                        setShowSuccess(true);

                        // Resuming the job is safety-critical — always
                        // require an explicit click on "Complete" here,
                        // never auto-advance/auto-close.
                        if (cb.isLastSubstep) return;

                        advanceTimerRef.current = setTimeout(() => {
                            setShowSuccess(false);
                            cb.completeSubStep(cb.stepIndex, cb.substepIndex);
                        }, AUTO_ADVANCE_DELAY_MS);
                    }, delay);
                }
            }),
            pubsub.subscribe('error', () => {
                cbRef.current?.setIsLoading(false);
            }),
        ];

        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
            if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        };
    }, []);

    // If the rendered substep changes for any reason (our own auto-advance
    // firing, or the user manually clicking Back mid-countdown), cancel any
    // pending auto-advance left over from the substep we just left.
    useEffect(() => {
        return () => {
            if (advanceTimerRef.current) {
                clearTimeout(advanceTimerRef.current);
                advanceTimerRef.current = null;
            }
            setShowSuccess(false);
        };
    }, [stepIndex, substepIndex]);

    return (
        <>
            {showSuccess && (
                <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 px-3 py-2 mb-1 rounded bg-emerald-50 dark:bg-[#052e16] text-emerald-800 dark:text-[#6ee7b7] text-sm"
                >
                    <CheckCircle size={13} className="shrink-0" />
                    Success
                </div>
            )}
            {actions.length > 0 && (
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-amber-400 mb-1">
                    Run G-Code
                </div>
            )}
            <div className="flex flex-col gap-2">
                {actions.map((action, index) => {
                    const cbWithCompletion = () => {
                        if (advanceTimerRef.current) {
                            clearTimeout(advanceTimerRef.current);
                            advanceTimerRef.current = null;
                        }
                        setShowSuccess(false);
                        loadingStartRef.current = Date.now();
                        setIsLoading(true);
                        controller.command(
                            'wizard:step',
                            stepIndex,
                            substepIndex,
                        );
                        controller.command('gcode', action.gcodeLines);
                    };
                    return (
                        <React.Fragment key={`action-${uniqueId()}`}>
                            {!isLoading && index > 0 && (
                                <div className="flex items-center gap-2 my-0.5 px-6">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a2a35]" />
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">or</span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a2a35]" />
                                </div>
                            )}
                            {isLoading && index === 0 ? (
                                <span className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">
                                    Running…
                                </span>
                            ) : !isLoading && (
                                <>
                                    <div
                                        className="flex items-center justify-between px-3 py-2 rounded border border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#0d0d12]"
                                        data-chip="true"
                                    >
                                        <div
                                            className="flex items-center gap-2 min-w-0 cursor-default"
                                            onMouseEnter={(e) => {
                                                if (!action.gcodeLines?.length) return;
                                                const chipEl = (e.currentTarget as HTMLElement).closest('[data-chip]');
                                                if (!chipEl) return;
                                                tooltipTimer.current = setTimeout(() => {
                                                    const rect = chipEl.getBoundingClientRect();
                                                    setTooltip({ index, rect, lines: action.gcodeLines });
                                                }, 1200);
                                            }}
                                            onMouseLeave={() => {
                                                if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
                                                setTooltip(null);
                                            }}
                                        >
                                            <Terminal size={13} className="shrink-0 text-gray-400 dark:text-cyan-400" />
                                            <code className="text-sm font-mono text-sky-700 dark:text-cyan-400 truncate">
                                                {action.label}
                                            </code>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isNotIdle()}
                                            onClick={cbWithCompletion}
                                            className="ml-3 shrink-0 text-sm font-medium px-3 py-1 rounded bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white disabled:opacity-35 disabled:pointer-events-none transition-colors"
                                        >
                                            Run
                                        </button>
                                    </div>
                                    {tooltip?.index === index && (
                                        <div
                                            style={{
                                                position: 'fixed',
                                                top: tooltip.rect.bottom + 4,
                                                left: tooltip.rect.left,
                                                width: tooltip.rect.width,
                                                zIndex: 9999,
                                                pointerEvents: 'none',
                                            }}
                                            className="px-3 py-2.5 rounded border border-gray-200 dark:border-[#2a2a35] bg-white dark:bg-[#0d0d12] shadow-lg"
                                        >
                                            {tooltip.lines.map((line, i) => (
                                                <div key={i} className="font-mono text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
};

export default Actions;
