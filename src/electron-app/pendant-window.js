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

import { app, BrowserWindow, ipcMain } from 'electron';
import pkg from '../package.json';

// Shared by the standalone pendant binary (pendant-main.js) and the main
// desktop app (main.js, when "use pendant view as default UI" is enabled).
export function createPendantWindow(isDev, preloadPath) {
    const window = new BrowserWindow({
        title: `gSender Pendant ${pkg.version}`,
        kiosk: !isDev,
        fullscreen: !isDev,
        frame: !isDev,
        autoHideMenuBar: true,
        show: false,
        width: isDev ? 768 : 800,
        height: isDev ? 1024 : 1280,
        webPreferences: {
            // Shared code from src/app/ uses window.require + window.ipcRenderer
            // at module load; matching desktop's preload posture avoids forking that.
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            preload: preloadPath,
        },
    });
    require('@electron/remote/main').enable(window.webContents);

    ipcMain.on('pendant:quit-app', () => app.quit());

    window.once('ready-to-show', () => {
        window.show();
        if (isDev) window.webContents.openDevTools({ mode: 'detach' });
    });

    return window;
}
