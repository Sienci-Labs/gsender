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
import uniqueId from 'lodash/uniqueId';
import { useWizardContext } from 'app/features/Helper/context';
import Substep from 'app/features/Helper/components/Substep';
import Introduction from 'app/features/Helper/components/Introduction';
import Controls from './Controls';
import styles from '../index.module.styl';

const Instructions = () => {
    const { steps, intro, title } = useWizardContext();

    return (
        <div className={styles.instructionWrapper}>
            <div className={styles.stepWrapper}>
                {intro && <Introduction description={intro} title={title} />}
                {steps.map((step, stepIndex) => {
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <div
                            className={styles.substeps}
                            key={`substepwrapper-${stepIndex}`}
                        >
                            <h2 className={styles.instructionTitle}>
                                {step.title}
                            </h2>
                            {
                                // eslint-disable-next-line react/no-array-index-key
                                step.substeps.map((step, index) => (
                                    <Substep
                                        step={step}
                                        key={`substep-${uniqueId()}`}
                                        index={index}
                                        stepIndex={stepIndex}
                                    />
                                ))
                            }
                        </div>
                    );
                })}
            </div>
            <Controls />
        </div>
    );
};

export default Instructions;
