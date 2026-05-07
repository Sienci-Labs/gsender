import React from 'react';
import uniqueId from 'lodash/uniqueId';
import { useWizardContext } from 'app/features/Helper/context';
import Step from './Step';

const Stepper = () => {
    const { steps, completedStep, activeStep } = useWizardContext();
    return (
        <div className="w-[172px] shrink-0 border-r border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#141418] overflow-y-auto">
            {steps.map((step, index) => (
                <Step
                    step={step}
                    key={uniqueId()}
                    index={index}
                    active={activeStep === index}
                    complete={completedStep >= index}
                />
            ))}
        </div>
    );
};

export default Stepper;
