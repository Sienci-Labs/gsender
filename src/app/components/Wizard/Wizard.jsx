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
import Stepper from 'app/components/Wizard/components/Stepper';
import { useWizardContext, useWizardAPI } from 'app/components/Wizard/context';
import cx from 'classnames';

const wizard = {
    steps: [
        {
            title: 'Change bit',
            substeps: [
                {
                    content: 'Turn off router or verify that spindle is off.'
                },
                {
                    content: 'Change bit to requested tool.'
                }
            ]
        },
        {
            title: 'Setup probe',
            substeps: [
                {
                    content: 'Setup touchplate and attach continuity collets.'
                },
                {
                    content: 'Jog router into position above the touch plate using the jog controls'
                }
            ]
        },
        {
            title: 'Probe new tool length',
            substeps: [
                {
                    content: 'Probe tool length'
                }
            ]
        },
        {
            title: 'Resume Program',
            substeps: [
                {
                    content: 'Start next cutting operation'
                }
            ]
        }
    ]
};

const Wizard = () => {
    const { title, visible } = useWizardContext();
    const { load } = useWizardAPI();
    useEffect(() => {
        load(wizard, 'Toolchange: Manual');
    }, []);
    return (
        <div className={cx(styles.wizardWrapper, { [styles.hidden]: !visible })}>
            <div className={styles.wizardTitle}>
                <h1>{title}</h1>
            </div>
            <div className={styles.wizardContent}>
                <div className={styles.instructionWrapper}>
                    <Instructions />
                </div>
                <Stepper />
            </div>
        </div>
    );
};

export default Wizard;
