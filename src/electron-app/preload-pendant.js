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

// Pendant preload mirrors desktop's pattern (nodeIntegration on, contextIsolation off)
// because the pendant SPA reuses shared code from apps/desktop/ that calls
// window.require / window.ipcRenderer at module load time.
const fs = require('fs');
const { ipcRenderer } = require('electron');

window.ipcRenderer = ipcRenderer;
window.readFileSync = fs.readFileSync;
window.writeFileSync = fs.writeFileSync;
window.pathJoin = require('path').join;

// Pendant-only bridge for IPC handlers defined in src/pendant-main.js.
window.pendantAPI = {
    isElectron: true,
    getHost: () => ipcRenderer.invoke('pendant:get-host'),
    pickGcodeFile: () => ipcRenderer.invoke('pendant:pick-gcode-file'),
    readGcodeFile: (filePath) => ipcRenderer.invoke('pendant:read-gcode-file', filePath),
};
