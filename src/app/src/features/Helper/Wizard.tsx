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
import styles from './index.module.styl';
import pubsub from 'pubsub-js';
import Instructions from 'app/features/Helper/components/Instructions';
import Stepper from 'app/features/Helper/components/Stepper';
import { useWizardContext, useWizardAPI } from 'app/features/Helper/context';
import cx from 'classnames';
import MinMaxButton from 'app/features/Helper/components/MinMaxButton';
import CancelButton from 'app/features/Helper/components/CancelButton';
import { CSSTransition } from 'react-transition-group';
import { FaHatWizard } from 'react-icons/fa';

const Wizard = () => {
    const { title, visible, minimized, activeStep, overlay, steps } =
        useWizardContext();
    const { load, updateSubstepOverlay } = useWizardAPI();

    useEffect(() => {
        pubsub.subscribe('wizard:load', (_, payload) => {
            const { instructions, title } = payload;
            load(instructions, title);
            updateSubstepOverlay(
                { activeStep: 0, activeSubstep: 0 },
                instructions.steps,
            );
        });
    }, []);

    return (
        <>
            <div
                className={cx({
                    [styles.hidden]: !visible,
                    [styles.overlay]: !minimized && overlay,
                })}
            />
            <div
                className={cx({
                    [styles.hidden]: !visible,
                    [styles.wrapper]: !minimized,
                })}
            >
                tester
                <div
                    className={cx({
                        [styles.hidden]: !visible || !overlay,
                        [styles.infoMsgContainer]: !minimized && overlay,
                    })}
                >
                    <div className={styles.infoMsgHeading}>
                        Widgets are disabled
                    </div>
                    <div className={styles.infoMsg}>
                        Please use the button(s) in the wizard instead.
                    </div>
                </div>
                <div
                    className={cx({
                        [styles.hidden]: !visible,
                        [styles.minimizedWrapper]: minimized,
                        [styles.wizardWrapper]: !minimized,
                    })}
                >
                    <div className={styles.wizardTitle}>
                        <h1>
                            <FaHatWizard /> {title} - Step {activeStep + 1} of{' '}
                            {steps.length}
                        </h1>
                        <div style={{ display: 'flex' }}>
                            <MinMaxButton />
                            <CancelButton />
                        </div>
                    </div>
                    <CSSTransition
                        key="wizContent"
                        timeout={350}
                        classNames={{
                            enterActive: styles.maximizeActive,
                            enterDone: styles.maximizeDone,
                            exitActive: styles.minimizeActive,
                            exitDone: styles.minimizeDone,
                        }}
                    >
                        <div
                            id="wizContent"
                            className={cx(styles.wizardContent, {
                                [styles.hidden]: minimized,
                            })}
                        >
                            <Stepper />
                            <Instructions />
                        </div>
                    </CSSTransition>
                </div>
            </div>
        </>
    );
};

export default Wizard;
