#!/usr/bin/env node

/**
 * Orchestrates `npm run dev:electron`: runs the esbuild watcher, the dev
 * backend server, and the renderer's vite dev server concurrently, then
 * launches Electron pointed at the vite dev server once it's reachable.
 *
 * Electron main-process hot reload is handled by electron-reloader (wired
 * up in src/main.js) whenever esbuild rebuilds output/main.js; renderer hot
 * reload is handled by vite's own HMR.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const RENDERER_HOST = '127.0.0.1';
const RENDERER_PORT = 5173;
const RENDERER_URL = `http://${RENDERER_HOST}:${RENDERER_PORT}`;
const RENDERER_READY_TIMEOUT_MS = 60000;

const children = [];
let shuttingDown = false;

function runNpmScript(name, npmScript) {
    const child = spawn('npm', ['run', npmScript], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true,
    });
    children.push(child);
    child.on('exit', (code, signal) => {
        if (!shuttingDown && code !== 0 && code !== null) {
            console.error(`[${name}] exited with code ${code}`);
            shutdown(code);
        } else if (!shuttingDown && signal) {
            shutdown(1);
        }
    });
    return child;
}

function waitForRenderer(url, timeoutMs) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const req = http.get(url, (res) => {
                res.resume();
                resolve();
            });
            req.on('error', () => {
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timed out waiting for ${url}`));
                    return;
                }
                setTimeout(check, 200);
            });
        };
        check();
    });
}

function shutdown(code) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    for (const child of children) {
        if (!child.killed) {
            child.kill();
        }
    }
    process.exit(code ?? 0);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('🔥 Starting gSender electron dev (hot reload)...\n');

runNpmScript('esbuild', 'watch-dev');
runNpmScript('server', 'start-dev:nodemon');
runNpmScript('vite', 'vite:dev');

waitForRenderer(RENDERER_URL, RENDERER_READY_TIMEOUT_MS)
    .then(() => {
        console.log(
            `✨ Renderer ready at ${RENDERER_URL}, launching electron...\n`,
        );
        const electron = spawn(
            'electron',
            [path.join(rootDir, 'output/main')],
            {
                cwd: rootDir,
                stdio: 'inherit',
                shell: true,
                env: {
                    ...process.env,
                    NODE_ENV: 'development',
                    ELECTRON_RENDERER_URL: RENDERER_URL,
                },
            },
        );
        children.push(electron);
        electron.on('exit', (code) => shutdown(code ?? 0));
    })
    .catch((err) => {
        console.error(err.message);
        shutdown(1);
    });
