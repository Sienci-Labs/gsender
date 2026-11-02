#!/usr/bin/env node
/*
 * Live capture: keeps a browser window (or a running Electron app) attached
 * and captures whatever it shows whenever you ask:
 *
 *   - press ⌥⇧F / Alt+Shift+F in the page, or click its floating button
 *   - press Enter in this terminal
 *
 * Captures are written to the output folder and served on
 * http://localhost:7777 so the Figma plugin's Live panel can pick them up.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { parseArgs } from 'node:util';
import {
    CDP,
    fileName,
    launchChrome,
    pageTarget,
    serializePage,
    serveCaptures,
    waitForStableDom,
} from './lib.mjs';

const HELP = `
Usage: node tools/figma-layout/capture/live.mjs [options] [url]

Opens the app in a Chrome window and captures it on demand: press Alt+Shift+F
(⌥⇧F) in the page, click the floating capture button, or press Enter here.
New captures show up in the Figma plugin's Live panel.

Options
      --url <url>          Page to open (default: http://localhost:5173/)
  -o, --out <dir>          Output directory (default: ./figma-captures)
  -w, --width <px>         Window width (default: 1440)
  -h, --height <px>        Window height (default: 900)
      --serve-port <port>  Port the Figma plugin polls (default: 7777)
      --setup <js>         JavaScript to run once the page has loaded
      --no-states          Capture only what's on screen; don't click through
                           tabs or open menus to record their other states
      --states-in <css>    Only break out tabs/menus inside elements matching
                           this selector (e.g. "main")
      --states-skip <css>  Don't break out tabs/menus inside elements matching
                           this selector (e.g. "header")
      --connect <port>     Attach to a running Chrome/Electron started with
                           --remote-debugging-port=<port> instead of opening
                           a window
      --target <text>      With --connect, the page whose URL/title has this text
      --chrome <path>      Chrome/Chromium executable
      --help               Show this help
`;

const { values: opts, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        url: { type: 'string', default: 'http://localhost:5173/' },
        out: { type: 'string', short: 'o', default: 'figma-captures' },
        width: { type: 'string', short: 'w', default: '1440' },
        height: { type: 'string', short: 'h', default: '900' },
        'serve-port': { type: 'string', default: '7777' },
        setup: { type: 'string' },
        'no-states': { type: 'boolean', default: false },
        'states-in': { type: 'string' },
        'states-skip': { type: 'string' },
        connect: { type: 'string' },
        target: { type: 'string' },
        chrome: { type: 'string' },
        help: { type: 'boolean', default: false },
    },
});

if (opts.help) {
    console.log(HELP);
    process.exit(0);
}

if (positionals[0]) opts.url = positionals[0];
const OUT = path.resolve(opts.out);
const BINDING = '__l2fCapture';

/* -------------------------------------------------------------------- */
/* In-page capture button + shortcut                                    */
/* -------------------------------------------------------------------- */

// Runs in the page (and again after every reload). Lives in a shadow root
// marked data-figma-ignore so neither the app's CSS nor the capture sees it.
const OVERLAY = `(() => {
    if (window.top !== window || window.__l2fOverlay) return;
    window.__l2fOverlay = true;
    const mount = () => {
        const host = document.createElement('div');
        host.setAttribute('data-figma-ignore', '');
        host.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;';
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = \`
            <style>
                button { all: unset; cursor: pointer; display: flex; align-items: center; gap: 6px;
                    padding: 6px 10px; border-radius: 999px; font: 600 12px system-ui, sans-serif;
                    color: #fff; background: rgba(20, 20, 20, .78); box-shadow: 0 2px 8px rgba(0,0,0,.25);
                    opacity: .55; transition: opacity .15s; }
                button:hover, button.busy { opacity: 1; }
                .toast { position: absolute; right: 0; bottom: 40px; white-space: nowrap;
                    padding: 6px 10px; border-radius: 6px; font: 12px system-ui, sans-serif;
                    color: #fff; background: rgba(20, 20, 20, .9); display: none; }
            </style>
            <div class="toast"></div>
            <button title="Capture for Figma (Alt+Shift+F)">◧ Capture</button>\`;
        const button = root.querySelector('button');
        const toast = root.querySelector('.toast');
        let timer;
        window.__l2fToast = (text, busy) => {
            button.classList.toggle('busy', !!busy);
            button.textContent = busy ? '◧ Capturing…' : '◧ Capture';
            toast.textContent = text;
            toast.style.display = text ? 'block' : 'none';
            clearTimeout(timer);
            if (text && !busy) timer = setTimeout(() => (toast.style.display = 'none'), 4000);
        };
        const fire = () => window.${BINDING} && window.${BINDING}('');
        // Dialogs and popovers close on a press outside them or on focus
        // moving away; keep the press to ourselves so whatever is open stays
        // open to be captured.
        for (const type of ['pointerdown', 'mousedown', 'touchstart'])
            button.addEventListener(type, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            fire();
        });
        window.addEventListener('keydown', (e) => {
            if (e.altKey && e.shiftKey && e.code === 'KeyF') {
                e.preventDefault();
                fire();
            }
        }, true);
        document.documentElement.appendChild(host);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();`;

/* -------------------------------------------------------------------- */
/* Capturing                                                            */
/* -------------------------------------------------------------------- */

let busy = false;

async function capture(cdp) {
    if (busy) return;
    busy = true;
    const toast = (text, isBusy = false) =>
        cdp
            .evaluate(
                `window.__l2fToast && window.__l2fToast(${JSON.stringify(text)}, ${isBusy})`,
            )
            .catch(() => {});
    try {
        await toast('Capturing…', true);
        const started = Date.now();
        const doc = await serializePage(cdp, {
            states: !opts['no-states'],
            statesIn: opts['states-in'],
            statesSkip: opts['states-skip'],
            onProgress: (text) => toast(`Capturing ${text}…`, true),
        });
        const stamp = new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '-')
            .slice(0, 15);
        const name = `${stamp}-${fileName(doc)}`;
        fs.writeFileSync(path.join(OUT, name), JSON.stringify(doc));
        const secs = ((Date.now() - started) / 1000).toFixed(1);
        console.log(`✔ ${name} (${secs}s)`);
        await toast('Saved. It will appear in the Figma plugin’s Live panel.');
    } catch (e) {
        console.error(`✖ Capture failed: ${e.message}`);
        await toast(`Capture failed: ${e.message}`);
    } finally {
        busy = false;
    }
}

/* -------------------------------------------------------------------- */

async function main() {
    fs.mkdirSync(OUT, { recursive: true });
    const server = await serveCaptures(OUT, opts['serve-port']);

    let browser = null;
    let port = opts.connect;
    if (!port) {
        browser = await launchChrome({
            chrome: opts.chrome,
            width: opts.width,
            height: opts.height,
            headful: true,
            app: opts.url,
        });
        port = browser.port;
    }
    const page = await pageTarget(port, opts.target);
    const cdp = await CDP.connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Runtime.addBinding', { name: BINDING });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: OVERLAY,
    });
    cdp.on('Runtime.bindingCalled', (e) => {
        if (e.name === BINDING) capture(cdp);
    });

    const shutdown = () => {
        server.close();
        cdp.close();
        if (browser) browser.close();
        process.exit(0);
    };
    cdp.ws.addEventListener('close', () => {
        console.log('\nWindow closed.');
        shutdown();
    });
    process.on('SIGINT', shutdown);

    await waitForStableDom(cdp);
    await cdp.evaluate(OVERLAY);
    if (opts.setup) {
        process.stdout.write('▶ Running setup… ');
        await cdp.evaluate(`(async () => { ${opts.setup} })()`);
        console.log('done');
    }

    console.log(`
● Live capture is on (${page.url}).
  Capture the current screen: ⌥⇧F / Alt+Shift+F in the page, the ◧ Capture
  button in its bottom-right corner, or Enter here. Ctrl+C or close the window to stop.
  Files: ${OUT}
  Figma: run Layout Importer; new captures appear in its Live panel
         (served from http://localhost:${opts['serve-port']}).
`);

    if (process.stdin.isTTY) {
        const rl = readline.createInterface({ input: process.stdin });
        rl.on('line', () => capture(cdp));
    }
}

main().catch((e) => {
    console.error(`\n${e.message}`);
    process.exit(1);
});
