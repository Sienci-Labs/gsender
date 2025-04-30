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

import React, { createContext, useContext, useState, useMemo } from 'react';
import _ from 'lodash';

import { Toaster } from 'app/lib/toaster/ToasterLib';
import { disableWizard } from 'app/store/redux/slices/helper.slice';
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
    const [activeStep, setActiveStep] = useState(0);
    const [activeSubstep, setActiveSubstep] = useState(0);
    const [title, setTitle] = useState('Wizard');
    const [steps, setSteps] = useState([]);
    const [visible, setVisible] = useState(false);
    const [stepCount, setStepCount] = useState(0);
    const [minimized, setMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [overlay, setOverlay] = useState(false);

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
                        // reset values
                        const element = document.getElementById('step-0-0');
                        element.scrollIntoView();
                        setVisible(false);
                        setCompletedStep(-1);
                        setCompletedSubStep(-1);
                        setActiveStep(0);
                        setActiveSubstep(0);
                        setTitle('Wizard');
                        setSteps([]);
                        setStepCount(0);
                        setMinimized(false);
                        reduxStore.dispatch(disableWizard());
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
                    // reset values
                    const element = document.getElementById('step-0-0');
                    element.scrollIntoView();
                    setVisible(false);
                    setCompletedStep(-1);
                    setCompletedSubStep(-1);
                    setActiveStep(0);
                    setActiveSubstep(0);
                    setTitle('Wizard');
                    setSteps([]);
                    setStepCount(0);
                    setMinimized(false);
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
            load: (instructions, title) => {
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
                if (instructions.intro) {
                    setIntro(instructions.intro.description);
                }

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
                const element = document.getElementById(
                    `step-${activeStep}-${activeSubstep}`,
                );
                element.scrollIntoView({
                    behavior: 'smooth',
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
                const element = document.getElementById('step-0-0');
                element.scrollIntoView();
                setVisible(false);
                setCompletedStep(-1);
                setCompletedSubStep(-1);
                setActiveStep(0);
                setActiveSubstep(0);
                setTitle('Wizard');
                setSteps([]);
                setStepCount(0);
                setMinimized(false);
                setIsLoading(false);
                reduxStore.dispatch(disableWizard());

                Toaster.clear();
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
