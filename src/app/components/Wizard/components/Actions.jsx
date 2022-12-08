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

import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import { useWizardAPI } from 'app/components/Wizard/context';

import styles from '../index.styl';


const Actions = ({ actions = [], stepIndex, substepIndex }) => {
    const { markActionAsComplete, completeSubStep, scrollToActiveStep } = useWizardAPI();
    return (
        <>
            {
                actions.length > 0 && <h2 className={styles.subHeading}>Run GCode:</h2>
            }
            <div className={styles.actionRow}>

                {
                    actions.map((action, index) => {
                        const cbWithCompletion = () => {
                            markActionAsComplete(stepIndex, substepIndex);
                            action.cb();
                            completeSubStep();
                            scrollToActiveStep();
                        };
                        return (
                            // eslint-disable-next-line react/no-array-index-key
                            <React.Fragment key={`action-${index}`}>
                                <ToolModalButton onClick={cbWithCompletion} icon="fas fa-code">
                                    {action.label}
                                </ToolModalButton>
                                {
                                    (index !== actions.length - 1) && <span className={styles.orSpan}>OR</span>
                                }
                            </React.Fragment>
                        );
                    })
                }
            </div>
        </>
    );
};

export default Actions;
