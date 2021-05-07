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

/* eslint import/no-unresolved: 0 */
import { app, autoUpdater, BrowserWindow } from 'electron';
import os from 'os';
import log from './log';

const notify = (title, message) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
        return;
    }

    windows[0].webContents.send('notify', title, message);
};

class AutoUpdater {
    constructor(window) {
        if (process.platform !== 'darwin') {
            return;
        }

        autoUpdater.addListener('update-available', (event) => {
            log.debug('A new update is available');
        });
        // On Windows only `releaseName` is available.
        autoUpdater.addListener('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
            const title = 'A new update is ready to install';
            const message = `Version ${releaseName} is downloaded and will be automatically installed on quit`;
            notify(title, message);
        });
        autoUpdater.addListener('error', (err) => {
            log.error(err);
        });
        autoUpdater.addListener('checking-for-update', () => {
            log.debug('checking-for-update');
        });
        autoUpdater.addListener('update-not-available', () => {
            log.debug('update-not-available');
        });

        const updateServerHost = ''; // FIXME
        const platform = os.platform();
        const arch = os.arch();
        const version = app.getVersion();
        const feedURL = `https://${updateServerHost}/update/${platform}-${arch}/${version}`;
        autoUpdater.setFeedURL(feedURL);

        window.webContents.once('did-frame-finish-load', (event) => {
            autoUpdater.checkForUpdates();
        });
    }
}

export default AutoUpdater;
