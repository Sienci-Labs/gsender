import { useWizardContext } from "app/features/Helper/context";
import uniqueId from "lodash/uniqueId";
import React from "react";
import styles from "../index.module.styl";
//import PropTypes from 'prop-types';
import Step from "./Step";

const Stepper = () => {
	const { steps, completedStep, activeStep } = useWizardContext();
	return (
		<div className={styles.stepperWrapper}>
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

Stepper.propTypes = {};

export default Stepper;
