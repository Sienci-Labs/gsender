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
import Select from 'react-select';
import map from 'lodash/map';
import styles from '../index.styl';

const defaultBaudrates = [
    250000,
    115200,
    57600,
    38400,
    19200,
    9600,
    2400
];

const Baudrates = ({ onChange, baudrate }) => {
    const renderBaudrate = (option) => {
        const style = {
            color: '#333',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
        };
        return (
            <div className={styles.inputText} style={style} title={option.label}>{option.label}</div>
        );
    };

    return (
        <div>
            <h4 className={styles.settingsSubtitle}>Baudrate</h4>
            <Select
                backspaceRemoves={false}
                className="sm"
                clearable={false}
                menuContainerStyle={{ zIndex: 5 }}
                name="baudrate"
                onChange={onChange}
                options={map(defaultBaudrates, (value) => ({
                    value: value,
                    label: Number(value).toString()
                }))}
                searchable={false}
                value={{ label: baudrate }}
                valueRenderer={renderBaudrate}
            />
        </div>

    );
};

export default Baudrates;
