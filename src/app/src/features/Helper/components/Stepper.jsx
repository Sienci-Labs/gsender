import React from 'react';
import { uniqueId } from 'lodash';
import { useWizardContext } from 'app/components/Wizard/context';
//import PropTypes from 'prop-types';
import Step from './Step';
import styles from '../index.styl';

const Stepper = () => {
    const { steps, completedStep, activeStep } = useWizardContext();
    return (
        <div className={styles.stepperWrapper}>
            {
                steps.map((step, index) => (
                    <Step
                        step={step}
                        key={uniqueId()}
                        index={index}
                        active={activeStep === index}
                        complete={completedStep >= index}
                    />
                ))
            }
        </div>
    );
};

Stepper.propTypes = {};

export default Stepper;
