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
import log from './log';

const path = require('path');
const fs = require('fs').promises;
const fsBase = require('fs');

const getFileInformation = (file) => {
    const fileName = path.parse(file).base;
    const filePath = path.parse(file).dir;
    return [filePath, fileName];
};

const fileExistsAtPath = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        log.error(error);
        return false;
    }
};

export const parseAndReturnGCode = async ({ filePath }) => {
    const [fileDir, fileName] = getFileInformation(filePath);

    try {
        const fileExists = await fileExistsAtPath(filePath);

        if (!fileExists) {
            throw new ReferenceError('Error loading recent file, it may have been deleted, renamed, or moved to a different folder.'); // TODO: Handle null as FILENOTFOUND error
        }

        const stats = fsBase.statSync(filePath);
        const { size } = stats;

        const data = await fs.readFile(filePath, 'utf-8');

        return {
            result: data,
            size: size,
            name: fileName,
            dir: fileDir,
            fullPath: filePath
        };
    } catch (error) {
        log.error(error);
        throw error;
    }
};
