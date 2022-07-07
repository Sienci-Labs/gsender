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
import store from '../../../store';

export const formatShortcut = (shortcut = [], isActive = true) => {
    const output = [];
    const style = {
        opacity: !isActive ? '0.4' : '1'
    };

    for (let i = 0; i < shortcut.length; i++) {
        if (i === shortcut.length - 1) {
            output.push(<kbd style={style} key={i}>{shortcut[i]}</kbd>);
        } else {
            output.push(<Fragment key={i}><kbd style={style}>{shortcut[i]}</kbd> <span>+</span> </Fragment>);
        }
    }

    return output;
};

export const downloadShortcuts = () => {
    const shortcuts = store.get('commandKeys');

    // console.log(shortcuts);

    const printJob = JSON.stringify(shortcuts, null, 1);
    const data = new Blob([printJob], {
        type: 'text/html',
    });

    const today = new Date();
    const filename = `Shortcuts-${today.toLocaleDateString()}-${today.toLocaleTimeString()}`;

    // IE11 & Edge
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(data, filename);
    } else {
        // In FF link must be added to DOM to be clicked
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(data);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
