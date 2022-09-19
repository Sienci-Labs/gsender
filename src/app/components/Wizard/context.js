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
    const [title, setTitle] = useState('Wizard');
    const [steps, setSteps] = useState([]);
    const [visible, setVisible] = useState(false);

    // Memoized API for context, can be fetched separate to data context
    const api = useMemo(() => ({
        setSteps: (steps) => setSteps(steps),
        setTitle: (title) => setTitle(title),
        setVisible: (b) => setVisible(b),
        incrementStep: () => {
            const maxStepIndex = steps.length - 1;
            if (activeStep <= maxStepIndex) {
                setActiveStep(activeStep + 1);
            }
        },
        decrementStep: () => {
            const decrementedStep = activeStep - 1;
            if (decrementedStep >= 0) {
                setActiveStep(decrementedStep);
            }
        },
        completeSubStep: (index) => {

        }
    }), [setActiveStep, setSteps, setTitle, setVisible]);

    return (
        <WizardContext.Provider value={{ steps, activeStep, title, visible }}>
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


/**
 * Loads and populates a new instruction set for the wizard and sets it visible.
 * @param instructions Schema for current wizard instruction steps and substeps.
 */
export const loadWizard = (instructions, title) => {
    const { setSteps, setActiveStep, setTitle, setVisible } = useWizardAPI();
    // Set each substep to incomplete
    instructions.steps.forEach(step => {
        step.substeps.forEach(substep => {
            substep.completed = false;
        });
    });
    console.log(instructions);

    // Sets up steps, and restores default state for new wizard
    setSteps(instructions.steps);
    setTitle(title);
    setActiveStep(0);
    setVisible(true);
};
