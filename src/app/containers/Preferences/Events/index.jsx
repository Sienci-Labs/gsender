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
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import { TOASTER_SUCCESS, Toaster } from 'app/lib/toaster/ToasterLib';
import controller from 'app/lib/controller';
import store from 'app/store';
import Select from 'react-select';
import map from 'lodash/map';
import styles from '../index.styl';
import FieldSet from '../FieldSet';

const options = [
    'Ignore',
    'Pause',
    'Code'
];

const EventWidget = ({ active }) => {
    // State
    const [toolChangeOption, setToolChangeOption] = useState(store.get('workspace.toolChangeOption'));
    const [preHook, setPreHook] = useState(store.get('workspace.toolChangeHooks.preHook'));
    const [postHook, setPostHook] = useState(store.get('workspace.toolChangeHooks.postHook'));
    // Handlers
    const handleToolChange = (selection) => setToolChangeOption(selection.value);
    const handlePreHookChange = (e) => setPreHook(e.target.value);
    const handlePostHookChange = (e) => setPostHook(e.target.value);
    const handleSaveCode = (e) => {
        store.set('workspace.toolChangeHooks.preHook', preHook);
        store.set('workspace.toolChangeHooks.postHook', postHook);
        const context = {
            toolChangeOption,
            postHook,
            preHook
        };
        controller.command('toolchange:context', context);
        Toaster.pop({
            msg: 'Saved tool change hooks',
            type: TOASTER_SUCCESS,
            icon: 'fa-check'
        });
    };

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
                Tool Change
            </h3>
            <div className={styles.generalArea}>
                <FieldSet legend="Tool Change" className={styles.paddingBottom}>
                    <small>Strategy to handle M6 tool change commands</small>
                    <div className={styles.addMargin}>
                        <Select
                            backspaceRemoves={false}
                            className="sm"
                            clearable={false}
                            menuContainerStyle={{ zIndex: 5 }}
                            name="toolchangeoption"
                            onChange={handleToolChange}
                            options={map(options, (value) => ({
                                value: value,
                                label: value
                            }))}
                            value={{ label: toolChangeOption }}
                        />
                    </div>
                    {
                        toolChangeOption === 'Code' &&
                        <div>
                            <label htmlFor="preHook">Pre-Hook</label>
                            <textarea
                                rows="10"
                                className="form-control"
                                name="preHook"
                                value={preHook}
                                onChange={handlePreHookChange}
                            />
                            <small>The pre-hook will run once a M6 command has occurred and will pause once completed</small>
                            <br />
                            <label htmlFor="preHook">Post-Hook</label>
                            <textarea
                                rows="10"
                                className="form-control"
                                name="postHook"
                                value={postHook}
                                onChange={handlePostHookChange}
                            />
                            <small>The post-hook will run after the tool change has been confirmed in the user interface.</small>
                            <FunctionButton primary onClick={handleSaveCode}>Save G-Code</FunctionButton>
                        </div>
                    }
                </FieldSet>
            </div>
        </div>
    );
};

export default EventWidget;
