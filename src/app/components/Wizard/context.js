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

const WizardContext = createContext({});
const WizardAPI = createContext({});

/**
 * Wizard Context Provider
 * @param children child elements
 * @returns {JSX.Element}
 */
export const WizardProvider = ({ children }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [activeSubstep, setActiveSubstep] = useState(0);
    const [title, setTitle] = useState('Wizard');
    const [steps, setSteps] = useState([]);
    const [visible, setVisible] = useState(false);
    const [stepCount, setStepCount] = useState(0);
    const [minimized, setMinimized] = useState(false);


    // Memoized API for context, can be fetched separate to data context
    const api = useMemo(() => ({
        setWizardSteps: (steps) => setSteps(steps),
        setTitle: (title) => setTitle(title),
        setVisible: (b) => setVisible(b),
        getStepTitle: (index) => {
            const step = steps[index];
            if (!step) {
                return '';
            }
            return step.title;
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
            const decrementedStep = activeStep - 1;
            if (decrementedStep >= 0) {
                setActiveStep(decrementedStep);
            }
        },
        toggleMinimized: (state) => {
            setMinimized(!state);
        },
        completeSubStep: () => {
            const maxStepIndex = stepCount - 1;
            if (activeStep > maxStepIndex) {
                return;
            }
            const step = steps[activeStep];
            const numberOfSubSteps = step.substeps.length;
            const nextStep = activeSubstep + 1;
            // Completed all substeps, move to next step
            if (nextStep >= numberOfSubSteps) {
                setActiveStep(activeStep + 1);
                setActiveSubstep(0);
                return;
            }
            setActiveSubstep(nextStep);
        },
        isSubstepCompleted: (stepIndex, substepIndex) => {
            if (activeStep > stepIndex) {
                return true;
            }
            return activeSubstep > substepIndex && stepIndex === activeStep;
        },
        load: (instructions, title) => {
            if (!instructions || !instructions.steps) {
                return;
            }
            // Sets up steps, and restores default state for new wizard
            setSteps([...instructions.steps]);
            setStepCount(instructions.steps.length);
            setTitle(title);
            setActiveStep(0);
            setVisible(true);
        },
        scrollToActiveStep: () => {
            if (activeStep > steps.length) {
                return;
            }
            const element = document.getElementById(`step-${activeStep}-${activeSubstep}`);
            element.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }), [setActiveStep, setSteps, setTitle, setVisible, steps, stepCount, activeStep, activeSubstep, setMinimized, setActiveSubstep]);

    return (
        <WizardContext.Provider value={{ steps, activeStep, activeSubstep, title, visible, stepCount, minimized }}>
            <WizardAPI.Provider value={api}>
                {children}
            </WizardAPI.Provider>
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
        throw new Error('Context unavailable - make sure this is being used within the wizard context provider');
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
        throw new Error('Context unavailable - make sure this is being used within the Wizard API context provider');
    }
    return context;
};
