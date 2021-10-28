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
import { app, BrowserWindow, shell } from 'electron';
import path from 'path';

class WindowManager {
    windows = [];

    title = '';

    url = '';

    width = 0;

    height = 0;

    constructor() {
        // https://github.com/electron/electron/blob/master/docs/api/app.md#event-activate-os-x
        // Emitted when the application is activated, which usually happens
        // when the user clicks on the application's dock icon.
        app.on('activate', (e) => {
            const window = this.getWindow();
            if (!window) {
                this.openWindow(
                    this.url,
                    {
                        title: this.title,
                        width: this.width || 500,
                        height: this.height || 400,
                        minWidth: 1280,
                        minHeight: 768,
                    },
                );
            }
        });

        // https://github.com/electron/electron/blob/master/docs/api/app.md#event-window-all-closed
        // Emitted when all windows have been closed.
        // This event is only emitted when the application is not going to quit.
        // If the user pressed Cmd + Q, or the developer called app.quit(), Electron
        // will first try to close all the windows and then emit the will-quit event,
        // and in this case the window-all-closed event would not be emitted.
        app.on('window-all-closed', () => {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform === 'darwin') {
                const window = this.getWindow();
                if (window) {
                    // Remember current window attributes that will be used for the next 'activate' event
                    this.title = window.title;
                    this.url = window.webContents.getURL();

                    const [width, height] = window.getSize();
                    this.width = width;
                    this.height = height;
                }
                return;
            }

            app.quit();
        });
    }

    openWindow(url, options, splashScreen) {
        const window = new BrowserWindow({
            ...options,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,
                contextIsolation: false,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        const webContents = window.webContents;
        //window.removeMenu();
        window.webContents.once('did-finish-load', () => {
            window.setTitle(options.title);
        });

        window.on('closed', (event) => {
            const index = this.windows.indexOf(event.sender);
            console.assert(index >= 0);
            this.windows.splice(index, 1);
        });

        // Open every external link in a new window
        // https://github.com/electron/electron/blob/master/docs/api/web-contents.md
        webContents.on('new-window', (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });

        if (splashScreen) {
            webContents.once('dom-ready', () => {
                window.show();
                splashScreen.close();
                splashScreen.destroy();
            });
        } else {
            window.show();
        }

        // Call `ses.setProxy` to ignore proxy settings
        // http://electron.atom.io/docs/latest/api/session/#sessetproxyconfig-callback
        const ses = webContents.session;
        ses.setProxy({ proxyRules: 'direct://' }).then(() => {
            window.loadURL(url);
        });

        this.windows.push(window);

        return window;
    }

    createSplashScreen(options) {
        const splashScreen = new BrowserWindow({
            ...options
        });

        return splashScreen;
    }

    getWindow(index = 0) {
        if (this.windows.length === 0) {
            return null;
        }
        return this.windows[index] || null;
    }
}

export default WindowManager;
