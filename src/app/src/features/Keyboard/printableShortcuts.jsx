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

import React, { useMemo } from 'react';

import store from 'app/store';
import shuttleEvents from 'app/lib/shuttleEvents';

const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

const PrintableShortcuts = React.forwardRef((_, ref) => {
    const shortcutsList = Object.entries(store.get('commandKeys', {}));

    const keys = useMemo(
        () =>
            shortcutsList
                .filter(
                    ([, shortcut]) => shortcut.isActive && shortcut.keys !== '',
                )
                .map(([key, shortcut]) => {
                    const title = allShuttleControlEvents[key]
                        ? allShuttleControlEvents[key].title
                        : shortcut.title;

                    return (
                        <tr key={shortcut.cmd}>
                            <td>{title}</td>
                            <td>
                                <i>{shortcut.keys}</i>
                            </td>
                        </tr>
                    );
                }),
        [shortcutsList],
    );

    return (
        <div ref={ref} className="p-4 m-4 print:m-0">
            <div className="w-full overflow-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2 text-left">
                                <b>Action</b>
                            </th>
                            <th className="border border-gray-300 p-2 text-left">
                                <b>Shortcut</b>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map((key) => (
                            <tr
                                key={key.key}
                                className="border-b border-gray-200"
                            >
                                {key}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default PrintableShortcuts;
