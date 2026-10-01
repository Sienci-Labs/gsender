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
const electronPath = require('electron');
const RENDERER_HOST = '127.0.0.1';
const RENDERER_PORT = 5173;
const RENDERER_URL = `http://${RENDERER_HOST}:${RENDERER_PORT}`;
const BACKEND_URL = 'http://127.0.0.1:8000';
const READY_TIMEOUT_MS = 60000;

const children = [];
let serverChild = null;
let pendingDevRestart = false;
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

function waitForUrl(url, timeoutMs) {
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

function spawnElectron() {
    // Spawned directly by binary path, not `spawn('electron', ..., {shell:
    // true})`: with a shell, the direct child is actually
    // `/bin/sh -c "electron ..."`, and whether the 'ipc' stdio slot below
    // (and the NODE_CHANNEL_FD env var it relies on) survives that shell's
    // hand-off to the real electron binary underneath isn't something to
    // rely on cross-platform. require('electron') resolves to the absolute
    // path of the real platform binary (the standard technique dev tooling
    // like electron-forge uses), so this goes straight there with no
    // intermediary that could drop the channel.
    const child = spawn(electronPath, [path.join(rootDir, 'output/main')], {
        cwd: rootDir,
        // The 4th ('ipc') fd lets src/main.js's restartApp() tell us a real
        // restart (not just a window close) is happening, via process.send.
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: {
            ...process.env,
            NODE_ENV: 'development',
            ELECTRON_RENDERER_URL: RENDERER_URL,
        },
    });
    children.push(child);
    child.on('message', (msg) => {
        if (msg?.type === 'gsender-dev-restart') {
            pendingDevRestart = true;
        }
    });
    child.on('exit', (code) => {
        if (shuttingDown) {
            return;
        }
        if (pendingDevRestart) {
            pendingDevRestart = false;
            restartBackendAndElectron();
            return;
        }
        console.log(`[electron] exited with code ${code} — ending dev session`);
        shutdown(code ?? 0);
    });
    return child;
}

// Restarts only the backend (to pick up a just-installed plugin's mount
// routes) and then reopens Electron against it. esbuild and vite are left
// running untouched — neither needs to restart for this.
function restartBackendAndElectron() {
    console.log('🔁 Restarting gSender backend for the installed plugin...\n');

    const oldServer = serverChild;
    const idx = children.indexOf(oldServer);
    if (idx !== -1) {
        children.splice(idx, 1);
    }

    // Splicing oldServer out of `children` above only stops shutdown()'s own
    // cleanup loop from double-killing it later — the 'exit' listener
    // runNpmScript attached back when it was first created is still live on
    // this same child object. That listener exists to catch an *unexpected*
    // crash and tear the whole session down; without removing it here, our
    // own deliberate kill() below would trip it, and it would tear down the
    // brand-new backend we're about to spawn along with everything else.
    // Also wait for the old process to actually exit (not just fire-and-
    // forget the kill) before starting its replacement, so the new nodemon
    // isn't racing the old one to bind port 8000.
    const oldServerGone =
        oldServer && !oldServer.killed
            ? new Promise((resolve) => {
                  oldServer.removeAllListeners('exit');
                  oldServer.once('exit', () => resolve());
                  oldServer.kill();
              })
            : Promise.resolve();

    oldServerGone
        .then(() => {
            serverChild = runNpmScript('server', 'start-dev:nodemon');
            return waitForUrl(BACKEND_URL, READY_TIMEOUT_MS);
        })
        .then(() => {
            console.log(
                `✨ Backend ready at ${BACKEND_URL}, relaunching electron...\n`,
            );
            spawnElectron();
        })
        .catch((err) => {
            console.error(err.message);
            shutdown(1);
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
serverChild = runNpmScript('server', 'start-dev:nodemon');
runNpmScript('vite', 'vite:dev');

waitForUrl(RENDERER_URL, READY_TIMEOUT_MS)
    .then(() => {
        console.log(
            `✨ Renderer ready at ${RENDERER_URL}, launching electron...\n`,
        );
        spawnElectron();
    })
    .catch((err) => {
        console.error(err.message);
        shutdown(1);
    });
