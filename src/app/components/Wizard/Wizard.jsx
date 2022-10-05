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
import styles from 'app/components/Wizard/index.styl';
import Instructions from 'app/components/Wizard/components/Instructions';
import controller from 'app/lib/controller';
import Stepper from 'app/components/Wizard/components/Stepper';
import { useWizardContext, useWizardAPI } from 'app/components/Wizard/context';
import cx from 'classnames';
import MinMaxButton from 'app/components/Wizard/components/MinMaxButton';

const wizard = {
    steps: [
        {
            title: 'Change Bit',
            substeps: [
                {
                    title: 'Safety First',
                    description: 'PH COPY - Turn off router or verify that spindle is off.  Save current modals and position',
                    actions: [
                        {
                            label: 'Save Positions and Modals',
                            cb: () => {
                                controller.command('gcode', [
                                    '%wait',
                                    '%global.toolchange.XPOS=posx',
                                    '%global.toolchange.YPOS=posy',
                                    '%global.toolchange.ZPOS=posz',
                                    '%global.toolchange.UNITS=modal.units',
                                    '%global.toolchange.SPINDLE=modal.spindle',
                                    '%global.toolchange.DISTANCE=modal.distance',
                                    '%global.toolchange.FEEDRATE=modal.feedrate',
                                    'M5',
                                    'G91 G21 G0Z5',
                                    '([JSON.stringify(global.toolchange)])',
                                ]);
                            }
                        }
                    ]
                },
                {
                    title: 'Change Bit',
                    description: 'PH COPY - Change bit to requested tool.'
                }
            ]
        },
        {
            title: 'Setup Probe',
            substeps: [
                {
                    title: 'Touchplate Setup',
                    description: 'PH COPY - Setup touchplate and attach continuity collets.'
                },
                {
                    title: 'Position Router',
                    description: 'PH COPY - Jog router into position above the touch plate using the jog controls'
                }
            ]
        },
        {
            title: 'Probe Tool',
            substeps: [
                {
                    title: 'Probe',
                    description: 'PH COPY - Probe tool length',
                    actions: [
                        {
                            label: 'Probe Z',
                            cb: () => {
                                console.log('Probe Z');
                            }
                        },
                        {
                            label: 'Set Z0 at Location',
                            cb: () => {
                                console.log('Set Z Zero');
                            }
                        },
                    ]
                }
            ]
        },
        {
            title: 'Resume Path',
            substeps: [
                {
                    title: 'Resume Program',
                    description: 'PH COPY - Start next cutting operation',
                }
            ]
        }
    ]
};

const Wizard = () => {
    const { title, visible, minimized, activeStep, steps } = useWizardContext();
    const { load } = useWizardAPI();
    useEffect(() => {
        load(wizard, 'Toolchange: Manual');
    }, []);
    return (
        <div className={cx(styles.wizardWrapper, { [styles.hidden]: !visible, [styles.minimizedWrapper]: minimized })}>
            <div className={styles.wizardTitle}>
                <h1><i className="fas fa-hat-wizard" /> {title} - Step {activeStep + 1} of {steps.length}</h1>
                <MinMaxButton />
            </div>
            <div className={cx(styles.wizardContent, { [styles.hidden]: minimized })}>
                <Stepper />
                <Instructions />
            </div>
        </div>
    );
};

export default Wizard;
