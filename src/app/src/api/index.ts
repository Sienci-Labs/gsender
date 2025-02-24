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

import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { MachineProfile } from '../lib/definitions/machine_profile';
import {
    FetchOptions,
    GCodeOptions,
    SigninOptions,
    StateOptions,
    USER_DATA_COLLECTION_T,
    WatchOptions,
} from './definitions';

// import store from "../store";

// Create an instance of axios
const authrequest = axios.create({
    baseURL: '/',
    headers: {
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Request interceptor to add bearer token and prevent caching
authrequest.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // const token = store.get("session.token");

        const token = '';

        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        if (config.method === 'get' || config.method === 'head') {
            config.params = { ...config.params, _: Date.now() };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

//
// Authentication
//
const signin = (options: SigninOptions): Promise<AxiosResponse> => {
    const { token, name, password } = { ...options };
    return authrequest.post('/api/signin', { token, name, password });
};

//
// Latest Version for windows
//
const getLatestVersion = (): Promise<AxiosResponse> => {
    return authrequest.get('/api/version/latest');
};

//
// Check if electron auto-update is supported for the
// installation package-type/file-extension
//
const getShouldInstallUpdates = (): Promise<AxiosResponse> => {
    return authrequest.get('/api/version/appUpdateSupport');
};

//
// State
//
const getState = (options?: StateOptions): Promise<AxiosResponse> => {
    const { key } = { ...options };
    return authrequest.get('/api/state', { params: { key } });
};

const setState = (options: Record<string, any>): Promise<AxiosResponse> => {
    const data = { ...options };
    return authrequest.post('/api/state', data);
};

const unsetState = (options: StateOptions): Promise<AxiosResponse> => {
    const { key } = { ...options };
    return authrequest.delete('/api/state', { params: { key } });
};

//
// G-code
//
const loadGCode = (options: GCodeOptions): Promise<AxiosResponse> => {
    const { port = '', name = '', gcode = '', context = {} } = { ...options };
    return authrequest.post('/api/gcode', { port, name, gcode, context });
};

const fetchGCode = (options?: GCodeOptions): Promise<AxiosResponse> => {
    const { port = '' } = { ...options };
    return authrequest.get('/api/gcode', { params: { port } });
};

const downloadGCode = (options: GCodeOptions): void => {
    const { port = '' } = { ...options };

    const $form = document.createElement('form');
    $form.setAttribute('id', 'export');
    $form.setAttribute('method', 'POST');
    $form.setAttribute('enctype', 'multipart/form-data');
    $form.setAttribute('action', 'api/gcode/download');

    const $port = document.createElement('input');
    $port.setAttribute('name', 'port');
    $port.setAttribute('value', port);

    // const $token = document.createElement("input");
    // $token.setAttribute("name", "token");
    // $token.setAttribute("value", store.get("session.token"));

    $form.appendChild($port);
    // $form.appendChild($token);

    document.body.append($form);
    $form.submit();
    document.body.removeChild($form);
};

//
// Controllers
//
const controllers = {
    get: (): Promise<AxiosResponse> => {
        return authrequest.get('/api/controllers');
    },
};

//
// Watch Directory
//
const watch = {
    getFiles: (options: WatchOptions): Promise<AxiosResponse> => {
        const { path } = { ...options };
        return authrequest.post('/api/watch/files', { path });
    },

    readFile: (options: WatchOptions): Promise<AxiosResponse> => {
        const { file } = { ...options };
        return authrequest.post('/api/watch/file', { file });
    },
};

//
// Users
//
const users = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/users', { params: options });
    },

    create: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/users', options);
    },

    read: (id: string): Promise<AxiosResponse> => {
        return authrequest.get('/api/users/' + id);
    },

    delete: (id: string): Promise<AxiosResponse> => {
        return authrequest.delete('/api/users/' + id);
    },

    update: (
        id: string,
        options: Record<string, any>,
    ): Promise<AxiosResponse> => {
        return authrequest.put('/api/users/' + id, options);
    },
};

//
// ToolChange
//
const events = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/events', { params: options });
    },

    create: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/events', options);
    },

    read: (id: string): Promise<AxiosResponse> => {
        return authrequest.get('/api/events/' + id);
    },

    delete: (id: string): Promise<AxiosResponse> => {
        return authrequest.delete('/api/events/' + id);
    },

    clearAll: (): Promise<AxiosResponse> => {
        return authrequest.delete('/api/events');
    },

    update: (
        id: string,
        options: Record<string, any>,
    ): Promise<AxiosResponse> => {
        return authrequest.put('/api/events/' + id, options);
    },
};

//
// Headless Mode / Remote Mode
//
const remoteSetting = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/remote', { params: options });
    },

    update: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.put('/api/remote', options);
    },
};

//
// Job Stats
//
const jobStats = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/jobstats', { params: options });
    },

    update: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.put('/api/jobstats', options);
    },
};

//
// Maintenance
//
const maintenance = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/maintenance', { params: options });
    },

    update: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.put('/api/maintenance', options);
    },
};

//
// Macros
//
const macros = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/macros', { params: options });
    },

    create: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/macros', options);
    },

    read: (id: string): Promise<AxiosResponse> => {
        return authrequest.get('/api/macros/' + id);
    },

    update: (
        id: string,
        options: Record<string, any>,
    ): Promise<AxiosResponse> => {
        return authrequest.put('/api/macros/' + id, options);
    },

    delete: (id: string): Promise<AxiosResponse> => {
        return authrequest.delete('/api/macros/' + id);
    },
};

//
// MDI
//
const mdi = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/mdi', { params: options });
    },

    create: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/mdi', options);
    },

    read: (id: string): Promise<AxiosResponse> => {
        return authrequest.get('/api/mdi/' + id);
    },

    update: (
        id: string,
        options: Record<string, any>,
    ): Promise<AxiosResponse> => {
        return authrequest.put('/api/mdi/' + id, options);
    },

    delete: (id: string): Promise<AxiosResponse> => {
        return authrequest.delete('/api/mdi/' + id);
    },
};

//
// Commands
//
const commands = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/commands', { params: options });
    },

    create: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/commands', options);
    },

    read: (id: string): Promise<AxiosResponse> => {
        return authrequest.get('/api/commands/' + id);
    },

    update: (
        id: string,
        options: Record<string, any>,
    ): Promise<AxiosResponse> => {
        return authrequest.put('/api/commands/' + id, options);
    },

    delete: (id: string): Promise<AxiosResponse> => {
        return authrequest.delete('/api/commands/' + id);
    },
};

//
// Machines
//
const machines = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/machines', { params: options });
    },

    create: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/machines', options);
    },

    read: (id: string): Promise<AxiosResponse> => {
        return authrequest.get('/api/machines/' + id);
    },

    update: (
        id: string,
        options: Record<string, any>,
    ): Promise<AxiosResponse> => {
        return authrequest.put('/api/machines/' + id, options);
    },

    delete: (id: string): Promise<AxiosResponse> => {
        return authrequest.delete('/api/machines/' + id);
    },
};

//
// Files
//
const file = {
    upload: (formData: FormData): Promise<AxiosResponse> => {
        return authrequest.post('/api/file', formData);
    },
};

//
// Metrics
//
const metrics = {
    sendData: (machineProfile: MachineProfile): Promise<AxiosResponse> => {
        return authrequest.post('/api/metrics/sendData', machineProfile);
    },
    getCollectDataStatus: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/metrics/collectUserData', {
            params: options,
        });
    },
    toggleCollectDataStatus: (
        options: USER_DATA_COLLECTION_T,
    ): Promise<AxiosResponse> => {
        return authrequest.post('/api/metrics/collectUserData', options);
    },
    sendUsageData: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.post('/api/metrics/sendUsageData', options);
    },
};

//
// AlarmList
//
const alarmList = {
    fetch: (options?: FetchOptions): Promise<AxiosResponse> => {
        return authrequest.get('/api/alarmList', { params: options });
    },
    update: (options: Record<string, any>): Promise<AxiosResponse> => {
        return authrequest.put('/api/alarmList/', options);
    },
    clearAll: (): Promise<AxiosResponse> => {
        return authrequest.delete('/api/alarmList');
    },
};

//
// Release Notes
//
const releaseNotes = {
    fetch: (): Promise<AxiosResponse> => {
        return authrequest.get('/api/releasenotes');
    },
};

export default {
    signin,
    getLatestVersion,
    getShouldInstallUpdates,
    getState,
    setState,
    unsetState,
    loadGCode,
    fetchGCode,
    downloadGCode,
    controllers,
    watch,
    users,
    events,
    remoteSetting,
    jobStats,
    maintenance,
    macros,
    mdi,
    commands,
    machines,
    file,
    metrics,
    alarmList,
    releaseNotes,
};
