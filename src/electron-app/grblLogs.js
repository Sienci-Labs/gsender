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

const fs = require('fs').promises;

const getGRBLLog = async (logPath) => {
    let content = '';
    try {
        content = await fs.readFile(logPath, 'utf-8');
        console.log(content);
        if (content) {
            content = content
                .toString()
                .split(/\r?\n/);
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
    } catch (error) {
        console.log(error);
    }

    return content;
};

export { getGRBLLog };
