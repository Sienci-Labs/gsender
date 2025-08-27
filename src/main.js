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

import {
    app,
    ipcMain,
    dialog,
    powerSaveBlocker,
    powerMonitor,
    screen,
    session,
    clipboard,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import chalk from 'chalk';
import mkdirp from 'mkdirp';
import isOnline from 'is-online';
import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import * as Sentry from '@sentry/electron/main';
import WindowManager from './electron-app/WindowManager';
import launchServer from './server-cli';
import pkg from './package.json';
import { parseAndReturnGCode } from './electron-app/RecentFiles';
import { asyncCallWithTimeout } from './electron-app/AsyncTimeout';
import { getGRBLLog } from './electron-app/grblLogs';

let windowManager = null;
let hostInformation = {};
let grblLog = log.create('grbl');
let logPath;

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: 'https://eeb4899f0415aa6bc9de477a7faeb720@o558751.ingest.us.sentry.io/4509479105986560',
        release: pkg.version,
    });
}

const main = () => {
    // https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
    const gotSingleInstanceLock = app.requestSingleInstanceLock();
    const shouldQuitImmediately = !gotSingleInstanceLock;

    // Initialize remote main
    require('@electron/remote/main').initialize();

    let prevDirectory = '';

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
                window.focus();
            }
        }
    });

    const store = new Store();

    // Increase V8 heap size of the main process
    if (process.arch === 'x64') {
        const memoryLimit = 1024 * 8; // 8GB
        app.commandLine.appendSwitch(
            '--js-flags',
            `--max-old-space-size=${memoryLimit}`,
        );
    }

    if (process.platform === 'linux') {
        app.commandLine.appendSwitch('--no-sandbox');
    }

    // Create the user data directory if it does not exist
    const userData = app.getPath('userData');
    mkdirp.sync(userData);
    // Extra logging
    logPath = path.join(app.getPath('userData'), 'logs/grbl.log');
    grblLog.transports.file.resolvePath = () => logPath;

    app.whenReady().then(async () => {
        try {
            await session.defaultSession.clearCache();

            windowManager = new WindowManager();
            // Create and show splash before server starts
            const splashScreen = windowManager.createSplashScreen({
                width: 500,
                height: 400,
                show: false,
                frame: false,
            });
            splashScreen.loadFile(
                path.join(__dirname, 'app/assets/Splashscreen.gif'),
            );
            splashScreen.webContents.on('did-finish-load', () => {
                splashScreen.show();
            });

            splashScreen.on('show', () => {
                splashScreen.focus();
            });

            let res;
            try {
                res = await launchServer();
            } catch (error) {
                if (error.message.includes('EADDR')) {
                    dialog.showMessageBoxSync(null, {
                        title: 'Error Connecting to Remote Address',
                        message:
              'There was an problem connecting to the remote address in gSender.',
                        detail:
              'Remote mode has been disabled. Please verify the configured IP address before restarting the application.',
                    });
                    app.relaunch();
                    app.exit(-1);
                } else {
                    log.error(error);
                }
            }

            const { address, port, kiosk } = { ...res };
            log.info(`Returned - http://${address}:${port}`);
            hostInformation = {
                address,
                port,
            };
            if (!(address && port)) {
                log.error(
                    'Unable to start the server at ' +
            chalk.cyan(`http://${address}:${port}`),
                );
                return;
            }

            const url = `http://${address}:${port}`;
            // The bounds is a rectangle object with the following properties:
            // * `x` Number - The x coordinate of the origin of the rectangle.
            // * `y` Number - The y coordinate of the origin of the rectangle.
            // * `width` Number - The width of the rectangle.
            // * `height` Number - The height of the rectangle.
            // resolution used to be 1024x768
            const bounds = {
                minWidth: 1040,
                minHeight: 796,
                ...store.get('bounds'),
            };
            const options = {
                ...bounds,
                title: `gSender ${pkg.version}`,
                kiosk,
            };
            const window = await windowManager.openWindow(url, options, splashScreen);

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

            // Include release notes
            autoUpdater.fullChangelog = true;

            autoUpdater.on('update-available', (info) => {
                log.info(JSON.stringify(info));
                setTimeout(() => {
                    window.webContents.send('update_available', info);
                }, 8000);
            });

            autoUpdater.on('error', (err) => {
                window.webContents.send('updated_error', err);
            });

            autoUpdater.on('download-progress', (info) => {
                window.webContents.send('update_download_progress', info.percent);
            });

            ipcMain.once('restart_app', async () => {
                await autoUpdater.downloadUpdate();
                autoUpdater.quitAndInstall(false, false);
            });

            ipcMain.on('load-recent-file', async (msg, recentFile) => {
                try {
                    const fileMetadata = await parseAndReturnGCode(recentFile);
                    window.webContents.send('loaded-recent-file', fileMetadata);
                } catch (err) {
                    log.error(err);
                    window.webContents.send('remove-recent-file', {
                        err: err.message,
                        path: recentFile.filePath,
                    });
                }
            });

            ipcMain.on('logError:electron', (channel, error) => {
                if ('type' in error) {
                    log.transports.file.level = 'error';
                }

                if (error.type.includes('GRBL_HAL')) {
                    error.type === 'GRBL_HAL_ERROR'
                        ? grblLog.error(
                            `GRBL_HAL_ERROR:Error ${error.code} - ${error.description} Line ${error.lineNumber}: "${error.line.trim()}" Origin- ${error.origin.trim()}`,
                        )
                        : grblLog.error(
                            `GRBL_HAL_ALARM:Alarm ${error.code} - ${error.description}`,
                        );
                } else {
                    error.type === 'GRBL_ERROR'
                        ? grblLog.error(
                            `GRBL_ERROR:Error ${error.code} - ${error.description} Line ${error.lineNumber}: "${error.line.trim()}" Origin- ${error.origin.trim()}`,
                        )
                        : grblLog.error(
                            `GRBL_ALARM:Alarm ${error.code} - ${error.description}`,
                        );
                }
            });

            ipcMain.handle('copy-to-clipboard', (_channel, text) => {
                if (!text) {
                    return { success: false, error: 'No text to copy' };
                }

                clipboard.writeText(text);

                return { success: true };
            });

            ipcMain.handle('grblLog:fetch', async (channel) => {
                const data = await getGRBLLog(logPath);
                return data;
            });

            ipcMain.handle('check-remote-status', (channel) => {
                log.debug(hostInformation);
                return hostInformation;
            });

            /**
       * gSender config events - move electron store changes out of renderer process
       */
            ipcMain.on('open-upload-dialog', async () => {
                try {
                    let additionalOptions = {};
                    let gSenderWindow = windowManager.getWindow();

                    if (prevDirectory) {
                        additionalOptions.defaultPath = prevDirectory;
                    }
                    const file = await dialog.showOpenDialog(gSenderWindow, {
                        properties: ['openFile'],
                        filters: [
                            {
                                name: 'G-Code Files',
                                extensions: ['gcode', 'gc', 'nc', 'tap', 'cnc'],
                            },
                            { name: 'All Files', extensions: ['*'] },
                        ],
                    });

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
                        window.webContents.send('returned-upload-dialog-data', {
                            data,
                            size,
                            name: fileName,
                            path: FULL_FILE_PATH,
                        });
                    });
                } catch (e) {
                    log.error(`Caught error in listener - ${e}`);
                }
            });

            ipcMain.on('open-new-window', (msg, route) => {
                const factor = screen.getPrimaryDisplay().scaleFactor;
                const childOptions = {
                    width: 550 / factor,
                    height: 460 / factor,
                    minWidth: 550 / factor,
                    minHeight: 460 / factor,
                    useContentSize: true,
                    title: 'gSender',
                    parent: window,
                };
                // Hash router URL should look like '{url}/#/widget/:id'
                const address = `${url}/#${route}`;
                const shouldMaximize = false;
                const isChild = true;

                windowManager.openWindow(
                    address,
                    childOptions,
                    null,
                    shouldMaximize,
                    isChild,
                );
            });

            ipcMain.on('reconnect-main', (event, options) => {
                let shouldReconnect = false;
                try {
                    if (event && event.sender && event.sender.browserWindowOptions) {
                        shouldReconnect =
              !event.sender.browserWindowOptions.parent &&
              windowManager.childWindows.length > 0;
                    }
                } catch (err) {
                    log.error(err);
                }
                if (shouldReconnect) {
                    windowManager.childWindows.forEach((window) => {
                        window.webContents.send('reconnect', options);
                    });
                }
            });

            ipcMain.on('get-data', (event, widget) => {
                window.webContents.send('get-data-' + widget);
            });

            ipcMain.on('receive-data', (event, msg) => {
                const { widget, data } = msg;
                windowManager.childWindows.forEach((window) => {
                    window.webContents.send('recieve-data-' + widget, data);
                });
            });

            //Handle app restart with remote settings
            ipcMain.on('remoteMode-restart', (event, headlessSettings) => {
                app.relaunch(); // flags are handled in server/index.js
                app.exit(0);
            });
        } catch (err) {
            log.error(err);
            log.err(err.name);
            await dialog.showMessageBox({
                message: err,
            });
        }
        //Check for available updates at end to avoid try-catch failing to load events
        const internetConnectivity = await isOnline();
        if (internetConnectivity) {
            if (pkg.version.includes('EDGE') || pkg.version.includes('BETA')) {
                autoUpdater.allowPrerelease = true;
            }
            autoUpdater.autoDownload = false; // We don't want to force update but will prompt until it is updated
            // There may be situations where something is blocking the update check outside of internet connectivity
            // This sets a 4 second timeout on the await.
            try {
                asyncCallWithTimeout(autoUpdater.checkForUpdates(), 10000);
            } catch (e) {
                log.info(
                    'Unable to check for app updates, likely no internet connection.',
                );
            }
        }
    });
};

main();
