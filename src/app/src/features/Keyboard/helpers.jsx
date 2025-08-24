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

import React, { Fragment } from 'react';

import { cn } from 'app/lib/utils';

export const formatShortcut = (shortcut = [], isActive = true) => {
    const baseClass = 'px-2 py-1 rounded';
    const opacityClass = !isActive ? 'opacity-40' : 'opacity-100';
    const output = [];

    for (let i = 0; i < shortcut.length; i++) {
        if (i === shortcut.length - 1) {
            output.push(
                <kbd className={cn(baseClass, opacityClass)} key={i}>
                    {shortcut[i]}
                </kbd>,
            );
        } else {
            output.push(
                <Fragment key={i}>
                    <kbd className={cn(baseClass, opacityClass)}>
                        {shortcut[i]}
                    </kbd>{' '}
                    <span className={opacityClass}>+</span>{' '}
                </Fragment>,
            );
        }
    }

    return output;
};

// Helper function to determine if a key should hide the shift key
export const shouldHideShiftForKey = (key) => {
    // Special characters that are secondary to number keys
    const specialChars = [
        '!',
        '@',
        '#',
        '$',
        '%',
        '^',
        '&',
        '*',
        '(',
        ')',
        '_',
        '+',
        '{',
        '}',
        '|',
        ':',
        '"',
        '<',
        '>',
        '?',
        '~',
    ];
    return specialChars.includes(key);
};
