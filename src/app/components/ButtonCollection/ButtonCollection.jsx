/*
 * Copyright (C) 2023 Sienci Labs Inc.
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

import { uniqueId } from 'lodash';
import React from 'react';
import styles from './index.styl';

const ButtonCollection = ({ icon, buttons = [], onClick, ...props }) => {
    return (
        <div className={styles.container}>
            <div className={styles.selectorWrapper}>
                {
                    buttons.map((button) => {
                        return (
                            <button
                                key={uniqueId()}
                                type="button"
                                onClick={() => onClick(button)}
                                className={styles.selectorButton}
                                {...props}
                            >
                                { button }
                            </button>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default ButtonCollection;
