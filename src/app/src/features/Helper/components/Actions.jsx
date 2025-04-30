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

import React, { useEffect } from 'react';
import pubsub from 'pubsub-js';
import reduxStore from 'app/store/redux';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import controller from 'app/lib/controller';
import ToolModalButton from 'app/components/ToolModalButton';
import { useWizardAPI, useWizardContext } from 'app/features/Helper/context';
import styles from '../index.module.styl';
import { FaCode } from 'react-icons/fa';

const Actions = ({ actions = [], stepIndex, substepIndex }) => {
    const {
        markActionAsComplete,
        completeSubStep,
        scrollToActiveStep,
        setIsLoading,
        updateSubstepOverlay,
    } = useWizardAPI();
    const { isLoading } = useWizardContext();

    const isNotIdle = () => {
        const state = reduxStore.getState();
        const activeState = get(
            state,
            'controller.state.status.activeState',
            '',
        );
        return activeState !== GRBL_ACTIVE_STATE_IDLE;
    };

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('wizard:next', (msg, indexes) => {
                const { stepIndex: stepIn, substepIndex: subStepIn } = indexes;
                if (stepIn === stepIndex && subStepIn === substepIndex) {
                    markActionAsComplete(stepIndex, substepIndex);
                    const activeValues = completeSubStep(
                        stepIndex,
                        substepIndex,
                    );
                    updateSubstepOverlay(activeValues);
                    scrollToActiveStep(activeValues);
                    setIsLoading(false);
                }
            }),
            pubsub.subscribe('error', (msg, error) => {
                setIsLoading(false);
            }),
        ];

        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
        };
    }, []);

    return (
        <>
            {actions.length > 0 && (
                <h2 className={styles.subHeading}>Run G-Code:</h2>
            )}
            <div className={styles.actionRow}>
                {actions.map((action, index) => {
                    const cbWithCompletion = () => {
                        setIsLoading(true);
                        controller.command(
                            'wizard:step',
                            stepIndex,
                            substepIndex,
                        );
                        action.cb();
                    };
                    return (
                        <React.Fragment key={`action-${uniqueId()}`}>
                            {isLoading ? (
                                index === 0 && (
                                    <span className={styles.loadingSpan}>
                                        Running
                                    </span>
                                )
                            ) : (
                                <>
                                    <ToolModalButton
                                        disabled={isNotIdle()}
                                        onClick={cbWithCompletion}
                                        icon={<FaCode />}
                                        id="button-action"
                                    >
                                        {action.label}
                                    </ToolModalButton>
                                    {index !== actions.length - 1 && (
                                        <span className={styles.orSpan}>
                                            OR
                                        </span>
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
};

export default Actions;
