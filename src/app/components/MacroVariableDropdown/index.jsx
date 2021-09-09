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

import { Dropdown } from 'react-bootstrap';
import variables from 'app/constants/variables';
import Space from 'app/components/Space';
import insertAtCaret from 'app/widgets/Macro/insertAtCaret';
import uniqueId from 'lodash/uniqueId';
import styles from './index.styl';


const MacroVariableDropdown = ({ textarea, label = '' }) => {
    return (
        <div className="form-group">
            <div className={styles['macro-commands']}>
                <label>{ label }</label>
                <Dropdown
                    id="add-macro-dropdown"
                    className="pull-right"
                    onSelect={(eventKey) => {
                        if (textarea) {
                            insertAtCaret(textarea.current, eventKey);
                        }
                    }}
                >
                    <Dropdown.Toggle
                        className={styles.btnLink}
                        style={{ boxShadow: 'none' }}
                    >
                        <i className="fa fa-plus" />
                        <Space width="8" />
                        Variables
                        <Space width="4" />
                        <i className="fa fa-caret-down" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={styles.macroVariablesDropdown}>
                        {variables.map(v => {
                            if (typeof v === 'object') {
                                return v.type === 'header' ? (
                                    <Dropdown.Header
                                        key={uniqueId()}
                                    >
                                        {v.text}
                                    </Dropdown.Header>
                                ) : (
                                    <Dropdown.Item
                                        key={uniqueId()}
                                        eventKey={v}
                                        className={styles['dropdown-item']}
                                    >
                                        {v.text}
                                    </Dropdown.Item>
                                );
                            }

                            return (
                                <Dropdown.Item
                                    eventKey={v}
                                    key={uniqueId()}
                                    className={styles['dropdown-item']}
                                >
                                    {v}
                                </Dropdown.Item>
                            );
                        })}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};

export default MacroVariableDropdown;
