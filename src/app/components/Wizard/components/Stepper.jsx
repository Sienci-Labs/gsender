import React from 'react';
import PropTypes from 'prop-types';
import Step from './Step';
import styles from '../index.styl';

const Stepper = ({ steps = [], currentStep = 0 }) => {
    return (
        <div className={styles.stepperWrapper}>
            <h2>Progress</h2>
            {
                steps.map((step, index) => <Step step={step} key={index} index={index + 1}/>)
            }
        </div>
    );
};

Stepper.propTypes = {
    steps: PropTypes.array,
    currentStep: PropTypes.number
};

export default Stepper;
