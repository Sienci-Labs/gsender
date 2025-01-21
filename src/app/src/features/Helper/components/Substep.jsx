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

import React from 'react';
import cx from 'classnames';
import SubstepCompletionIndicator from 'app/components/Wizard/components/SubstepCompletionIndicator';
import { useWizardContext } from 'app/components/Wizard/context';
import Actions from './Actions';
import styles from '../index.styl';

const Substep = ({ step, index, stepIndex }) => {
    const { activeSubstep, activeStep, completedStep, completedSubStep } = useWizardContext();

    // // State calculation
    /*
        complete is:
        - on or before the last completed step
        - on the step after the completed one, but on a substep that is on or before a completed substep
    */
    const stepComplete = (stepIndex <= completedStep || (stepIndex === completedStep + 1 && index <= completedSubStep));
    const stepIsActive = stepIndex === activeStep && index === activeSubstep;
    const futureStep = !stepIsActive && !stepComplete;

    return (
        <div className={cx(styles.substepWrapper,
            { [styles.substepComplete]: stepComplete,
                [styles.substepActive]: stepIsActive,
                [styles.substepPending]: futureStep })
        }
        >
            <SubstepCompletionIndicator completed={stepComplete} future={futureStep} active={stepIsActive} />
            <div className={styles.substep} id={`step-${stepIndex}-${index}`}>
                <span className={styles.substepTitle}>{step.title}</span>
                <div className={cx({ [styles.hidden]: futureStep })}>
                    <span className={styles.substepDescription}>
                        {
                            typeof step.description === 'function' ? step.description() : step.description
                        }
                    </span>
                    <div>
                        <Actions
                            actions={step.actions}
                            index={index}
                            stepIndex={stepIndex}
                            substepIndex={index}
                        />
                    </div>
                </div>
            </div>
        </div>

    );
};

export default Substep;
