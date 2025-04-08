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
import { cn } from 'app/lib/utils';

import { LuTrash, LuPencil, LuPlus } from 'react-icons/lu';

import Switch from 'app/components/Switch';
import shuttleEvents from 'app/lib/shuttleEvents';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';
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
    COOLANT_CATEGORY,
    GRBLHAL,
} from 'app/constants';
import Button from 'app/components/Button';

import { formatShortcut } from './helpers';

const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

/**
 * Shortcuts Table Component
 * @prop {Function} onEdit Function to edit shortcuts
 * @prop {Array} data List of shortcut objects
 */
const ShortcutsTable = ({ onEdit, onDelete, onShortcutToggle, dataSet }) => {
    const renderShortcutCell = (row) => {
        const { keys, isActive, keysName } = row;
        const shortcut = [...keys][0] === '+' ? ['+'] : keys.split('+');
        const hasShortcut = !!shortcut[0];

        let cleanedShortcut = null;

        //If there is an empty value as the last element in the shorcut array,
        //that means a plus key is supposed to be there, but it was filtered out
        //due to keys.split
        if (shortcut[shortcut.length - 1] === '') {
            cleanedShortcut = shortcut.filter((item) => item !== '');
            cleanedShortcut.push('+');
        }

        const output = cleanedShortcut
            ? formatShortcut(cleanedShortcut, isActive)
            : formatShortcut(shortcut, isActive);

        return (
            <div className="flex justify-between items-center">
                {hasShortcut || '' ? (
                    <div className="flex flex-wrap gap-2 items-center bg-gray-100 rounded-md p-1 dark:bg-dark">
                        {keysName ? (
                            <kbd className="px-2 py-1 rounded dark:text-white">
                                {keysName}
                            </kbd>
                        ) : (
                            output
                        )}
                    </div>
                ) : null}
                <div className="flex gap-2 items-center">
                    {hasShortcut ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={
                                    <LuTrash className="text-red-500 hover:text-red-700 w-6 h-6" />
                                }
                                onClick={() => onDelete(row)}
                                onKeyDown={() => onDelete(row)}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={
                                    <LuPencil className="text-blue-500 hover:text-blue-700 w-6 h-6" />
                                }
                                onClick={() => onEdit(row)}
                                onKeyDown={null}
                            />
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={
                                <LuPlus className="text-blue-500 hover:text-blue-700 w-6 h-6" />
                            }
                            onClick={() => onEdit(row)}
                            onKeyDown={null}
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderToggleCell = (row) => {
        return (
            <Switch
                checked={row.isActive}
                onChange={(isActive) => {
                    onShortcutToggle({ ...row, isActive }, false);
                }}
            />
        );
    };

    const renderCategoryCell = (row) => {
        const baseClass = 'px-2 py-1 rounded text-center';

        const rowCategory = allShuttleControlEvents[row.cmd]
            ? allShuttleControlEvents[row.cmd].category
            : row.category;

        const categoryClass =
            {
                [CARVING_CATEGORY]: 'bg-green-100 text-green-800',
                [OVERRIDES_CATEGORY]: 'bg-blue-100 text-blue-800',
                [VISUALIZER_CATEGORY]: 'bg-pink-100 text-pink-800',
                [LOCATION_CATEGORY]: 'bg-orange-100 text-orange-800',
                [JOGGING_CATEGORY]: 'bg-red-100 text-red-800',
                [PROBING_CATEGORY]: 'bg-purple-100 text-purple-800',
                [SPINDLE_LASER_CATEGORY]: 'bg-gray-800 text-gray-300',
                [GENERAL_CATEGORY]: 'bg-gray-200 text-gray-800',
                [TOOLBAR_CATEGORY]: 'bg-indigo-100 text-indigo-800',
                [MACRO_CATEGORY]: 'bg-blue-50 text-blue-600',
                [COOLANT_CATEGORY]: 'bg-red-200 text-red-900',
            }[rowCategory] || 'bg-gray-100 text-gray-800';

        return (
            <div className={cn(baseClass, categoryClass)}>{rowCategory}</div>
        );
    };

    const renderTitleCell = (row) => {
        const rowTitle = allShuttleControlEvents[row.cmd]
            ? allShuttleControlEvents[row.cmd].title
            : row.title;
        const isSpecial =
            allShuttleControlEvents[row.cmd]?.payload?.type === GRBLHAL;
        return (
            <div>
                {rowTitle}
                {isSpecial ? <strong>*</strong> : ''}
            </div>
        );
    };

    return (
        <div className="absolute w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[25%]">Action</TableHead>
                        <TableHead className="w-[45%]">Shortcut</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Active</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dataSet.map((row) => (
                        <TableRow key={row.cmd}>
                            <TableCell>{renderTitleCell(row)}</TableCell>
                            <TableCell>{renderShortcutCell(row)}</TableCell>
                            <TableCell>{renderCategoryCell(row)}</TableCell>
                            <TableCell>{renderToggleCell(row)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

ShortcutsTable.propTypes = {
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onShortcutToggle: PropTypes.func,
    dataSet: PropTypes.array,
};

export default ShortcutsTable;
