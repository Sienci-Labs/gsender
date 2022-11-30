import React from 'react';
import { useWizardContext } from 'app/components/Wizard/context';
//import PropTypes from 'prop-types';
import Step from './Step';
import styles from '../index.styl';

const Stepper = () => {
    const { steps, activeStep } = useWizardContext();
    return (
        <div className={styles.stepperWrapper}>
            {
                steps.map((step, index) => (
                    <Step
                        step={step}
                        key={index}
                        index={index}
                        active={activeStep === index}
                        complete={activeStep > index}
                        activeStep={activeStep}
                    />
                ))
            }
        </div>
    );
};

Stepper.propTypes = {};

export default Stepper;
