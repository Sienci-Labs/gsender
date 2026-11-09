/*
 * Copyright (C) 2026 Sienci Labs Inc.
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

// Entry point of the server bundle that runs inside the Android app
// (scripts/android/build-payload.js). Starts the stock server the same way
// bin/gsender does, then prints one machine-readable line the app waits for:
//
//   GSENDER_SERVER_READY port=<port> ms=<since process start> rss=<MB>
//
// The app (android/app/.../NodeService.kt) passes `-p 8000 -H 127.0.0.1`: a
// fixed port, so the WebView's origin (and the localStorage settings keyed on
// it) stays stable across restarts, and bound to loopback only, so the server
// is never reachable off the device regardless of port.
const { performance } = require('perf_hooks');
const launchServer = require('server-cli-entry');

launchServer()
    .then((data = {}) => {
        // With NODE_COMPILE_CACHE set, V8's code cache is only written at a
        // clean exit, which a long-running server (or a killed app) never
        // reaches. Flush once we're up so the next launch starts faster.
        const mod = require('module');
        if (mod.getCompileCacheDir && mod.getCompileCacheDir()) {
            mod.flushCompileCache();
        }
        const rss = Math.round(process.memoryUsage().rss / 1048576);
        console.log(
            `GSENDER_SERVER_READY port=${data.port} ms=${Math.round(performance.now())} rss=${rss} node=${process.version}`,
        );
    })
    .catch((err) => {
        console.error('GSENDER_SERVER_FAILED', err && (err.stack || err));
        process.exit(1);
    });
