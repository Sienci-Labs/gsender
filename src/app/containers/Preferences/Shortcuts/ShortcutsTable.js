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
import PropTypes from 'prop-types';
import cx from 'classnames';
import Table from 'app/components/Table';
import ToggleSwitch from 'app/components/ToggleSwitch';

import {
    CARVING_CATEGORY,
    OVERRIDES_CATEGORY,
    VISUALIZER_CATEGORY,
    LOCATION_CATEGORY,
    JOGGING_CATEGORY,
    PROBING_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    GENERAL_CATEGORY,
    TOOLBAR_CATEGORY,
    MACRO_CATEGORY,
    COOLANT_CATEGORY
} from 'app/constants';

import { formatShortcut } from './helpers';
import styles from './edit-area.styl';

/**
 * Shortcuts Table Component
 * @prop {Function} onEdit Function to edit shortcuts
 * @prop {Array} data List of shortcut objects
 */
const ShortcutsTable = ({ onEdit, onDelete, onShortcutToggle, data }) => {
    const renders = {
        renderShortcutCell: (_, row) => {
            const { keys, isActive, keysName } = row;
            const shortcut = [...keys][0] === '+' ? ['+'] : keys.split('+');

            const hasShortcut = !!shortcut[0];

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
                <div className={styles.shortcutComboColumn}>
                    {
                        hasShortcut || keysName
                            ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    {keysName ? <kbd>{keysName}</kbd> : output}
                                </div>
                            )
                            : <div style={{ height: '24px' }} />
                    }
                    <div className={styles['icon-area']}>
                        {
                            hasShortcut && (
                                <i
                                    role="button"
                                    tabIndex={-1}
                                    className={cx('far fa-trash-alt', styles.deleteIcon, !hasShortcut ? styles.disabledIcon : '')}
                                    onClick={() => onDelete(row)}
                                    onKeyDown={() => onDelete(row)}
                                />
                            )
                        }
                        <i
                            role="button"
                            tabIndex={-1}
                            className={cx(hasShortcut ? 'fas fa-edit' : 'fas fa-plus', styles.actionIcon)}
                            onClick={() => onEdit(row)}
                            onKeyDown={null}
                        />
                    </div>
                </div>
            );
        },
        renderToggleCell: (_, row) => {
            return (
                <ToggleSwitch
                    checked={row.isActive}
                    onChange={(isActive) => {
                        onShortcutToggle({ ...row, isActive }, false);
                    }}
                />
            );
        },
        renderCategoryCell: (_, row) => {
            const categories = {
                [CARVING_CATEGORY]: 'categoryGreen',
                [OVERRIDES_CATEGORY]: 'categoryBlue',
                [VISUALIZER_CATEGORY]: 'categoryPink',
                [LOCATION_CATEGORY]: 'categoryOrange',
                [JOGGING_CATEGORY]: 'categoryRed',
                [PROBING_CATEGORY]: 'categoryPurple',
                [SPINDLE_LASER_CATEGORY]: 'categoryBlack',
                [GENERAL_CATEGORY]: 'categoryGrey',
                [TOOLBAR_CATEGORY]: 'categoryWhite',
                [MACRO_CATEGORY]: 'categoryLightBlue',
                [COOLANT_CATEGORY]: 'categoryDarkRed'
            };

            const category = categories[row.category];

            return (
                <div className={styles[category]}>{row.category}</div>
            );
        }
    };

    const columns = [
        { dataKey: 'title', title: 'Action', sortable: true, width: '25%' },
        { dataKey: 'keys', title: 'Shortcut', sortable: true, width: '45%', render: renders.renderShortcutCell },
        { dataKey: 'category', title: 'Category', sortable: true, width: '20%', render: renders.renderCategoryCell },
        { dataKey: 'isActive', title: 'Active', width: '10%', render: renders.renderToggleCell }
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            data={data}
            width={743}
        />
    );
};

ShortcutsTable.propTypes = {
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onShortcutToggle: PropTypes.func,
    data: PropTypes.array,
};

export default ShortcutsTable;
