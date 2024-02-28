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

import React from 'react';
import cx from 'classnames';
import { uniqueId } from 'lodash';
import { GRBL } from 'app/constants';
import styles from './Index.styl';

const FirmwareSelector = ({ options = [], selectedFirmware, handleSelect }) => {
    selectedFirmware = selectedFirmware || GRBL; // null check
    return (
        <div className={styles.firmwareSelector}>
            <div className={styles.selectorWrapper}>
                {
                    options.map((option) => {
                        const active = selectedFirmware === option;
                        return (
                            <button
                                key={uniqueId()}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={cx(styles.selectorButton, { [styles.selected]: active })}
                            >
                                { option }
                            </button>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default FirmwareSelector;
