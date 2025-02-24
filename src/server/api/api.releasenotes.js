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

import fs from 'fs';
import path from 'path';

export const fetchReleaseNotes = (req, res) => {
    const releaseNotes = fs.readFileSync(path.join(__dirname, '../../../README.md'), 'utf8');
    const releases = [];
    const releaseRegex = /###\s+([\d.]+)\s+\((.*?)\)\s*([\s\S]*?)(?=\n###\s|$)/g;

    let match;
    while ((match = releaseRegex.exec(releaseNotes)) !== null) {
        const version = match[1];
        const date = match[2];
        const notes = match[3].trim()
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.substring(2).trim());

        releases.push({
            version,
            date,
            notes
        });
    }

    const latestReleases = releases.slice(0, 5);
    return res.send(latestReleases);
};
