/*
 * Copyright (C) 2023 Sienci Labs Inc.
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
import store from 'app/store';
import styles from './index.styl';

const PrintableShortcuts = React.forwardRef((props, ref) => {
    const [shortcutsList] = useState(store.get('commandKeys', {}));
    const [keys, setKeys] = useState([]);

    useEffect(() => {
        const keysToPrint = [];
        for (const [k, shortcut] of Object.entries(shortcutsList)) {
            if (shortcut.isActive && shortcut.keys !== '') {
                keysToPrint.push({
                    title: shortcut.title,
                    keys: shortcut.keys,
                    id: k
                });
            }
        }
        setKeys(keysToPrint);
    }, [shortcutsList]);


    return (
        <div ref={ref}>
            <div className={styles.table}>
                <table>
                    <thead>
                        <tr>
                            <th><b>Action</b></th>
                            <th><b>Shortcut</b></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            keys.map(shortcut => (
                                <tr key={`${shortcut.id}`}>
                                    <td>{shortcut.title || '-'}</td>
                                    <td><i>{shortcut.keys || '-'}</i></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default PrintableShortcuts;
