#!/usr/bin/env node
/*
 * One-command start for the Layout → Figma tool.
 *
 * Starts the gSender backend (`yarn dev`) and renderer (`yarn vite:dev`) if
 * they aren't already running, waits for them, runs the capture CLI, then
 * stops whatever it started. Everything except the flags below is passed
 * straight to capture/cli.mjs (URLs, --theme, -w/-h, --eval, …).
 *
 *   yarn figma                                   main screen, light theme
 *   yarn figma --theme both "http://localhost:5173/#/configuration"
 *   yarn figma --keep                            leave the servers running
 *   yarn figma --machine 192.168.5.1:23          connect somewhere else first
 *   yarn figma --live                            capture on demand (⌥⇧F)
 *   yarn figma --header-states                   also break out header menus
 *   yarn figma --all-states                      ...and the sidebar's too
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BACKEND_URL = 'http://localhost:8000/';
const RENDERER_URL = 'http://localhost:5173/';
const START_TIMEOUT = 5 * 60 * 1000; // a cold `yarn dev` builds first
const isWindows = process.platform === 'win32';
// grblHAL digital twin; gSender shows its full UI only with a machine attached.
const DEFAULT_MACHINE = '127.0.0.1:23';
// The header (connection, status icons, …) looks the same on every screen,
// so by default only tabs and menus in the main area (Carve panel, settings
// pages) are broken out into components.
const DEFAULT_STATES_IN = 'main';

const args = process.argv.slice(2);
const own = {
    keep: false,
    open: false,
    help: false,
    live: false,
    allStates: false,
    headerStates: false,
    machine: undefined, // default depends on the mode, see below
};
const passthrough = [];
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--keep') own.keep = true;
    else if (a === '--live') own.live = true;
    else if (a === '--open') own.open = true;
    else if (a === '--all-states') own.allStates = true;
    else if (a === '--header-states') own.headerStates = true;
    else if (a === '--help') own.help = true;
    else if (a === '--no-machine') own.machine = null;
    else if (a === '--machine') own.machine = args[++i];
    else if (a.startsWith('--machine=')) own.machine = a.slice(10);
    else passthrough.push(a);
}
// Live mode leaves connecting to you (use the app's Connect menu as usual);
// a batch capture connects to the twin unless told otherwise.
if (own.machine === undefined) own.machine = own.live ? null : DEFAULT_MACHINE;

if (own.help) {
    console.log(`
Usage: yarn figma [--live] [--keep] [--open] [--machine host:port] [capture options] [url ...]

Starts the gSender dev servers if needed, connects to a machine, captures,
and stops the servers again.

  --live                Open gSender in a window and capture on demand instead
                        (⌥⇧F / Alt+Shift+F in the page). Same as yarn figma:live.
  --keep                Leave servers this script started running afterwards
  --open                Open the output folder when done
  --machine host:port   Machine to connect to over Ethernet before capturing
                        (default: ${DEFAULT_MACHINE}, the grblHALTwin; live
                        mode doesn't connect unless you pass this)
  --no-machine          Capture disconnected
  --header-states       Also break out the header's menus (connection,
                        machine info, notifications)
  --all-states          Also break out tabs and menus in the header and
                        sidebar (by default only the main area's are, same as
                        --states-in ${DEFAULT_STATES_IN})

${own.live ? 'Live' : 'Capture'} options (passed through):`);
    await run(process.execPath, [path.join(HERE, captureScript()), '--help']);
    process.exit(0);
}

const started = [];
const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-to-figma-logs-'));

process.on('SIGINT', () => {
    stopAll();
    process.exit(130);
});

// Attaching to an already-running app (e.g. Electron) captures it as it is.
const attaching = passthrough.includes('--connect');

try {
    let setup = [];
    if (!attaching) {
        await ensure('backend', BACKEND_URL, ['dev']);
        await ensure('renderer', RENDERER_URL, ['vite:dev']);
        setup = await machineSetup(own.machine);
    }
    await runCapture(setup);
} catch (e) {
    console.error(`\n✖ ${e.message}`);
    process.exitCode = 1;
} finally {
    if (own.keep && started.length) {
        console.log(
            `\nLeaving ${started.map((s) => s.name).join(' and ')} running (logs in ${logDir}).`,
        );
    } else {
        stopAll();
    }
}

/* -------------------------------------------------------------------- */

async function runCapture(setup) {
    console.log(
        own.live ? '\n▶ Opening gSender for live capture…' : '\n▶ Capturing…',
    );
    const code = await run(
        process.execPath,
        [
            path.join(HERE, captureScript()),
            ...setup,
            ...statesScope(),
            ...passthrough,
        ],
        {
            cwd: ROOT,
        },
    );
    if (code !== 0) throw new Error(`Capture failed (exit ${code}).`);
    // Live mode returns once its window closes; servers stop in `finally`.
    if (!own.live) {
        const outDir = path.resolve(ROOT, outputDir(passthrough));
        console.log(`
✔ Done. Captures are in ${outDir}

Next, in the Figma desktop app, open a Design file (not FigJam), then:
  1. First time only: press ⌘/ (Ctrl+/ on Windows), run "Import plugin from manifest",
     and choose ${path.join(HERE, 'figma-plugin', 'manifest.json')}
  2. Press ⌘/ again, run "Layout Importer", and drop in the .json files.`);
        if (own.open) openPath(outDir);
    }
}

function captureScript() {
    return own.live ? 'capture/live.mjs' : 'capture/cli.mjs';
}

async function ensure(name, url, yarnArgs) {
    if (await isUp(url)) {
        console.log(`✔ ${name} already running at ${url}`);
        return;
    }
    const log = path.join(logDir, `${name}.log`);
    console.log(`▶ Starting ${name} (yarn ${yarnArgs.join(' ')}), log: ${log}`);
    const out = fs.openSync(log, 'a');
    const child = spawn(isWindows ? 'yarn.cmd' : 'yarn', yarnArgs, {
        cwd: ROOT,
        stdio: ['ignore', out, out],
        // Own process group, so the whole tree (concurrently, nodemon, …) can be stopped.
        detached: !isWindows,
        shell: isWindows,
    });
    started.push({ name, child, log });

    const deadline = Date.now() + START_TIMEOUT;
    let exited = null;
    child.on('exit', (c) => {
        exited = c;
    });
    while (Date.now() < deadline) {
        if (exited !== null) {
            throw new Error(
                `${name} exited with code ${exited}. Last log lines:\n${tail(log)}`,
            );
        }
        if (await isUp(url)) {
            console.log(`✔ ${name} ready at ${url}`);
            return;
        }
        await sleep(1000);
    }
    throw new Error(
        `${name} didn't come up within ${START_TIMEOUT / 60000} minutes. See ${log}`,
    );
}

// Returns the --setup args that connect gSender to the machine, or none if
// it's switched off or unreachable.
async function machineSetup(machine) {
    if (!machine) return [];
    const [host, portStr] = machine.split(':');
    const port = Number(portStr || 23);
    if (!(await isTcpOpen(host, port))) {
        console.log(
            `! No machine answering at ${host}:${port}; capturing disconnected. Is grblHALTwin running?`,
        );
        return [];
    }
    console.log(
        `✔ Machine at ${host}:${port}; gSender will connect before capturing`,
    );
    const preset = fs.readFileSync(
        path.join(HERE, 'presets/gsender-connect.js'),
        'utf8',
    );
    return [
        '--setup',
        `${preset}\nawait l2fConnectMachine(${JSON.stringify(host)}, ${port});`,
    ];
}

function statesScope() {
    const custom = passthrough.some((a) =>
        /^--(states-in|states-skip|no-states)(=|$)/.test(a),
    );
    if (own.allStates || custom) return [];
    const scope = own.headerStates
        ? `${DEFAULT_STATES_IN}, header`
        : DEFAULT_STATES_IN;
    return ['--states-in', scope];
}

function isTcpOpen(host, port) {
    return new Promise((resolve) => {
        const socket = net.connect({ host, port, timeout: 2000 });
        const done = (ok) => {
            socket.destroy();
            resolve(ok);
        };
        socket.once('connect', () => done(true));
        socket.once('timeout', () => done(false));
        socket.once('error', () => done(false));
    });
}

async function isUp(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        return res.status < 500;
    } catch {
        return false;
    }
}

function stopAll() {
    for (const { name, child } of started.splice(0)) {
        if (child.exitCode !== null) continue;
        try {
            if (isWindows)
                spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
                    stdio: 'ignore',
                });
            else process.kill(-child.pid, 'SIGTERM');
            console.log(`■ Stopped ${name}`);
        } catch {
            /* already gone */
        }
    }
}

function run(cmd, cmdArgs, opts = {}) {
    return new Promise((resolve) => {
        const child = spawn(cmd, cmdArgs, { stdio: 'inherit', ...opts });
        child.on('exit', (code) => resolve(code ?? 1));
    });
}

function outputDir(cliArgs) {
    const i = cliArgs.findIndex((a) => a === '-o' || a === '--out');
    if (i >= 0 && cliArgs[i + 1]) return cliArgs[i + 1];
    const eq = cliArgs.find((a) => a.startsWith('--out='));
    return eq ? eq.slice(6) : 'figma-captures';
}

function openPath(p) {
    const cmd =
        process.platform === 'darwin'
            ? 'open'
            : isWindows
              ? 'explorer'
              : 'xdg-open';
    spawn(cmd, [p], { stdio: 'ignore', detached: true }).unref();
}

function tail(file, lines = 15) {
    try {
        return fs
            .readFileSync(file, 'utf8')
            .trimEnd()
            .split('\n')
            .slice(-lines)
            .join('\n');
    } catch {
        return '(no log)';
    }
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
