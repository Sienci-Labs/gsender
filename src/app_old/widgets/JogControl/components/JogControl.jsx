/*
 * Copyright (C) 2021 Sienci Labs Inc.
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
import { useLongPress } from 'use-long-press';
import cx from 'classnames';
import styles from '../index.styl';

const JogControl = ({ timeout = 600, disabled = false, jog, continuousJog, stopContinuousJog, className, children }) => {
    const bind = useLongPress((e) => {
        console.log('long');
        continuousJog();
    }, {
        threshold: timeout,
        onCancel: (e) => {
            console.log('test');
            jog();
        },
        onFinish: stopContinuousJog,
    });

    return (
        <button
            type="button"
            className={cx(styles.btnKeypad, className)}
            disabled={disabled}
            {...bind()}
        >
            {children}
        </button>
    );
};

export default JogControl;
