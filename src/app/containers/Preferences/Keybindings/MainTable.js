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
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
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
        renderShortcutCell: (row) => {
            const { keys, isActive, title } = row;
            const shortcut = [...keys][0] === '+' ? ['+'] : keys.split('+');

            const { onEdit, onDelete } = this.props;

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
                        hasShortcut || title
                            ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '1rem' }}>
                                    {title ? <kbd>{keys}</kbd> : output}
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
        renderToggleCell: (row) => {
            const { onShortcutToggle } = this.props;
            return (
                <ToggleSwitch
                    checked={row.isActive}
                    onChange={(isActive) => {
                        onShortcutToggle({ ...row, isActive }, false);
                    }}
                />
            );
        },
        renderCategoryCell: (row) => {
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
    }

    columns = [
        { id: 'title', label: 'Action', maxWidth: 50 },
        { id: 'keys', label: 'Shortcut', minWidth: 250 },
        { id: 'category', label: 'Category', minWidth: 148, align: 'center' },
        { id: 'isActive', label: 'Active', minWidth: 74 }
    ];

    render() {
        const columns = this.columns;
        const { data } = this.props;

        const StyledTableCell = styled(TableCell)(({ theme }) => ({
            [`&.${tableCellClasses.head}`]: {
                backgroundColor: '#e5e5e5',
                color: theme.palette.common.black,
                fontSize: '1.1rem'
            },
        }));

        const StyledTableRow = styled(TableRow)(({ theme }) => ({
            '&:nth-of-type(odd)': {
                backgroundColor: theme.palette.action.hover,
            },
            // hide last border
            '&:last-child td, &:last-child th': {
                border: 0,
            },
        }));

        return (
            <TableContainer component={Paper} sx={{ height: '100% !important' }}>
                <Table sx={{ minWidth: 743 }} stickyHeader aria-label="sticky table">
                    <TableHead>
                        <StyledTableRow>
                            {columns.map((column, index) => (
                                <StyledTableCell
                                    key={index}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                    sx={{ fontSize: '1rem' }}
                                >
                                    {column.label}
                                </StyledTableCell>
                            ))}
                        </StyledTableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, index) => (
                            <StyledTableRow
                                key={index}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <StyledTableCell component="th" scope="row">
                                    {row.title}
                                </StyledTableCell>
                                <StyledTableCell>{ this.renders.renderShortcutCell(row) }</StyledTableCell>
                                <StyledTableCell>{ this.renders.renderCategoryCell(row) }</StyledTableCell>
                                <StyledTableCell>{ this.renders.renderToggleCell(row) }</StyledTableCell>
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}
