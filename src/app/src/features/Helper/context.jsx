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

import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import _ from 'lodash';

import { Toaster } from 'app/lib/toaster/ToasterLib';
import { disableWizard } from 'app/store/redux/slices/helper.slice';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import reduxStore from 'app/store/redux';

const WizardContext = createContext({});
const WizardAPI = createContext({});

/**
 * Wizard Context Provider
 * @param children child elements
 * @returns {JSX.Element}
 */
export const WizardProvider = ({ children }) => {
    const [completedStep, setCompletedStep] = useState(-1);
    const [completedSubStep, setCompletedSubStep] = useState(-1);
    const [intro, setIntro] = useState(null);
    const [toolchangeContext, setToolchangeContext] = useState(null);
    const [toolchangeComment, setToolchangeComment] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [activeSubstep, setActiveSubstep] = useState(0);
    const [title, setTitle] = useState('Wizard');
    const [steps, setSteps] = useState([]);
    const [visible, setVisible] = useState(false);
    const [stepCount, setStepCount] = useState(0);
    const [minimized, setMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [overlay, setOverlay] = useState(false);
    const [pendingToolchangeNotice, setPendingToolchangeNotice] = useState(false);
    const [resumingJob, setResumingJob] = useState(false);
    const resumeTimerRef = useRef(null);

    // Mirrors the machine's active state so `load()` can read the current
    // value without pulling `activeState` into the `api` useMemo deps below
    // (which would otherwise recreate the whole API on every status report).
    const activeState = useSelector((state) =>
        get(state, 'controller.state.status.activeState', ''),
    );
    const activeStateRef = useRef(activeState);
    useEffect(() => {
        activeStateRef.current = activeState;
    }, [activeState]);

    // Once shown, auto-hide the pending notice as soon as the machine goes
    // idle again. One-directional: never re-shows itself for this session.
    useEffect(() => {
        if (pendingToolchangeNotice && activeState === GRBL_ACTIVE_STATE_IDLE) {
            setPendingToolchangeNotice(false);
        }
    }, [activeState, pendingToolchangeNotice]);

    // Resets all wizard state and closes the modal. Shared by every
    // "we're done" path: completeSubStep's final-step branch, the
    // activeStep-overflow safety net below, cancelToolchange, and
    // resumeJobAfterDelay's timer.
    const resetWizard = () => {
        document.getElementById('step-0-0')?.scrollIntoView();
        setVisible(false);
        setCompletedStep(-1);
        setCompletedSubStep(-1);
        setActiveStep(0);
        setActiveSubstep(0);
        setTitle('Wizard');
        setSteps([]);
        setIntro(null);
        setToolchangeContext(null);
        setToolchangeComment('');
        setStepCount(0);
        setMinimized(false);
        setPendingToolchangeNotice(false);
        setResumingJob(false);
        if (resumeTimerRef.current) {
            clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = null;
        }
        reduxStore.dispatch(disableWizard());
    };

    // Auto-close when activeStep reaches or exceeds stepCount.
    // completeSubStep sets activeStep = lastStep+1 before setVisible(false);
    // if the close branch is missed due to a stale closure, this catches it.
    useEffect(() => {
        if (visible && stepCount > 0 && activeStep >= stepCount) {
            resetWizard();
        }
    }, [activeStep, stepCount, visible]);

    // Memoized API for context, can be fetched separate to data context
    const api = useMemo(
        () => ({
            setWizardSteps: (steps) => setSteps(steps),
            setTitle: (title) => setTitle(title),
            setVisible: (b) => setVisible(b),
            setIsLoading: (state) => setIsLoading(state),
            updateSubstepOverlay: (activeValues, stepsList = steps) => {
                const { activeStep, activeSubstep } = activeValues;
                const step = stepsList[activeStep];
                if (!step) {
                    return false;
                }
                const substep = step.substeps[activeSubstep];
                if (!substep) {
                    return false;
                }
                setOverlay(substep.overlay);
                return substep.overlay;
            },
            getStepTitle: (index) => {
                const step = steps[index];
                if (!step) {
                    return '';
                }
                return step.title;
            },
            getIntro: () => {
                return intro;
            },
            getSubsteps: (index) => {
                const step = steps[index];
                if (!step) {
                    return [];
                }
                return step.substeps;
            },
            incrementStep: () => {
                const maxStepIndex = stepCount - 1;
                if (activeStep < maxStepIndex) {
                    setActiveStep(activeStep + 1);
                }
            },
            decrementStep: () => {
                // first check if we have substeps
                if (activeSubstep > 0) {
                    const decrementedSubStep = activeSubstep - 1;
                    setActiveSubstep(decrementedSubStep);
                    return {
                        activeStep: activeStep,
                        activeSubstep: decrementedSubStep,
                    };
                }
                // if not, go back to previous step
                const decrementedStep = activeStep - 1;
                if (decrementedStep >= 0) {
                    setActiveStep(decrementedStep);
                    // make sure we dont go to the very beginning of the step
                    // go to the last substep
                    const step = steps[decrementedStep];
                    const numberOfSubSteps = step.substeps.length;
                    const newSubstep = numberOfSubSteps - 1;
                    setActiveSubstep(newSubstep);
                    return {
                        activeStep: decrementedStep,
                        activeSubstep: newSubstep,
                    };
                }
                return {};
            },
            toggleMinimized: (state) => {
                setMinimized(!state);
            },
            completeSubStep: (
                stepIndex = activeStep,
                substepIndex = activeSubstep,
            ) => {
                // check that more steps can be completed
                const maxStepIndex = stepCount - 1;
                if (stepIndex > maxStepIndex) {
                    return {};
                }
                let returnValues = {};

                // ACTIVE****
                const step = steps[stepIndex];
                const numberOfSubSteps = step.substeps.length;
                const nextStep = substepIndex + 1;
                // Completed all substeps, move to next step
                if (nextStep >= numberOfSubSteps) {
                    setActiveStep(stepIndex + 1);
                    setActiveSubstep(0);
                    returnValues = {
                        activeStep: stepIndex + 1,
                        activeSubstep: 0,
                    };
                    if (stepIndex >= maxStepIndex) {
                        resetWizard();
                        return {};
                    }
                } else {
                    // didnt complete substeps, so increment substep only
                    setActiveSubstep(nextStep);
                    returnValues = {
                        activeStep: stepIndex,
                        activeSubstep: nextStep,
                    };
                }
                // close window on everything done.
                if (activeStep >= maxStepIndex) {
                    resetWizard();
                    return {};
                }

                // check that the step we are completed has not already been completed
                if (
                    completedStep >= stepIndex ||
                    (stepIndex === completedStep + 1 &&
                        completedSubStep >= substepIndex)
                ) {
                    return returnValues;
                }

                // COMPLETED****
                if (nextStep >= numberOfSubSteps) {
                    setCompletedStep(stepIndex);
                    setCompletedSubStep(-1);
                } else {
                    setCompletedSubStep(substepIndex);
                }
                return returnValues;
            },
            isSubstepCompleted: (stepIndex, substepIndex) => {
                if (completedStep > stepIndex) {
                    return true;
                }
                return (
                    completedSubStep > substepIndex &&
                    stepIndex === completedStep
                );
            },
            load: (instructions, title, metadata = {}) => {
                if (!instructions || !instructions.steps) {
                    return;
                }
                instructions.steps.forEach((step) => {
                    step.substeps.forEach((substep) => {
                        if (substep.actions) {
                            substep.actionTaken = false;
                        }
                    });
                });
                // Sets up steps, and restores default state for new wizard
                setSteps([...instructions.steps]);
                setStepCount(instructions.steps.length);
                setTitle(title);
                setIntro(instructions.intro?.description ?? null);
                setToolchangeContext(metadata.context ?? null);
                setToolchangeComment(metadata.comment ?? '');
                setPendingToolchangeNotice(
                    activeStateRef.current !== GRBL_ACTIVE_STATE_IDLE,
                );

                setActiveStep(0);
                setVisible(true);
            },
            // you must pass an object with activeStep and activeSubstep to this function.
            // this is bc if you change those values before running this function, they won't update in time,
            // and you will get the old values.
            // completeSubStep and decrementStep both return the new values they set that can then be passed to this function
            scrollToActiveStep: (activeValues) => {
                if (_.isEmpty(activeValues)) {
                    return;
                }
                const { activeStep, activeSubstep } = activeValues;
                if (activeStep > steps.length) {
                    return;
                }
                requestAnimationFrame(() => {
                    const element = document.getElementById(
                        `step-${activeStep}-${activeSubstep}`,
                    );
                    if (!element) return;
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                });
            },
            markActionAsComplete: (stepIndex, substepIndex) => {
                const nextSteps = [...steps];
                nextSteps[stepIndex].substeps[substepIndex].actionTaken = true;
                setSteps(nextSteps);
                setActiveStep(stepIndex);
                setActiveSubstep(substepIndex);
            },
            hasIncompleteActions: () => {
                const step = steps[activeStep];
                if (!step) {
                    return false;
                }
                const substep = step.substeps[activeSubstep];
                if (!substep || !substep.actions) {
                    return false;
                }

                return (
                    substep.actions.length > 0 && substep.actionTaken === false
                );
            },
            cancelToolchange: () => {
                resetWizard();
                setIsLoading(false);
                Toaster.clear();
            },
            resumeJobAfterDelay: (delayMs) => {
                setResumingJob(true);
                if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = setTimeout(() => {
                    resetWizard();
                }, delayMs);
            },
        }),
        [
            setActiveStep,
            setSteps,
            setTitle,
            setVisible,
            steps,
            stepCount,
            activeStep,
            activeSubstep,
            completedStep,
            completedSubStep,
            isLoading,
            overlay,
            setMinimized,
            setActiveSubstep,
        ],
    );

    return (
        <WizardContext.Provider
            value={{
                steps,
                activeStep,
                activeSubstep,
                completedStep,
                completedSubStep,
                title,
                visible,
                load: api.load,
                stepCount,
                minimized,
                isLoading,
                overlay,
                intro,
                toolchangeContext,
                toolchangeComment,
                pendingToolchangeNotice,
                resumingJob,
            }}
        >
            <WizardAPI.Provider value={api}>{children}</WizardAPI.Provider>
        </WizardContext.Provider>
    );
};

/**
 * Fetches and returns current context for Wizard tool.  Throws error if not inside provider scope.
 * @returns current react context
 */
export const useWizardContext = () => {
    const context = useContext(WizardContext);
    if (!context) {
        throw new Error(
            'Context unavailable - make sure this is being used within the wizard context provider',
        );
    }
    return context;
};

/**
 * Fetches and returns the API context for Wizard tool.  Throws error if not inside provider scope.
 * @returns Current API context
 */
export const useWizardAPI = () => {
    const context = useContext(WizardAPI);
    if (!context) {
        throw new Error(
            'Context unavailable - make sure this is being used within the Wizard API context provider',
        );
    }
    return context;
};
