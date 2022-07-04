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

const { contextBridge, ipcRenderer } = require('electron');

const WINDOW_API = {
    persistConfig: (fileName, value) => ipcRenderer.send('persist-app-config', fileName, value),
    getConfig: (fileName) => ipcRenderer.invoke('get-app-config'),
    getAppPath: (state) => ipcRenderer.invoke('get-app-path'),
    restartApp: () => ipcRenderer.send('restart_app'),
    loadRecentFile: (path) => ipcRenderer.send('load-recent-file', path),
    openUploadDialog: () => ipcRenderer.send('open-upload-dialog'),
    logError: (err) => ipcRenderer.send('log-error', err),
    registerListener: (channel, fn) => {
        ipcRenderer.on(channel, (event, ...args) => fn(...args));
    }
};

//contextBridge.exposeInMainWorld('api', WINDOW_API);
window.ipcRenderer = require('electron').ipcRenderer;
