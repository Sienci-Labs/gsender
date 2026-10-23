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

// Loopback-only listener that lets gCAM ("Send to gSender") push a program
// into this gSender instance. It lives in the main process rather than the
// embedded Express server because that server binds a random port under
// Electron, and because main can focus the window and reuse the existing
// file-association flow (recent files, upload, visualizer).
//
// Protocol v1:
//   GET  /gcam/v1/ping -> 200 { app, version, accepting }
//   POST /gcam/v1/load -> body { name, gcode } (application/json)
//        202 accepted | 400 bad body | 403 origin | 409 job running
//        413 too large | 503 disabled by the user

const http = require('http');

export const DEFAULT_GCAM_HANDOFF_PORT = 47820;
export const DEFAULT_GCAM_HANDOFF_MAX_BYTES = 50 * 1024 * 1024;
export const DEFAULT_GCAM_ALLOWED_ORIGINS = [
    'https://kglovern.github.io',
    'https://petervanderwalt.github.io',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5180',
    'http://127.0.0.1:5180',
];

const sendJson = (res, status, body, corsHeaders = {}) => {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        ...corsHeaders,
    });
    res.end(JSON.stringify(body));
};

// Browsers always send Origin on cross-origin requests, so a present Origin
// must be allowlisted. Requests without one come from local non-browser
// clients (a future gCAM desktop main process, curl), which could already
// write files or launch gSender directly, so they are allowed.
const isOriginAllowed = (origin, allowedOrigins) =>
    !origin || allowedOrigins.includes(origin);

const corsHeadersFor = (req) => {
    const { origin } = req.headers;
    if (!origin) {
        return {};
    }
    const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
    };
    // Chrome Private/Local Network Access preflight for public -> loopback.
    if (req.headers['access-control-request-private-network'] === 'true') {
        headers['Access-Control-Allow-Private-Network'] = 'true';
    }
    return headers;
};

// Keep the name usable as a file name on every OS and make sure gSender's
// g-code extension checks recognise it.
export const sanitizeProgramName = (name) => {
    const base = String(name || '')
        .replace(/[/\\]/g, '_')
        .replace(/[<>:"|?*\x00-\x1f]/g, '_')
        .replace(/^\.+/, '')
        .trim()
        .slice(0, 120);
    const safe = base || 'gcam';
    return /\.(gcode|gc|nc|tap|cnc)$/i.test(safe) ? safe : `${safe}.nc`;
};

const readBody = (req, maxBytes) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        let received = 0;
        // Oversized bodies are drained rather than the socket destroyed, so
        // the client still gets a 413 instead of a connection reset.
        req.on('data', (chunk) => {
            received += chunk.length;
            if (received <= maxBytes) {
                chunks.push(chunk);
            }
        });
        req.on('end', () => {
            if (received > maxBytes) {
                const err = new Error('Payload too large');
                err.status = 413;
                reject(err);
                return;
            }
            resolve(Buffer.concat(chunks).toString('utf8'));
        });
        req.on('error', reject);
    });

/**
 * @param {object} options
 * @param {(file: {name: string, gcode: string}) => Promise<void>|void} options.onFile
 * @param {() => boolean} [options.isEnabled]
 * @param {() => boolean} [options.isBusy]
 * @param {string} [options.version]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {string[]} [options.allowedOrigins]
 * @param {number} [options.maxBytes]
 * @param {{info: Function, warn: Function, error: Function}} [options.logger]
 */
export const createGcamHandoffServer = ({
    onFile,
    isEnabled = () => true,
    isBusy = () => false,
    version = '',
    port = DEFAULT_GCAM_HANDOFF_PORT,
    host = '127.0.0.1',
    allowedOrigins = DEFAULT_GCAM_ALLOWED_ORIGINS,
    maxBytes = DEFAULT_GCAM_HANDOFF_MAX_BYTES,
    logger = console,
}) => {
    const handle = async (req, res) => {
        const { origin } = req.headers;
        if (!isOriginAllowed(origin, allowedOrigins)) {
            sendJson(res, 403, { error: 'origin-not-allowed' });
            return;
        }
        const cors = corsHeadersFor(req);
        const url = (req.url || '').split('?')[0];

        if (req.method === 'OPTIONS') {
            res.writeHead(204, cors);
            res.end();
            return;
        }

        if (req.method === 'GET' && url === '/gcam/v1/ping') {
            sendJson(
                res,
                200,
                {
                    app: 'gSender',
                    version,
                    accepting: isEnabled() && !isBusy(),
                    enabled: isEnabled(),
                    busy: isBusy(),
                },
                cors,
            );
            return;
        }

        if (req.method === 'POST' && url === '/gcam/v1/load') {
            if (!isEnabled()) {
                sendJson(res, 503, { error: 'disabled' }, cors);
                return;
            }
            // Requiring JSON also forces browsers to preflight the request.
            if (
                !/^application\/json\b/i.test(req.headers['content-type'] || '')
            ) {
                sendJson(res, 415, { error: 'expected-json' }, cors);
                return;
            }
            let payload;
            try {
                payload = JSON.parse(await readBody(req, maxBytes));
            } catch (err) {
                const status = err.status || 400;
                sendJson(
                    res,
                    status,
                    { error: status === 413 ? 'too-large' : 'invalid-json' },
                    cors,
                );
                return;
            }
            if (
                !payload ||
                typeof payload.gcode !== 'string' ||
                !payload.gcode.trim()
            ) {
                sendJson(res, 400, { error: 'missing-gcode' }, cors);
                return;
            }
            if (isBusy()) {
                sendJson(res, 409, { error: 'busy' }, cors);
                return;
            }
            const name = sanitizeProgramName(payload.name);
            try {
                await onFile({ name, gcode: payload.gcode });
            } catch (err) {
                logger.error(`gCAM handoff failed to load ${name}: ${err}`);
                sendJson(res, 500, { error: 'load-failed' }, cors);
                return;
            }
            sendJson(res, 202, { accepted: true, name }, cors);
            return;
        }

        sendJson(res, 404, { error: 'not-found' }, cors);
    };

    const server = http.createServer((req, res) => {
        handle(req, res).catch((err) => {
            logger.error(`gCAM handoff request error: ${err}`);
            if (!res.headersSent) {
                sendJson(res, 500, { error: 'internal' });
            }
        });
    });

    return {
        server,
        start: () =>
            new Promise((resolve, reject) => {
                const onError = (err) => {
                    server.off('listening', onListening);
                    reject(err);
                };
                const onListening = () => {
                    server.off('error', onError);
                    const address = server.address();
                    logger.info(
                        `gCAM handoff listening on http://${host}:${address.port}`,
                    );
                    resolve(address.port);
                };
                server.once('error', onError);
                server.once('listening', onListening);
                server.listen(port, host);
            }),
        stop: () =>
            new Promise((resolve) => {
                if (!server.listening) {
                    resolve();
                    return;
                }
                server.close(() => resolve());
            }),
    };
};
