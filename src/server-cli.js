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

/* eslint max-len: 0 */
/* eslint no-console: 0 */
require('core-js/stable');
require('regenerator-runtime/runtime');

const path = require('path');
const isElectron = require('is-electron');
const program = require('commander');
const pkg = require('./package.json');

// Defaults to 'production'
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const increaseVerbosityLevel = (val, total) => {
    return total + 1;
};

const parseMountPoint = (val, acc) => {
    val = val || '';

    const mount = {
        route: '/',
        target: val
    };

    if (val.indexOf(':') >= 0) {
        const r = val.match(/(?:([^:]*)(?::(.*)))/);
        mount.route = r[1];
        mount.target = r[2];
    }

    // mount.route is interpreted by gSender code that uses posix syntax
    // where the separator is / , so we perform this join in posix mode
    // mode to avoid introducing \ separators when running on Windows.
    mount.route = path.posix.join('/', mount.route || '').trim(); // path.join('/', 'pendant') => '/pendant'
    mount.target = (mount.target || '').trim();

    acc.push(mount);

    return acc;
};

const parseController = (val) => {
    val = val ? (val + '').toLowerCase() : '';

    if (['grbl', 'grblHAL'].includes(val)) {
        return val;
    } else {
        return '';
    }
};

const defaultHost = isElectron() ? '127.0.0.1' : '0.0.0.0';
const defaultPort = isElectron() ? 0 : 8000;

program
    .version(pkg.version, '--version', 'Output the current program version')
    .usage('[options]')
    .option('-p, --port <port>', `Set listen port (default: ${defaultPort})`, defaultPort)
    .option('-H, --host <host>', `Set listen address or hostname (default: ${defaultHost})`, defaultHost)
    .option('-b, --backlog <backlog>', 'Set listen backlog (default: 511)', 511)
    .option('-c, --config <filename>', 'Set config file (default: ~/.cncrc)')
    .option('-v, --verbose', 'Increase the verbosity level (-v, -vv, -vvv)', increaseVerbosityLevel, 0)
    .option('-m, --mount <route-path>:<target>', 'Add a mount point for serving static files', parseMountPoint, [])
    .option('-w, --watch-directory <path>', 'Watch a directory for changes')
    .option('--access-token-lifetime <lifetime>', 'Access token lifetime in seconds or a time span string (default: 30d)')
    .option('--allow-remote-access', 'Allow remote access to the server (default: false)', false)
    .option('--remote', 'Enable Headless mode, exposing the internal server on your local network', false)
    .option('--controller <type>', 'Specify CNC controller: Grbl, grblHAL (default: \'\')', parseController, '')
    .option('--kiosk', 'Enable Kiosk mode, only allowing this application to be run', false);

// Commander assumes that the first two values in argv are 'node' and appname, and then followed by the args.
// This is not the case when running from a packaged Electron app. Here you have the first value appname and then args.
const normalizedArgv = ('' + process.argv[0]).indexOf(pkg.name) >= 0
    ? ['node', pkg.name, ...process.argv.slice(1)]
    : process.argv;
if (normalizedArgv.length > 1) {
    program.parse(normalizedArgv);
}

const options = program.opts();

module.exports = () => new Promise((resolve, reject) => {
    let kiosk = !!options.kiosk;

    require('./server').createServer({
        port: options.port,
        host: options.host,
        backlog: options.backlog,
        configFile: options.config,
        verbosity: options.verbose,
        mountPoints: options.mount,
        watchDirectory: options.watchDirectory,
        accessTokenLifetime: options.accessTokenLifetime,
        allowRemoteAccess: !!options.allowRemoteAccess,
        controller: options.controller,
        kiosk
    }, (err, data = {}) => {
        if (err) {
            reject(err, {});
            return;
        }

        resolve({ ...data, headless: false, kiosk });
    });
});
