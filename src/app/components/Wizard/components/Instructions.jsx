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
import { /*useWizardAPI,*/ useWizardContext } from 'app/components/Wizard/context';
import Substep from 'app/components/Wizard/components/Substep';
import Controls from './Controls';
import styles from '../index.styl';

const Instructions = () => {
    const { steps } = useWizardContext();
    //const {  } = useWizardAPI();

    return (
        <>
        {
            steps.map(step => {
                return (
                    <div className={styles.substeps}>
                        <h2 className={styles.instructionTitle}>{step.title}</h2>
                        {
                            step.substeps.map((step, index) => <Substep step={step} key={index} index={index} />)
                        }
                    </div>
                );
            })
        }
            <Controls />
        </>
    );

    //const steps = getSubsteps(activeStep);
    /*return (
        <>
            <div className={styles.substeps}>
                <h2 className={styles.instructionTitle}>{getStepTitle(activeStep)}</h2>
                {
                    steps.map((step, index) => <Substep step={step} key={index} index={index} />)
                }
            </div>
            <Controls />
        </>
    );*/
};

export default Instructions;
