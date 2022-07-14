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

import '@babel/polyfill';
import { app, ipcMain, dialog, powerSaveBlocker, powerMonitor } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import chalk from 'chalk';
import mkdirp from 'mkdirp';
import isOnline from 'is-online';
import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import WindowManager from './electron-app/WindowManager';
import launchServer from './server-cli';
import pkg from './package.json';
import { parseAndReturnGCode } from './electron-app/RecentFiles';
import { asyncCallWithTimeout } from './electron-app/AsyncTimeout';


let windowManager = null;
let hostInformation = {};

const main = () => {
    // https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
    const gotSingleInstanceLock = app.requestSingleInstanceLock();
    const shouldQuitImmediately = !gotSingleInstanceLock;

    let prevDirectory = '';
    log.debug(autoUpdater.channel);

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
            splashScreen.loadFile(path.join(__dirname, 'app/assets/Splashscreen.gif'));
            splashScreen.webContents.on('did-finish-load', () => {
                splashScreen.show();
            });

            splashScreen.on('show', () => {
                splashScreen.focus();
            });

            const res = await launchServer();
            const { address, port, mountPoints, headless } = { ...res };
            hostInformation = {
                address,
                port,
                headless,
            };
            if (!(address && port)) {
                log.error('Unable to start the server at ' + chalk.cyan(`http://${address}:${port}`));
                return;
            }
            if (headless) {
                log.debug(`Started remote build at ${address}:${port}`);
            }

            const url = `http://${address}:${port}`;
            // The bounds is a rectangle object with the following properties:
            // * `x` Number - The x coordinate of the origin of the rectangle.
            // * `y` Number - The y coordinate of the origin of the rectangle.
            // * `width` Number - The width of the rectangle.
            // * `height` Number - The height of the rectangle.
            const bounds = {
                minWidth: 1024,
                minHeight: 768,
                ...store.get('bounds')
            };
            const options = {
                ...bounds,
                title: `gSender ${pkg.version}`,
            };
            const window = windowManager.openWindow(url, options, splashScreen);

            // Power saver - display sleep higher precedence over app suspension
            powerSaveBlocker.start('prevent-display-sleep');
            powerMonitor.on('lock-screen', () => {
                powerSaveBlocker.start('prevent-display-sleep');
            });
            powerMonitor.on('suspend', () => {
                powerSaveBlocker.start('prevent-app-suspension');
                log.info('Prevented suspension');
            });

            // Save window size and position
            window.on('close', () => {
                store.set('bounds', window.getBounds());
            });

            autoUpdater.on('update-available', (info) => {
                window.webContents.send('update_available', info);
            });

            autoUpdater.on('error', (err) => {
                window.webContents.send('updated_error', err);
            });

            ipcMain.once('restart_app', async () => {
                await autoUpdater.downloadUpdate();
                autoUpdater.quitAndInstall(false, false);
            });

            ipcMain.on('load-recent-file', async (msg, recentFile) => {
                const fileMetadata = await parseAndReturnGCode(recentFile);
                window.webContents.send('loaded-recent-file', fileMetadata);
            });

            ipcMain.on('log-error', (channel, err) => {
                log.error(err.message);
            });

            ipcMain.handle('check-remote-status', (channel) => {
                return hostInformation;
            });

            /**
             * gSender config events - move electron store changes out of renderer process
             */
            ipcMain.on('open-upload-dialog', async () => {
                try {
                    let additionalOptions = {};

                    if (prevDirectory) {
                        additionalOptions.defaultPath = prevDirectory;
                    }
                    const file = await dialog.showOpenDialog(window,
                        {
                            properties: ['openFile'],
                            filters: [
                                { name: 'GCode Files', extensions: ['gcode', 'gc', 'nc', 'tap', 'cnc'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        },
                    );

                    if (!file) {
                        return;
                    }
                    if (file.canceled) {
                        return;
                    }

                    const FULL_FILE_PATH = file.filePaths[0];
                    const getFileInformation = (file) => {
                        const { base, dir } = path.parse(file);
                        return [dir, base];
                    };

                    const [filePath, fileName] = getFileInformation(FULL_FILE_PATH);

                    prevDirectory = filePath; // set previous directory

                    fs.readFile(FULL_FILE_PATH, 'utf8', (err, data) => {
                        if (err) {
                            log.error(`Error in readFile: ${err}`);
                            return;
                        }

                        const { size } = fs.statSync(FULL_FILE_PATH);
                        window.webContents.send('returned-upload-dialog-data', { data, size, name: fileName, path: FULL_FILE_PATH });
                    });
                } catch (e) {
                    log.error(`Caught error in listener - ${e}`);
                }
            });
        } catch (err) {
            log.error(err);
            await dialog.showMessageBox({
                message: err
            });
        }
        //Check for available updates at end to avoid try-catch failing to load events
        const internetConnectivity = await isOnline();
        if (internetConnectivity) {
            autoUpdater.autoDownload = false; // We don't want to force update but will prompt until it is updated
            // There may be situations where something is blocking the update check outside of internet connectivity
            // This sets a 5 second timeout on the await.
            asyncCallWithTimeout(autoUpdater.checkForUpdates(), 4000);
        }
    });
};

main();
