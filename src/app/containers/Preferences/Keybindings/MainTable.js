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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Table from 'app/components/Table';
import ToggleSwitch from 'app/components/ToggleSwitch';

import { formatShortcut } from './helpers';
import styles from './edit-area.styl';

/**
 * Keybindings Table Component
 * @param {Function} onEdit Function to handle keybinding item edit
 * @param {Array} data List of eybind objects
 */
export default class MainTable extends Component {
    static propTypes = {
        onEdit: PropTypes.func,
        onDelete: PropTypes.func,
        onShortcutToggle: PropTypes.func,
        data: PropTypes.array,
    }

    renders = {
        renderShortcutCell: (_, row) => {
            const { keys, isActive } = row;
            const shortcut = keys.split('+');

            const { onEdit, onDelete } = this.props;

            if (!shortcut[0]) {
                return (
                    <div className={styles.shortcutRowHeader}>
                        <span style={{ height: '21px' }} />

                        <div className={styles['icon-area']}>
                            <i
                                role="button"
                                tabIndex={-1}
                                className={cx('far fa-trash-alt', styles.deleteIcon, styles.disabledIcon)}
                                onClick={() => onDelete(row)}
                                onKeyDown={null}
                            />
                            <i
                                role="button"
                                tabIndex={-1}
                                className={cx('fas fa-edit', styles.editIcon)}
                                onClick={() => onEdit(row)}
                                onKeyDown={null}
                            />
                        </div>
                    </div>
                );
            }

            let cleanedShortcut = null;

            //If there is an empty value as the last element in the shorcut array,
            //that means a plus key is supposed to be there, but it was filtered out
            //due to keys.split
            if (shortcut[shortcut.length - 1] === '') {
                cleanedShortcut = shortcut.filter(item => item !== '');
                cleanedShortcut.push('+');
            }

            const output = cleanedShortcut ? formatShortcut(cleanedShortcut, isActive) : formatShortcut(shortcut, isActive);

            return (
                <div className={styles.shortcutRowHeader}>
                    <span>{output}</span>
                    <div className={styles['icon-area']}>
                        <i
                            role="button"
                            tabIndex={-1}
                            className={cx('far fa-trash-alt', styles.deleteIcon)}
                            onClick={() => onDelete(row)}
                            onKeyDown={null}
                        />
                        <i
                            role="button"
                            tabIndex={-1}
                            className={cx('fas fa-edit', styles.editIcon)}
                            onClick={() => onEdit(row)}
                            onKeyDown={null}
                        />
                    </div>
                </div>
            );
        },
        renderActionCell: (_, row) => {
            return (
                <i
                    role="button"
                    tabIndex={-1}
                    className="fas fa-edit"
                    onClick={() => this.props.onEdit(row)}
                    onKeyDown={null}
                />
            );
        },
        renderToggleCell: (_, row) => {
            return (
                <ToggleSwitch
                    checked={row.isActive}
                    onChange={(isActive) => {
                        this.props.onShortcutToggle({ ...row, isActive }, false);
                    }}
                />
            );
        }
    }

    columns = [
        { dataIndex: 'title', title: 'Action', sortable: true, key: 'title', width: '35%' },
        { dataIndex: 'keys', title: 'Shortcut', sortable: true, key: 'keys', width: '55%', render: this.renders.renderShortcutCell },
        { dataIndex: 'isActive', title: 'Active', key: 'isActive', width: '10%', render: this.renders.renderToggleCell }
    ];

    render() {
        const columns = this.columns;
        const { data } = this.props;

        return (
            <Table
                bordered
                rowKey="id"
                columns={columns}
                data={data}
            />
        );
    }
}
