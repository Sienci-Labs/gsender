#!/usr/bin/env node
/*
 * Launcher: a local web page for running the Layout → Figma tool without
 * remembering its flags.
 *
 *   yarn figma:ui
 *
 * It serves launcher/index.html on http://localhost:7780, starts
 * tools/figma-layout/start.mjs with the options picked on the page, shows
 * its output, lists the captures, and can write a "differences only" file
 * from two of them. It also serves the captures folder to the Figma
 * plugin's Live panel (http://localhost:7777), whatever mode is running.
 *
 * It only listens on this machine and only starts start.mjs, with
 * arguments built from a fixed set of options.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { diffFiles } from '../capture/diff.mjs';
import { LAYOUTS, listCaptures, serveCaptures } from '../capture/lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'figma-captures');
const isWindows = process.platform === 'win32';
const MAX_LOG = 2000;

const { values: opts } = parseArgs({
    options: {
        port: { type: 'string', default: '7780' },
        'serve-port': { type: 'string', default: '7777' },
        'no-open': { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
});
if (opts.help) {
    console.log(`
Usage: yarn figma:ui [--port 7780] [--serve-port 7777] [--no-open]

Opens a page for launching captures (desktop, pendant, Android; one-off,
live or Storybook), watching them run, and comparing captures.
`);
    process.exit(0);
}
const PORT = Number(opts.port);

/* -------------------------------------------------------------------- */
/* The one job                                                          */
/* -------------------------------------------------------------------- */

let job = null; // { child, mode, label, args, startedAt, exit }
const log = []; // { n, text }
let logCount = 0;

// Output arrives in chunks that can end mid-line ("  Button … " and then its
// result); hold the unfinished part until the rest comes.
let partial = '';
function addLog(text, flush = false) {
    const parts = (partial + String(text)).split(/\r?\n/);
    partial = flush ? '' : parts.pop();
    for (const line of parts) {
        if (!line && (!log.length || !log[log.length - 1].text)) continue;
        log.push({ n: ++logCount, text: line });
        if (job) track(job.progress, line);
    }
    if (log.length > MAX_LOG) log.splice(0, log.length - MAX_LOG);
}

// What a running job is doing, read from its output: the last step it
// announced ("Starting backend", "Capturing…") and, for Storybook, how many
// components are done out of how many.
export function newProgress() {
    return { phase: 'Starting…', done: 0, total: 0 };
}
export function track(p, line) {
    let m;
    if ((m = line.match(/^▶ (.+?)(?: \(.*\))?(?:,\s*log:.*)?$/))) p.phase = m[1];
    else if ((m = line.match(/^✔ (\S+) (?:ready|already running)/))) p.phase = `${m[1]} ready`;
    else if ((m = line.match(/^• (.+?): (\d+) component\(s\)/))) {
        p.total += Number(m[2]);
        p.phase = `Capturing Storybook · ${m[1]}`;
    } else if (/^ {2}\S.* … /.test(line)) p.done++;
    else if (/^• \S+.* … /.test(line)) p.done++;
}

const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);
const px = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 200 && n <= 8000 ? String(n) : null;
};

// Turns the page's options into start.mjs arguments. Everything is checked
// against what the tool accepts; nothing from the page reaches a shell.
export function buildArgs(o = {}) {
    const mode = oneOf(o.mode, ['capture', 'live', 'storybook'], 'capture');
    const layout = oneOf(o.layout, ['desktop', 'pendant', 'android', 'all'], 'desktop');
    const args = [];
    if (mode === 'live') args.push('--live', '--no-serve');
    if (mode === 'storybook') args.push('--storybook');
    if (layout === 'pendant') args.push('--pendant');
    if (layout === 'android') args.push('--android');
    if (layout === 'all') {
        if (mode !== 'storybook')
            throw new Error('Pick one layout: only Storybook captures them all at once.');
        args.push('--layout', 'all');
    }
    if (layout !== 'desktop') {
        const turn = oneOf(o.orientation, ['portrait', 'landscape'], null);
        if (turn) args.push(`--${turn}`);
    }
    const w = px(o.width);
    const h = px(o.height);
    if (o.width && !w) throw new Error('Width must be a whole number of pixels, 200 to 8000.');
    if (o.height && !h) throw new Error('Height must be a whole number of pixels, 200 to 8000.');
    if (w) args.push('--width', w);
    if (h) args.push('--height', h);
    if (o.keep) args.push('--keep');

    if (mode !== 'live') {
        const theme = oneOf(o.theme, ['light', 'dark', 'both'], null);
        if (theme) args.push('--theme', theme);
        if (o.stamp !== false) args.push('--stamp');
    }

    if (mode === 'storybook') {
        args.push('--controls', oneOf(o.controls, ['none', 'primary', 'all'], 'primary'));
        if (o.interaction) args.push('--interaction-states');
        if (o.combinations) args.push('--combinations');
        for (const s of [].concat(o.stories || [])) {
            const text = String(s).trim();
            if (!text) continue;
            if (text.startsWith('-') || text.length > 100)
                throw new Error(`"${text}" isn't a usable story filter.`);
            args.push('--stories', text);
        }
        return { mode, layout, args };
    }

    const states = oneOf(o.states, ['main', 'header', 'all', 'none'], 'main');
    if (states === 'header') args.push('--header-states');
    if (states === 'all') args.push('--all-states');
    if (states === 'none') args.push('--no-states');

    const machine = String(o.machine || '').trim();
    if (machine === 'none') args.push('--no-machine');
    else if (machine && machine !== 'twin') {
        if (!/^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(machine))
            throw new Error('Machine must look like host:port, e.g. 192.168.5.1:23.');
        args.push('--machine', machine);
    } else if (machine === 'twin' && mode === 'live') {
        // Live mode doesn't connect unless asked.
        args.push('--machine', '127.0.0.1:23');
    }

    if (mode === 'capture') {
        if (o.machineStates) args.push('--modes', 'all');
        for (const u of [].concat(o.urls || [])) {
            const text = String(u).trim();
            if (!text) continue;
            let url;
            try {
                url = new URL(text);
            } catch {
                throw new Error(`"${text}" isn't a URL.`);
            }
            if (!/^https?:$/.test(url.protocol))
                throw new Error(`"${text}" must be an http(s) URL.`);
            args.push(url.href);
        }
        // Screens and the states of the components on them, in one go: the
        // plugin lays each component's states out beneath the screens.
        if (o.withStories) {
            const next = buildArgs({ ...o, mode: 'storybook', stories: [] }).args;
            return { mode, layout, args, next };
        }
    }
    return { mode, layout, args };
}

const LABELS = { capture: 'Capture', live: 'Live capture', storybook: 'Storybook' };

function start(options) {
    if (job && job.exit === null) throw new Error('A capture is already running.');
    const { mode, layout, args, next } = buildArgs(options);
    log.length = 0;
    partial = '';
    const where = layout === 'all' ? 'all layouts' : LAYOUTS[layout].label;
    const steps = [{ mode, args, label: `${LABELS[mode]} · ${where}` }];
    if (next) {
        steps[0].label = `Screens · ${where} (1 of 2)`;
        steps.push({ mode: 'storybook', args: next, label: `Storybook states · ${where} (2 of 2)` });
    }
    runStep(steps, 0);
}

// A PORT meant for whatever started the launcher would otherwise move the
// dev servers (Storybook listens on $PORT over its -p flag).
function childEnv() {
    const env = { ...process.env, L2F_STDIN_CAPTURE: '1', FORCE_COLOR: '0' };
    delete env.PORT;
    return env;
}

function runStep(steps, i) {
    const { mode, args, label } = steps[i];
    addLog(`${i ? '\n' : ''}$ yarn figma ${args.join(' ')}\n`);
    const child = spawn(process.execPath, [path.join(HERE, '../start.mjs'), ...args], {
        cwd: ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
        // Its own process group, so Stop reaches the capture script and
        // Chrome as well as start.mjs.
        detached: !isWindows,
        env: childEnv(),
    });
    job = {
        child,
        mode,
        label,
        args,
        startedAt: Date.now(),
        // When the first step started, for the elapsed time of the whole run
        runStartedAt: (steps.startedAt ??= Date.now()),
        exit: null,
        step: i + 1,
        steps: steps.length,
        progress: newProgress(),
    };
    const mine = job;
    child.stdout.on('data', (d) => addLog(d));
    child.stderr.on('data', (d) => addLog(d));
    child.on('error', (e) => {
        addLog(`✖ ${e.message}`, true);
        mine.exit = 1;
    });
    child.on('exit', (code, signal) => {
        const exit = code ?? (signal ? 130 : 1);
        if (exit === 0 && !mine.stopped && i + 1 < steps.length) {
            addLog('', true);
            runStep(steps, i + 1);
            return;
        }
        mine.exit = exit;
        mine.endedAt = Date.now();
        addLog(
            `\n${
                mine.exit === 0
                    ? '■ Finished.'
                    : mine.stopped
                      ? '■ Stopped.'
                      : `■ Exited with code ${mine.exit}.`
            }`,
            true,
        );
    });
}

function stop() {
    if (!job || job.exit !== null) return;
    job.stopped = true;
    try {
        if (isWindows)
            spawn('taskkill', ['/pid', String(job.child.pid), '/T', '/F'], {
                stdio: 'ignore',
            });
        else process.kill(-job.child.pid, 'SIGINT');
    } catch {
        job.child.kill();
    }
}

function captureNow() {
    if (!job || job.exit !== null || job.mode !== 'live')
        throw new Error('Live capture is not running.');
    job.child.stdin.write('\n');
}

/* -------------------------------------------------------------------- */
/* HTTP                                                                 */
/* -------------------------------------------------------------------- */

const LOCAL = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

// Requests must come from this page: a local host name (which defeats DNS
// rebinding) and, for anything that changes state, this page's origin.
function allowed(req) {
    if (!LOCAL.has(req.headers.host)) return false;
    if (req.method === 'GET') return true;
    const origin = req.headers.origin;
    if (origin && !LOCAL.has(origin.replace(/^https?:\/\//, ''))) return false;
    return /^application\/json/.test(req.headers['content-type'] || '');
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (c) => {
            data += c;
            if (data.length > 1e5) reject(new Error('Request too large.'));
        });
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch {
                reject(new Error('Bad JSON.'));
            }
        });
        req.on('error', reject);
    });
}

// A capture file in the output folder, by name only.
function captureFile(name) {
    const base = path.basename(String(name || ''));
    if (!base.endsWith('.figma-layout.json'))
        throw new Error('Not a capture file.');
    const file = path.join(OUT, base);
    if (!fs.existsSync(file)) throw new Error(`${base} no longer exists.`);
    return file;
}

function state(since) {
    return {
        job: job && {
            mode: job.mode,
            label: job.label,
            running: job.exit === null,
            exit: job.exit,
            startedAt: job.startedAt,
            runStartedAt: job.runStartedAt,
            endedAt: job.endedAt || null,
            step: job.step,
            steps: job.steps,
            progress: job.progress,
            // The item being captured right now ("  Features/Jogging … "),
            // printed before its result arrives.
            current: job.exit === null ? partial.trim().replace(/\s*…$/, '') : '',
        },
        now: Date.now(),
        log: log.filter((l) => l.n > since),
        captures: listCaptures(OUT),
        outDir: OUT,
        manifest: path.join(HERE, '../figma-plugin/manifest.json'),
        livePort: liveServing ? Number(opts['serve-port']) : null,
    };
}

const routes = {
    'POST /api/run': async (body) => (start(body), { ok: true }),
    'POST /api/stop': async () => (stop(), { ok: true }),
    'POST /api/capture-now': async () => (captureNow(), { ok: true }),
    'POST /api/diff': async (body) => {
        const base = captureFile(body.base);
        const next = captureFile(body.against);
        if (base === next) throw new Error('Pick two different captures.');
        const { file, summary } = diffFiles(base, next);
        return { file: file && path.basename(file), summary };
    },
    'POST /api/open': async () => {
        fs.mkdirSync(OUT, { recursive: true });
        const cmd =
            process.platform === 'darwin' ? 'open' : isWindows ? 'explorer' : 'xdg-open';
        spawn(cmd, [OUT], { stdio: 'ignore', detached: true }).unref();
        return { ok: true };
    },
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const json = (code, body) => {
        res.writeHead(code, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify(body));
    };
    if (!allowed(req)) return json(403, { error: 'Not allowed.' });
    try {
        if (req.method === 'GET' && url.pathname === '/') {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
            });
            return res.end(fs.readFileSync(path.join(HERE, 'index.html')));
        }
        if (req.method === 'GET' && url.pathname === '/api/state')
            return json(200, state(Number(url.searchParams.get('since')) || 0));
        const route = routes[`${req.method} ${url.pathname}`];
        if (!route) return json(404, { error: 'Not found.' });
        return json(200, await route(await readBody(req)));
    } catch (e) {
        return json(400, { error: e.message });
    }
});

let liveServing = false;

async function main() {
    fs.mkdirSync(OUT, { recursive: true });
    try {
        await serveCaptures(OUT, opts['serve-port']);
        liveServing = true;
    } catch (e) {
        console.log(
            `! Not serving captures to the Figma plugin: ${e.message} Captures still land in ${OUT}.`,
        );
    }
    await new Promise((resolve, reject) => {
        server.once('error', (e) =>
            reject(
                e.code === 'EADDRINUSE'
                    ? new Error(
                          `Port ${PORT} is in use. Is the launcher already open at http://localhost:${PORT}?`,
                      )
                    : e,
            ),
        );
        server.listen(PORT, '127.0.0.1', resolve);
    });
    const address = `http://localhost:${PORT}`;
    console.log(`● Layout → Figma launcher: ${address}  (Ctrl+C to quit)`);
    if (!opts['no-open']) {
        const cmd =
            process.platform === 'darwin' ? 'open' : isWindows ? 'cmd' : 'xdg-open';
        const cmdArgs = isWindows ? ['/c', 'start', '', address] : [address];
        spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true }).unref();
    }
    const quit = () => {
        stop();
        // Give start.mjs a moment to stop the servers it started.
        setTimeout(() => process.exit(0), job && job.exit === null ? 1500 : 0);
    };
    process.on('SIGINT', quit);
    process.on('SIGTERM', quit);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((e) => {
        console.error(e.message);
        process.exit(1);
    });
}
