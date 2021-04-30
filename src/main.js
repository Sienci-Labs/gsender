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

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import '@babel/polyfill';
import { app, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import chalk from 'chalk';
import mkdirp from 'mkdirp';
import path from 'path';
//import menuTemplate from './electron-app/menu-template';
import WindowManager from './electron-app/WindowManager';
import launchServer from './server-cli';
import pkg from './package.json';
import './sentryInit';
import { parseAndReturnGCode } from './electron-app/RecentFiles';

/* Whether to include menu or no */

// The selection menu
/*const selectionMenu = Menu.buildFromTemplate([
    { role: 'copy' },
    { type: 'separator' },
    { role: 'selectall' }
]);

// The input menu
const inputMenu = Menu.buildFromTemplate([
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { type: 'separator' },
    { role: 'selectall' }
]);*/

let windowManager = null;

const main = () => {
    // https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
    const gotSingleInstanceLock = app.requestSingleInstanceLock();
    const shouldQuitImmediately = !gotSingleInstanceLock;

    if (shouldQuitImmediately) {
        app.quit();
        return;
    }

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (!windowManager) {
            return;
        }

        const window = windowManager.getWindow();
        if (window) {
            if (window.isMinimized()) {
                window.restore();
            }
            window.focus();
        }
    });

    const store = new Store();

    // Create the user data directory if it does not exist
    const userData = app.getPath('userData');
    mkdirp.sync(userData);

    app.whenReady().then(async () => {
        try {
            windowManager = new WindowManager();

            // Create and show splash before server starts
            const splashScreen = windowManager.createSplashScreen({
                width: 500,
                height: 400,
                show: false,
                frame: false
            });
            await splashScreen.loadFile(path.join(__dirname, 'app/assets/splashscreen.png'));
            splashScreen.once('ready-to-show', () => {
                splashScreen.show();
            });

            const res = await launchServer();
            const { address, port, mountPoints } = { ...res };
            if (!(address && port)) {
                console.error('Unable to start the server at ' + chalk.cyan(`http://${address}:${port}`));
                return;
            }

            /*if (BUILD_DEV) {
                const menu = Menu.buildFromTemplate(menuTemplate({ address, port, mountPoints }));
                Menu.setApplicationMenu(menu);
            }*/

            const url = `http://${address}:${port}`;
            // The bounds is a rectangle object with the following properties:
            // * `x` Number - The x coordinate of the origin of the rectangle.
            // * `y` Number - The y coordinate of the origin of the rectangle.
            // * `width` Number - The width of the rectangle.
            // * `height` Number - The height of the rectangle.
            const bounds = {
                width: 1280, // Defaults to 1280
                height: 768, // Defaults to 768
                minWidth: 1280,
                minHeight: 768,
                ...store.get('bounds')
            };
            const options = {
                ...bounds,
                title: `gSender ${pkg.version}`,
            };
            const window = windowManager.openWindow(url, options, splashScreen);

            // Save window size and position
            window.on('close', () => {
                store.set('bounds', window.getBounds());
            });

            //Check for available updates
            await autoUpdater.checkForUpdatesAndNotify();

            // What to do in cases where update is available
            autoUpdater.on('checking-for-updates', () => {
                window.webContents.send('message', 'CHECKING UPDATES');
            });
            autoUpdater.on('update-not-available', (ev, info) => {
                window.webContents.send('message', 'Update not available.');
            });
            autoUpdater.on('update-available', () => {
                window.webContents.send('message', 'Update Available');
            });
            autoUpdater.on('update-downloaded', () => {
                window.webContents.send('update_downloaded');
            });
            autoUpdater.on('error', (ev, e) => {
                window.webContents.send('message', `Error: ${e}`);
            });
            ipcMain.on('restart_app', () => {
                autoUpdater.quitAndInstall();
            });
            ipcMain.on('load-recent-file', async (msg, recentFile) => {
                const fileMetadata = await parseAndReturnGCode(recentFile);
                window.webContents.send('loaded-recent-file', fileMetadata);
            });
        } catch (err) {
            await dialog.showMessageBox({
                message: `Error - ${err.message}!`
            });
        }
    });
};

main();
