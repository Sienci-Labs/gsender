#!/usr/bin/env node
/*
 * Capture one or more pages of a running web app into .figma-layout.json
 * files for the Layout Importer Figma plugin.
 *
 * No dependencies: it drives Chrome (or any Chromium/Electron app started
 * with --remote-debugging-port) over the DevTools protocol using Node's
 * built-in WebSocket. Run with --help for options.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
    CDP,
    fileName,
    launchChrome,
    pageTarget,
    serializePage,
    sleep,
    waitFor,
    waitForStableDom,
} from './lib.mjs';

const HELP = `
Usage: node tools/figma-layout/capture/cli.mjs [options] [url ...]

Captures each URL (default http://localhost:5173/) at the given viewport and
writes <out>/<name>.figma-layout.json. Import the files with the Figma plugin
in tools/figma-layout/figma-plugin.

Options
  -o, --out <dir>          Output directory (default: ./figma-captures)
  -w, --width <px>         Viewport width (default: 1440)
  -h, --height <px>        Viewport height (default: 900)
      --theme <light|dark|both>
                           Toggle the \`dark\` class on <html> before capture
                           (Tailwind darkMode: 'class'). "both" captures twice.
      --wait-for <css>     Wait until this selector exists (default: wait until
                           the DOM stops changing)
      --delay <ms>         Extra settle time after load (default: 1500)
      --eval <js>          JavaScript to run in the page before capturing, e.g.
                           to open a modal. May be async; repeatable (one per URL
                           in order, or a single one for all).
      --setup <js>         JavaScript to run on every page before --eval, e.g.
                           connecting to a machine. May be async.
      --full-page          Capture the full scroll height, not just the viewport
      --no-raster          Don't screenshot canvases/native widgets
      --no-states          Don't click through tabs or open menus/popovers to
                           capture their other states
      --states-in <css>    Only break out tabs/menus inside elements matching
                           this selector (e.g. "main")
      --states-skip <css>  Don't break out tabs/menus inside elements matching
                           this selector (e.g. "header")
      --connect <port>     Attach to an already-running Chrome/Electron started
                           with --remote-debugging-port=<port> instead of
                           launching Chrome. Captures the current page as-is
                           unless URLs are given.
      --target <text>      With --connect, pick the page whose URL/title contains
                           this text (default: first page)
      --chrome <path>      Chrome/Chromium executable (default: auto-detect)
      --headful            Show the browser window while capturing
      --help               Show this help

Examples
  # gSender dev server (yarn dev + yarn vite:dev), main screen and Config tab
  node tools/figma-layout/capture/cli.mjs http://localhost:5173/#/ http://localhost:5173/#/configuration

  # Both themes on a laptop-sized viewport
  node tools/figma-layout/capture/cli.mjs --theme both -w 1280 -h 800

  # The running Electron app, in whatever state you left it
  REMOTE_DEBUGGING_PORT=9222 yarn dev:electron     (then, separately)
  node tools/figma-layout/capture/cli.mjs --connect 9222
`;

const { values: opts, positionals: urls } = parseArgs({
    allowPositionals: true,
    options: {
        out: { type: 'string', short: 'o', default: 'figma-captures' },
        width: { type: 'string', short: 'w', default: '1440' },
        height: { type: 'string', short: 'h', default: '900' },
        theme: { type: 'string' },
        'wait-for': { type: 'string' },
        delay: { type: 'string', default: '1500' },
        eval: { type: 'string', multiple: true, default: [] },
        setup: { type: 'string' },
        'full-page': { type: 'boolean', default: false },
        'no-raster': { type: 'boolean', default: false },
        'no-states': { type: 'boolean', default: false },
        'states-in': { type: 'string' },
        'states-skip': { type: 'string' },
        connect: { type: 'string' },
        target: { type: 'string' },
        chrome: { type: 'string' },
        headful: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
});

if (opts.help) {
    console.log(HELP);
    process.exit(0);
}
if (typeof WebSocket === 'undefined') {
    console.error(
        `Node ${process.version} has no built-in WebSocket; use Node 22 or newer.`,
    );
    process.exit(1);
}

async function capturePage(cdp, { url, setup, theme }) {
    if (url) {
        const loaded = cdp.once('Page.loadEventFired', 60000);
        loaded.catch(() => {});
        const nav = await cdp.send('Page.navigate', { url });
        if (nav.errorText) throw new Error(`${url}: ${nav.errorText}`);
        // Hash-route changes are same-document navigations with no load event.
        if (nav.loaderId) await loaded;
    }
    if (opts['wait-for']) await waitFor(cdp, opts['wait-for']);
    else await waitForStableDom(cdp);
    if (theme) {
        await cdp.evaluate(
            `document.documentElement.classList.toggle('dark', ${theme === 'dark'})`,
        );
    }
    const scripts = [opts.setup, setup].filter(Boolean);
    for (const js of scripts) await cdp.evaluate(`(async () => { ${js} })()`);
    // Whatever the scripts triggered (connecting, opening a dialog) renders
    // asynchronously; let it settle again.
    if (scripts.length) await waitForStableDom(cdp);
    await sleep(Number(opts.delay));
    return serializePage(cdp, {
        fullPage: opts['full-page'],
        raster: !opts['no-raster'],
        states: !opts['no-states'],
        statesIn: opts['states-in'],
        statesSkip: opts['states-skip'],
    });
}

async function main() {
    const width = Number(opts.width);
    const height = Number(opts.height);
    const themes =
        opts.theme === 'both' ? ['light', 'dark'] : [opts.theme || null];
    const targets = urls.length
        ? urls
        : opts.connect
          ? [null]
          : ['http://localhost:5173/'];

    let browser = null;
    let port = opts.connect;
    if (!port) {
        browser = await launchChrome({
            chrome: opts.chrome,
            width: opts.width,
            height: opts.height,
            headful: opts.headful,
        });
        port = browser.port;
    }
    const page = await pageTarget(port, opts.target);
    const cdp = await CDP.connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    if (!opts.connect) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false,
        });
    }

    fs.mkdirSync(opts.out, { recursive: true });
    const used = new Set();
    try {
        for (let i = 0; i < targets.length; i++) {
            for (const theme of themes) {
                const url = targets[i];
                const setup =
                    opts.eval[i] ??
                    (opts.eval.length === 1 ? opts.eval[0] : undefined);
                process.stdout.write(
                    `• ${url || page.url}${theme ? ` [${theme}]` : ''} … `,
                );
                const doc = await capturePage(cdp, { url, setup, theme });
                const file = path.join(opts.out, fileName(doc, used));
                fs.writeFileSync(file, JSON.stringify(doc));
                const kb = Math.round(fs.statSync(file).size / 1024);
                console.log(
                    `${file} (${kb} KB, ${Object.keys(doc.tokens.colors).length} colour tokens)`,
                );
            }
        }
    } finally {
        cdp.close();
        if (browser) browser.close();
    }
}

main().catch((e) => {
    console.error(`\n${e.message}`);
    if (/ECONNREFUSED|ERR_CONNECTION_REFUSED|net::ERR/.test(e.message)) {
        console.error(
            'Is the app running? For gSender: `yarn dev` and `yarn vite:dev`.',
        );
    }
    process.exit(1);
});
