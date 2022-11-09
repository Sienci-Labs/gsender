/*
 * Copyright (C) 2022 Sienci Labs Inc.
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

const fsBase = require('fs');

const getGRBLLog = (logPath) => {
    let content = '';
    // Check whether the code is running in Electron renderer process
    try {
        if (fsBase.existsSync(logPath)) {
            content = fsBase.readFileSync(logPath, 'utf8') || '';
            if (content) {
                content = content
                    .toString()
                    .replace(/\r\n/g, '\n')
                    .split('\n');
                let tempContent = [];
                content.forEach(record => {
                    if (record.toLowerCase().includes('error') || record.toLowerCase().includes('alarm')) {
                        tempContent.push(record);
                    }
                });
                if (tempContent.length > 50) {
                    tempContent = tempContent.slice(0, 50);
                }
                content = tempContent.reverse();
            }
        }
    } catch (error) {
        console.log(error);
    }

    return content;
};

export { getAllErrors };
