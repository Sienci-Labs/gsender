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

import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import store from 'app/store';
import Select from 'react-select';
import map from 'lodash/map';
import styles from '../index.styl';
import FieldSet from '../FieldSet';


const options = [
    'Ignore',
    'Pause',
    'Macro'
];


const EventWidget = ({ active }) => {
    const [toolChangeOption, setToolChangeOption] = useState(store.get('workspace.toolChangeOption'));
    const handleToolChange = (selection) => setToolChangeOption(selection.value);

    useEffect(() => {
        store.set('workspace.toolChangeOption', toolChangeOption);
    }, [toolChangeOption]);

    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles.settingsTitle}>
                Events
            </h3>
            <div className={styles.generalArea}>
                <FieldSet legend="Tool Change">
                    <small>Strategy to handle M6 tool change commands</small>
                    <div className={styles.addMargin}>
                        <Select
                            backspaceRemoves={false}
                            className="sm"
                            clearable={false}
                            menuContainerStyle={{ zIndex: 5 }}
                            name="theme"
                            onChange={handleToolChange}
                            options={map(options, (value) => ({
                                value: value,
                                label: value
                            }))}
                            value={{ label: toolChangeOption }}
                        />
                    </div>
                </FieldSet>
            </div>
        </div>
    );
};

export default EventWidget;
