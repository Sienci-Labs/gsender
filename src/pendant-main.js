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

import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import log from 'electron-log';
import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';
import launchServer from './server-cli';
import pkg from './package.json';

// Point the bundled server at the pendant UI directory inside this binary.
// settings.production.js reads GSENDER_PENDANT_PATH (with __dirname fallback);
// since the server bundle lives in dist/gsender-pendant/server/, the default
// would resolve to dist/gsender-pendant/server/pendant — wrong. Override.
if (!process.env.GSENDER_PENDANT_PATH) {
    process.env.GSENDER_PENDANT_PATH = path.join(__dirname, 'pendant');
}

let mainWindow = null;
let hostInformation = {};

const externalRendererUrl = process.env.NODE_ENV === 'development'
    ? process.env.ELECTRON_RENDERER_URL
    : '';

const main = () => {
    const gotSingleInstanceLock = app.requestSingleInstanceLock();
    if (!gotSingleInstanceLock) {
        app.quit();
        return;
    }

    require('@electron/remote/main').initialize();

    app.on('second-instance', () => {
        if (!mainWindow) return;
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    });

    if (process.platform === 'linux') {
        app.commandLine.appendSwitch('--no-sandbox');
    }

    mkdirp.sync(app.getPath('userData'));

    app.whenReady().then(async () => {
        try {
            await session.defaultSession.clearCache();

            let url = '';

            if (externalRendererUrl) {
                url = externalRendererUrl;
                try {
                    const parsedUrl = new URL(url);
                    hostInformation = {
                        address: parsedUrl.hostname,
                        port: Number(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 80),
                    };
                } catch (_err) {
                    hostInformation = {};
                }
                log.info(`Pendant using external renderer URL in development: ${url}`);
            } else if (process.env.NODE_ENV === 'development') {
                const errorMessage = 'ELECTRON_RENDERER_URL is required in pendant development mode';
                log.error(errorMessage);
                await dialog.showMessageBox({
                    type: 'error',
                    title: 'Pendant Development Startup Error',
                    message: errorMessage,
                });
                app.exit(1);
                return;
            } else {
                let res;
                try {
                    res = await launchServer();
                } catch (error) {
                    log.error('Pendant server startup error:', error);
                    dialog.showMessageBoxSync(null, {
                        title: 'Pendant Startup Error',
                        message: 'gSender Pendant could not start its embedded server.',
                        detail: String(error.message),
                    });
                    app.exit(-1);
                    return;
                }

                const { address, port } = { ...res };
                hostInformation = { address, port };

                if (!(address && port)) {
                    log.error(`Pendant server failed to bind: http://${address}:${port}`);
                    app.exit(-1);
                    return;
                }

                url = `http://${address}:${port}/pendant`;
                log.info(`Pendant loading ${url}`);
            }

            const isDev = !!externalRendererUrl;
            mainWindow = new BrowserWindow({
                title: `gSender Pendant ${pkg.version}`,
                kiosk: !isDev,
                fullscreen: !isDev,
                autoHideMenuBar: true,
                show: false,
                width: 1280,
                height: 800,
                minWidth: 1024,
                minHeight: 600,
                webPreferences: {
                    // Shared code from apps/desktop/ uses window.require + window.ipcRenderer
                    // at module load; matching desktop's preload posture avoids forking that.
                    nodeIntegration: true,
                    enableRemoteModule: true,
                    contextIsolation: false,
                    preload: path.join(__dirname, 'preload-pendant.js'),
                },
            });
            require('@electron/remote/main').enable(mainWindow.webContents);

            mainWindow.once('ready-to-show', () => {
                mainWindow.show();
                if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
            });

            mainWindow.on('closed', () => {
                mainWindow = null;
            });

            await mainWindow.loadURL(url);
        } catch (err) {
            log.error('Pendant main process error:', err);
            await dialog.showMessageBox({
                type: 'error',
                title: 'Pendant Error',
                message: String(err?.message ?? err),
            });
        }
    });

    app.on('window-all-closed', () => {
        app.quit();
    });

    // IPC: host info — replaces Tauri get_host. Renderer awaits this on bootstrap.
    ipcMain.handle('pendant:get-host', () => {
        if (!hostInformation.address || !hostInformation.port) return undefined;
        return `${hostInformation.address}:${hostInformation.port}`;
    });

    // IPC: native gcode picker — replaces Tauri pick_gcode_file.
    ipcMain.handle('pendant:pick-gcode-file', async () => {
        const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
            properties: ['openFile'],
            filters: [
                { name: 'G-Code Files', extensions: ['gcode', 'gc', 'nc', 'tap', 'cnc', 'g'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        if (result.canceled || !result.filePaths.length) return undefined;

        const filePath = result.filePaths[0];
        const content = await fs.promises.readFile(filePath, 'utf8');
        const { size } = await fs.promises.stat(filePath);
        return {
            path: filePath,
            name: path.basename(filePath),
            size,
            content,
        };
    });

    // IPC: read file by path — replaces Tauri read_gcode_file. Used by recent-files reload.
    ipcMain.handle('pendant:read-gcode-file', async (_event, filePath) => {
        if (typeof filePath !== 'string' || !filePath) return undefined;
        const content = await fs.promises.readFile(filePath, 'utf8');
        const { size } = await fs.promises.stat(filePath);
        return {
            path: filePath,
            name: path.basename(filePath),
            size,
            content,
        };
    });
};

main();
