/*
 * Shared pieces of the capture CLI and live mode: a minimal Chrome DevTools
 * Protocol client, browser launching, and turning the current page into a
 * .figma-layout.json document.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Read for every capture, so a long-running live session picks up edits.
function serializer() {
    return fs.readFileSync(path.join(HERE, 'serialize.js'), 'utf8');
}

/* -------------------------------------------------------------------- */
/* Minimal CDP client                                                   */
/* -------------------------------------------------------------------- */

export class CDP {
    static async connect(wsUrl) {
        const ws = new WebSocket(wsUrl);
        await new Promise((resolve, reject) => {
            ws.addEventListener('open', resolve, { once: true });
            ws.addEventListener(
                'error',
                () => reject(new Error(`Could not connect to ${wsUrl}`)),
                { once: true },
            );
        });
        return new CDP(ws);
    }

    constructor(ws) {
        this.ws = ws;
        this.nextId = 1;
        this.pending = new Map();
        this.listeners = new Map();
        ws.addEventListener('message', (e) => {
            const msg = JSON.parse(e.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error)
                    reject(
                        new Error(
                            `${msg.error.message} ${msg.error.data || ''}`,
                        ),
                    );
                else resolve(msg.result);
            } else if (msg.method) {
                (this.listeners.get(msg.method) || []).forEach((fn) =>
                    fn(msg.params),
                );
            }
        });
    }

    send(method, params = {}) {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) =>
            this.pending.set(id, { resolve, reject }),
        );
    }

    on(method, fn) {
        this.listeners.set(method, [...(this.listeners.get(method) || []), fn]);
    }

    once(method, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error(`Timed out waiting for ${method}`)),
                timeout,
            );
            const list = this.listeners.get(method) || [];
            const fn = (params) => {
                clearTimeout(timer);
                this.listeners.set(
                    method,
                    (this.listeners.get(method) || []).filter((f) => f !== fn),
                );
                resolve(params);
            };
            this.listeners.set(method, [...list, fn]);
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true,
            userGesture: true,
        });
        if (res.exceptionDetails) {
            const d = res.exceptionDetails;
            throw new Error((d.exception && d.exception.description) || d.text);
        }
        return res.result.value;
    }

    close() {
        this.ws.close();
    }
}

/* -------------------------------------------------------------------- */
/* Browser                                                              */
/* -------------------------------------------------------------------- */

export function findChrome() {
    const candidates =
        {
            darwin: [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
                '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            ],
            win32: [
                `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`,
                `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
                `${process.env['LOCALAPPDATA']}\\Google\\Chrome\\Application\\chrome.exe`,
                `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
            ],
            linux: [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium',
                '/usr/bin/chromium-browser',
            ],
        }[process.platform] || [];
    return candidates.find((p) => p && fs.existsSync(p));
}

// Launches Chrome with a throwaway profile. `app` opens a chromeless window
// on that URL (used by live mode); otherwise the first tab is about:blank.
export async function launchChrome({
    chrome,
    width,
    height,
    headful,
    app,
} = {}) {
    const exe = chrome || findChrome();
    if (!exe) throw new Error('Chrome not found. Pass --chrome <path>.');
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-to-figma-'));
    const args = [
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--force-color-profile=srgb',
        `--window-size=${width},${height}`,
        // Keep rendering and running timers while the window is covered
        // (e.g. by Figma) or minimized, or screenshots stall until it's
        // shown again.
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
        app ? `--app=${app}` : 'about:blank',
    ];
    if (!headful) args.unshift('--headless=new');
    const proc = spawn(exe, args, { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
    if (!fs.existsSync(portFile)) throw new Error('Chrome did not start');
    await sleep(100);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
    return {
        port,
        close: () => {
            proc.kill();
            setTimeout(
                () => fs.rmSync(profile, { recursive: true, force: true }),
                500,
            );
        },
    };
}

export async function pageTarget(port, match) {
    const list = await (
        await fetch(`http://127.0.0.1:${port}/json/list`)
    ).json();
    const pages = list.filter(
        (t) => t.type === 'page' && !t.url.startsWith('devtools://'),
    );
    const page = match
        ? pages.find((t) => t.url.includes(match) || t.title.includes(match))
        : pages[0];
    if (!page) {
        throw new Error(
            `No matching page on port ${port}. Pages:\n` +
                pages.map((p) => `  ${p.title} — ${p.url}`).join('\n'),
        );
    }
    return page;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------- */
/* Capture                                                              */
/* -------------------------------------------------------------------- */

export async function waitFor(cdp, selector, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (
            await cdp.evaluate(
                `!!document.querySelector(${JSON.stringify(selector)})`,
            )
        )
            return;
        await sleep(200);
    }
    throw new Error(`Timed out waiting for "${selector}"`);
}

// SPAs keep rendering after the load event; wait until the element count
// has been unchanged for a second.
export async function waitForStableDom(cdp, timeout = 30000, stableMs = 1000) {
    const start = Date.now();
    let last = -1;
    let stableSince = Date.now();
    while (Date.now() - start < timeout) {
        const count = await cdp.evaluate(
            `document.getElementsByTagName('*').length`,
        );
        if (count !== last) {
            last = count;
            stableSince = Date.now();
        } else if (Date.now() - stableSince >= stableMs && count > 20) {
            return;
        }
        await sleep(200);
    }
}

async function screenshotRasters(cdp, doc, fullPage) {
    if (!doc.rasters.length) return;
    const byId = new Map();
    (function index(n) {
        byId.set(n.id, n);
        (n.children || []).forEach(index);
    })(doc.root);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', {
        color: { r: 0, g: 0, b: 0, a: 0 },
    });
    for (const id of doc.rasters) {
        const node = byId.get(id);
        if (!node) continue;
        // Hide everything except the element so overlapping UI isn't baked in.
        await cdp.evaluate(`(() => {
            const s = document.createElement('style');
            s.id = '__l2f_iso';
            s.textContent = 'html, body { background: transparent !important; } ' +
                'html * { visibility: hidden !important; transition: none !important; } ' +
                '[data-l2f-raster="${id}"], [data-l2f-raster="${id}"] * { visibility: visible !important; }';
            document.head.appendChild(s);
        })()`);
        try {
            const shot = await cdp.send('Page.captureScreenshot', {
                format: 'png',
                clip: {
                    x: node.x,
                    y: node.y,
                    width: node.w,
                    height: node.h,
                    scale: 2,
                },
                captureBeyondViewport: !!fullPage,
            });
            node.image = {
                src: `data:image/png;base64,${shot.data}`,
                fit: 'FILL',
            };
        } catch (e) {
            console.warn(`  ! could not screenshot ${node.name}: ${e.message}`);
        }
        await cdp.evaluate(`document.getElementById('__l2f_iso')?.remove()`);
    }
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', {});
}

// Serializes whatever the page shows right now, then screenshots the
// elements that can only be represented as images. With `states`, also
// cycles through every tab group and opens every popup (menus, popovers,
// dialogs) to record those layouts, then puts the page back as it was.
// `statesIn` / `statesSkip` are CSS selectors limiting where it looks.
export async function serializePage(
    cdp,
    {
        fullPage = false,
        raster = true,
        states = true,
        statesIn,
        statesSkip,
        onProgress = () => {},
    } = {},
) {
    await cdp.evaluate(
        `document.fonts && document.fonts.ready.then(() => true)`,
    );
    await cdp.evaluate(`window.__L2F_NO_AUTORUN = true; ${serializer()}; true`);
    // Endless animations (spinners, rotating borders) would be caught at a
    // random frame; show their first frame instead. Finite ones (a dialog
    // fading in) are left alone, since their first frame is often invisible.
    await cdp.evaluate(`window.__l2fLoops = document.getAnimations().filter((a) =>
        a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity);
        window.__l2fLoops.forEach((a) => { a.pause(); a.currentTime = 0; }); true`);
    try {
        return await serializeNow(cdp, {
            fullPage,
            raster,
            states,
            statesIn,
            statesSkip,
            onProgress,
        });
    } finally {
        await cdp
            .evaluate(
                `(window.__l2fLoops || []).forEach((a) => a.play()); delete window.__l2fLoops; true`,
            )
            .catch(() => {});
    }
}

async function serializeNow(
    cdp,
    { fullPage, raster, states, statesIn, statesSkip, onProgress },
) {
    const found = states
        ? await cdp.evaluate(
              `window.__layoutToFigma.findStates(${JSON.stringify({ within: statesIn, skip: statesSkip })})`,
          )
        : [];
    const json = await cdp.evaluate(
        `window.__layoutToFigma.capture(${JSON.stringify({ fullPage, raster })}).then(JSON.stringify)`,
    );
    const doc = JSON.parse(json);
    if (raster) await screenshotRasters(cdp, doc, fullPage);
    if (found.length) {
        doc.states = await captureStates(cdp, doc, found, raster, onProgress);
    }
    await cdp.evaluate(
        `['raster', 'state', 'tab', 'trigger', 'popover'].forEach((a) =>
            document.querySelectorAll('[data-l2f-' + a + ']').forEach((e) => e.removeAttribute('data-l2f-' + a)))`,
    );
    return doc;
}

const MAX_POPOVERS = 40;

async function retry(fn, timeout = 2000, interval = 200) {
    const end = Date.now() + timeout;
    for (;;) {
        const v = await fn();
        if (v || Date.now() >= end) return v;
        await sleep(interval);
    }
}
const settle = (cdp) => waitForStableDom(cdp, 4000, 300);

// `expand` opens scroll areas to their full height (tab panels); they stay
// open while rasters are screenshotted, then go back.
async function captureSubtree(cdp, doc, selector, prefix, raster, expand) {
    try {
        const json = await cdp.evaluate(
            `window.__layoutToFigma.captureSubtree(${JSON.stringify(selector)}, ${JSON.stringify(prefix)}, ${JSON.stringify({ raster, expand })}).then(JSON.stringify)`,
        );
        const sub = JSON.parse(json);
        if (!sub) return null;
        if (raster)
            await screenshotRasters(
                cdp,
                { rasters: sub.rasters, root: sub.node },
                expand,
            );
        Object.assign(doc.tokens.colors, sub.tokens);
        return sub.node;
    } finally {
        if (expand)
            await cdp.evaluate(`window.__layoutToFigma.restoreExpanded()`);
    }
}

async function click(cdp, { x, y }) {
    const base = { x, y, button: 'left', clickCount: 1 };
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await cdp.send('Input.dispatchMouseEvent', {
        ...base,
        type: 'mousePressed',
    });
    await cdp.send('Input.dispatchMouseEvent', {
        ...base,
        type: 'mouseReleased',
    });
}

async function pressEscape(cdp) {
    const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 };
    await cdp.send('Input.dispatchKeyEvent', { ...key, type: 'rawKeyDown' });
    await cdp.send('Input.dispatchKeyEvent', { ...key, type: 'keyUp' });
}

async function captureStates(cdp, doc, found, raster, onProgress) {
    const api = 'window.__layoutToFigma';
    const out = [];
    for (const st of found.filter((s) => s.kind === 'tabs')) {
        const original = Math.max(
            0,
            st.tabs.findIndex((t) => t.selected),
        );
        const options = [];
        for (let i = 0; i < st.tabs.length; i++) {
            onProgress(`${st.name}: ${st.tabs[i].label}`);
            await cdp.evaluate(
                `${api}.clickTab(${JSON.stringify(st.key)}, ${i})`,
            );
            await settle(cdp);
            const node = await captureSubtree(
                cdp,
                doc,
                `[data-l2f-state="${st.key}"]`,
                `${st.key}x${i}n`,
                raster,
                true,
            );
            if (node)
                options.push({
                    value: st.tabs[i].label,
                    selected: i === original,
                    node,
                });
        }
        await cdp.evaluate(
            `${api}.clickTab(${JSON.stringify(st.key)}, ${original})`,
        );
        await settle(cdp);
        if (options.length > 1)
            out.push({
                key: st.key,
                kind: 'tabs',
                name: st.name,
                property: 'Tab',
                options,
            });
    }
    for (const st of found
        .filter((s) => s.kind === 'popover')
        .slice(0, MAX_POPOVERS)) {
        onProgress(`menu: ${st.name}`);
        const key = JSON.stringify(st.key);
        // The previous popup's closing animation can still cover the
        // trigger or swallow the click, so give it a moment and retry.
        const at = await retry(() =>
            cdp.evaluate(`${api}.preparePopover(${key})`),
        );
        if (!at) continue;
        let opened = false;
        for (let attempt = 0; attempt < 2 && !opened; attempt++) {
            if (attempt && (await cdp.evaluate(`${api}.isExpanded(${key})`)))
                break;
            await click(cdp, at);
            await settle(cdp);
            opened = await retry(
                () => cdp.evaluate(`${api}.markPopover(${key})`),
                1000,
            );
        }
        let node = null;
        if (opened) {
            node = await captureSubtree(
                cdp,
                doc,
                `[data-l2f-popover="${st.key}"]`,
                `${st.key}n`,
                raster,
            );
        }
        await cdp.evaluate(`${api}.unmarkPopover()`);
        await pressEscape(cdp);
        await settle(cdp);
        // Some popovers ignore Escape; toggle them shut from the trigger.
        if (await cdp.evaluate(`${api}.isExpanded(${key})`)) {
            await click(cdp, at);
            await settle(cdp);
        }
        if (node)
            out.push({
                key: st.key,
                kind: 'popover',
                name: st.name,
                trigger: st.trigger,
                node,
            });
    }
    return out;
}

export function fileName(doc, used = new Set()) {
    const u = new URL(doc.source.url);
    const route =
        (u.pathname + u.hash)
            .replace(/^[/#]+|[/#]+$/g, '')
            .replace(/[^\w-]+/g, '-') || 'index';
    let base = `${route}-${doc.viewport.width}x${doc.viewport.height}-${doc.theme.toLowerCase()}`;
    let name = base;
    for (let i = 2; used.has(name); i++) name = `${base}-${i}`;
    used.add(name);
    return `${name}.figma-layout.json`;
}

/* -------------------------------------------------------------------- */
/* Server for the Figma plugin                                          */
/* -------------------------------------------------------------------- */

const metaCache = new Map();

function listCaptures(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.figma-layout.json'))
        .map((f) => {
            const stat = fs.statSync(path.join(dir, f));
            const cached = metaCache.get(f);
            if (cached && cached.mtimeMs === stat.mtimeMs) return cached;
            let meta = {};
            try {
                const doc = JSON.parse(
                    fs.readFileSync(path.join(dir, f), 'utf8'),
                );
                meta = {
                    title: doc.root.name,
                    url: doc.source.url,
                    theme: doc.theme,
                    width: doc.viewport.width,
                    height: doc.viewport.height,
                    capturedAt: doc.source.capturedAt,
                };
            } catch {
                return null;
            }
            const entry = {
                name: f,
                size: stat.size,
                mtimeMs: stat.mtimeMs,
                ...meta,
            };
            metaCache.set(f, entry);
            return entry;
        })
        .filter(Boolean)
        .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

// Serves a captures folder to the Figma plugin's Live panel.
export function serveCaptures(dir, port) {
    const server = http.createServer((req, res) => {
        // The plugin UI runs in a sandboxed iframe with a null origin, and
        // Chrome's Private Network Access preflights requests to localhost.
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Methods', 'GET');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.statusCode = 204;
            res.end();
            return;
        }
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/captures') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(listCaptures(dir)));
            return;
        }
        const m = url.pathname.match(
            /^\/captures\/([^/]+\.figma-layout\.json)$/,
        );
        if (m) {
            const file = path.join(
                dir,
                path.basename(decodeURIComponent(m[1])),
            );
            if (fs.existsSync(file)) {
                res.setHeader('Content-Type', 'application/json');
                fs.createReadStream(file).pipe(res);
                return;
            }
        }
        res.statusCode = 404;
        res.end('not found');
    });
    return new Promise((resolve, reject) => {
        server.once('error', (e) =>
            reject(
                e.code === 'EADDRINUSE'
                    ? new Error(
                          `Port ${port} is in use. Is live capture already running?`,
                      )
                    : e,
            ),
        );
        server.listen(Number(port), '127.0.0.1', () => resolve(server));
    });
}
