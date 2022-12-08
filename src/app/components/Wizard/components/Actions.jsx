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
import pubsub from 'pubsub-js';
import { uniqueId } from 'lodash';
import controller from 'app/lib/controller';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import { useWizardAPI, useWizardContext } from 'app/components/Wizard/context';
import styles from '../index.styl';


const Actions = ({ actions = [], stepIndex, substepIndex }) => {
    const { markActionAsComplete, completeSubStep, scrollToActiveStep, setIsLoading } = useWizardAPI();
    const { isLoading } = useWizardContext();
    pubsub.subscribe('wizard:next', (msg, indexes) => {
        const { stepIndex: stepIn, substepIndex: subStepIn } = indexes;
        if (stepIn === stepIndex && subStepIn === substepIndex) {
            markActionAsComplete(stepIndex, substepIndex);
            const activeValues = completeSubStep(stepIndex, substepIndex);
            scrollToActiveStep(activeValues);
            setIsLoading(false);
        }
    });
    return (
        <>
            {
                actions.length > 0 && <h2 className={styles.subHeading}>Run GCode:</h2>
            }
            <div className={styles.actionRow}>

                {
                    actions.map((action, index) => {
                        const cbWithCompletion = () => {
                            setIsLoading(true);
                            controller.command('wizard:step', stepIndex, substepIndex);
                            action.cb();
                        };
                        return (
                            <div key={`action-${uniqueId()}`}>
                                {
                                    isLoading
                                        ? (
                                            index === 0 &&
                                                <span className={styles.loadingSpan}>Running</span>
                                        ) : (
                                            <>
                                                <ToolModalButton onClick={cbWithCompletion} icon="fas fa-code" id="button-action">
                                                    {action.label}
                                                </ToolModalButton>
                                                {
                                                    (index !== actions.length - 1) && <span className={styles.orSpan}>OR</span>
                                                }
                                            </>
                                        )
                                }
                            </div>
                        );
                    })
                }
            </div>
        </>
    );
};

export default Actions;
