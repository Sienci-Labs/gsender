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

import ensureArray from 'ensure-array';
import superagent from 'superagent';
import superagentUse from 'superagent-use';
// import axios from 'axios';
import store from '../store';

const bearer = (request) => {
    const token = store.get('session.token');
    if (token) {
        request.set('Authorization', 'Bearer ' + token);
    }
};

// Modify request headers and query parameters to prevent caching
const noCache = (request) => {
    const now = Date.now();
    request.set('Cache-Control', 'no-cache');
    request.set('X-Requested-With', 'XMLHttpRequest');

    if (request.method === 'GET' || request.method === 'HEAD') {
        // Force requested pages not to be cached by the browser by appending "_={timestamp}" to the GET parameters, this will work correctly with HEAD and GET requests. The parameter is not needed for other types of requests, except in IE8 when a POST is made to a URL that has already been requested by a GET.
        request._query = ensureArray(request._query);
        request._query.push(`_=${now}`);
    }
};

const authrequest = superagentUse(superagent);
authrequest.use(bearer);
authrequest.use(noCache);

//
// Authentication
//
const signin = (options) => new Promise((resolve, reject) => {
    const { token, name, password } = { ...options };

    authrequest
        .post('/api/signin')
        .send({ token, name, password })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Latest Version for windows
//
const getLatestVersion = () => new Promise((resolve, reject) => {
    authrequest
        .get('/api/version/latest')
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
//Fetch latest app version for all OS from github
//
// const getLatestVersionAllOS = () => new Promise((resolve, reject) => {
//     axios.get('https://api.github.com/repos/Sienci-Labs/gsender/releases').then((res) => {
//         resolve(res.data[0].assets);
//     }).catch((error) => {
//         console.log(error);
//         return [];
//     });
// });

//
// State
//
const getState = (options) => new Promise((resolve, reject) => {
    const { key } = { ...options };

    authrequest
        .get('/api/state')
        .query({ key: key })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

const setState = (options) => new Promise((resolve, reject) => {
    const data = { ...options };

    authrequest
        .post('/api/state')
        .send(data)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

const unsetState = (options) => new Promise((resolve, reject) => {
    const { key } = { ...options };

    authrequest
        .delete('/api/state')
        .query({ key: key })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// G-code
//
const loadGCode = (options) => new Promise((resolve, reject) => {
    const { port = '', name = '', gcode = '', context = {} } = { ...options };

    authrequest
        .post('/api/gcode')
        .send({ port, name, gcode, context })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

const fetchGCode = (options) => new Promise((resolve, reject) => {
    const { port = '' } = { ...options };

    authrequest
        .get('/api/gcode')
        .query({ port: port })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

const downloadGCode = (options) => {
    const { port = '' } = { ...options };

    const $form = document.createElement('form');
    $form.setAttribute('id', 'export');
    $form.setAttribute('method', 'POST');
    $form.setAttribute('enctype', 'multipart/form-data');
    $form.setAttribute('action', 'api/gcode/download');

    const $port = document.createElement('input');
    $port.setAttribute('name', 'port');
    $port.setAttribute('value', port);

    const $token = document.createElement('input');
    $token.setAttribute('name', 'token');
    $token.setAttribute('value', store.get('session.token'));

    $form.appendChild($port);
    $form.appendChild($token);

    document.body.append($form);
    $form.submit();
    document.body.removeChild($form);
};

//
// Controllers
//
const controllers = {};

controllers.get = () => new Promise((resolve, reject) => {
    authrequest
        .get('/api/controllers')
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Watch Directory
//
const watch = {};

watch.getFiles = (options) => new Promise((resolve, reject) => {
    const { path } = { ...options };

    authrequest
        .post('/api/watch/files')
        .send({ path })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

watch.readFile = (options) => new Promise((resolve, reject) => {
    const { file } = { ...options };

    authrequest
        .post('/api/watch/file')
        .send({ file })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Users
//
const users = {};

users.fetch = (options) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/users')
        .query(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

users.create = (options) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/users')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

users.read = (id) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/users/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

users.delete = (id) => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/users/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

users.update = (id, options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/users/' + id)
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// ToolChange
//
const events = {};

events.fetch = (options) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/events')
        .query(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

events.create = (options) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/events')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

events.read = (id) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/events/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

events.delete = (id) => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/events/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

events.clearAll = () => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/events')
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

events.update = (id, options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/events/' + id)
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Macros
//
const macros = {};

macros.fetch = (options) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/macros')
        .query(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

macros.create = (options) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/macros')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

macros.read = (id) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/macros/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

macros.update = (id, options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/macros/' + id)
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

macros.delete = (id) => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/macros/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// MDI
//
const mdi = {};

mdi.fetch = (options) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/mdi')
        .query(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

mdi.create = (options) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/mdi')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

mdi.read = (id) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/mdi/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

mdi.update = (id, options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/mdi/' + id)
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

mdi.bulkUpdate = (options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/mdi/')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

mdi.delete = (id) => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/mdi/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Commands
//
const commands = {};

commands.fetch = (options) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/commands')
        .query(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

commands.create = (options) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/commands')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

commands.read = (id) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/commands/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

commands.update = (id, options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/commands/' + id)
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

commands.delete = (id) => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/commands/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

commands.run = (id) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/commands/run/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Machines
//
const machines = {};

machines.fetch = (options) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/machines')
        .query(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

machines.create = (options) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/machines')
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

machines.read = (id) => new Promise((resolve, reject) => {
    authrequest
        .get('/api/machines/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

machines.update = (id, options) => new Promise((resolve, reject) => {
    authrequest
        .put('/api/machines/' + id)
        .send(options)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

machines.delete = (id) => new Promise((resolve, reject) => {
    authrequest
        .delete('/api/machines/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

machines.run = (id) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/machines/run/' + id)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

const file = {};

file.upload = (file, port, visualizer) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/file')
        .attach('gcode', file)
        .field('port', port)
        .field('visualizer', visualizer)
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

//
// Log
//
const log = {};

log.printLog = (msg, file, lineNumber, level) => new Promise((resolve, reject) => {
    authrequest
        .post('/api/log')
        .send({ msg: msg })
        .send({ file: file })
        .send({ lineNumber: lineNumber })
        .send({ level: level })
        .end((err, res) => {
            if (err) {
                reject(res);
            } else {
                resolve(res);
            }
        });
});

export default {
    getLatestVersion,
    // getLatestVersionAllOS,

    // State
    getState,
    setState,
    unsetState,

    // G-code
    loadGCode,
    fetchGCode,
    downloadGCode,

    // Authentication
    signin,

    // Controllers
    controllers,

    // Watch Directory
    watch,

    // Settings
    commands,
    events,
    machines,
    macros,
    mdi,
    users,

    // Files
    file,

    // Log
    log
};
