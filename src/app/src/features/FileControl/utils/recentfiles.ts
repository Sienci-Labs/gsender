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

import pubsub from 'pubsub-js';

import store from 'app/store';
import { TOASTER_DANGER, Toaster } from 'app/lib/toaster/ToasterLib';

export const RECENT_FILE_LIMIT = 5;

export const recentFileExists = (filePath: string, recentFiles: any[]) => {
    const file = recentFiles.find((file) => file.filePath === filePath);
    return !!file;
};

export const createRecentFile = ({
    name,
    dir,
}: {
    name: string;
    dir: string;
}) => {
    return {
        fileName: name,
        filePath: `${dir}\\${name}`,
        timeUploaded: Date.now(),
    };
};

export const createRecentFileFromRawPath = (
    filePath: string,
    fileName: string,
) => {
    return {
        fileName,
        filePath,
        timeUploaded: Date.now(),
    };
};

export const updateRecentFileDate = (filepath: string, recentFiles: any[]) => {
    recentFiles.forEach((recentFile) => {
        if (recentFile.filePath === filepath) {
            recentFile.timeUploaded = Date.now();
        }
    });
    return recentFiles;
};

export const addRecentFile = (fileMetaData: any) => {
    if (fileMetaData === null) {
        Toaster.pop({
            type: TOASTER_DANGER,
            msg: 'Unable to load file - file may have been moved or deleted.',
        });
        return;
    }
    const recentFiles = getRecentFiles();
    let sortedFiles;

    if (recentFileExists(fileMetaData.filePath, recentFiles)) {
        sortedFiles = updateRecentFileDate(fileMetaData.filePath, recentFiles);
        sortedFiles = sortRecentFiles(sortedFiles);
    } else {
        recentFiles.push(fileMetaData);
        sortedFiles = sortRecentFiles(recentFiles);
        sortedFiles = trimRecentFilesToLimit(sortedFiles);
    }
    updateStoredRecentFiles(sortedFiles);
    pubsub.publish('recent-files-updated', sortedFiles);
};

export const getRecentFiles = () => {
    return store.get('workspace.recentFiles', []);
};

export const updateStoredRecentFiles = (recentFiles: any[]) => {
    store.replace('workspace.recentFiles', recentFiles);
};

export const trimRecentFilesToLimit = (
    recentFiles: any[],
    limit = RECENT_FILE_LIMIT,
) => {
    if (recentFiles.length > limit) {
        return recentFiles.slice(0, limit);
    }
    return recentFiles;
};

export const recentFileSortHandler = (a: any, b: any) => {
    return b.timeUploaded - a.timeUploaded;
};

export const sortRecentFiles = (recentFiles: any[] = []) => {
    return recentFiles.sort(recentFileSortHandler);
};

export const loadRecentFile = (filePath: string) => {
    (window as any).ipcRenderer.send('load-recent-file', {
        filePath: filePath,
    });
    return true;
};