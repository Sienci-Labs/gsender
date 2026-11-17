#!/usr/bin/env node
/*
 * Captures a running Storybook into one .figma-layout.json file per layout.
 *
 * Where the screen capture drills into tabs and menus, this drills into
 * component states: every story of a component, plus the states its
 * Storybook controls can reach (each boolean and option-list control turned
 * to each of its values). The Figma plugin builds each component as a
 * component set with one variant per state, and a variant property per
 * control.
 *
 * Like the other capture scripts it has no dependencies: it drives Chrome
 * over the DevTools protocol and talks to Storybook's own preview API inside
 * the story iframe. Run with --help for options.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
    applyLayout,
    CDP,
    injectSerializer,
    LAYOUTS,
    launchChrome,
    layoutSize,
    pageTarget,
    screenshotRasters,
    sleep,
    stamp,
    waitForStableDom,
} from './lib.mjs';
import { displayTitle, nameVariants, planVariations } from './variants.mjs';

const { signature } = createRequire(import.meta.url)('../shared/diff.cjs');

const HELP = `
Usage: node tools/figma-layout/capture/storybook.mjs [options]

Captures every story of a running Storybook (yarn storybook), and the states
its controls can reach, into <out>/storybook-<layout>-….figma-layout.json.
Import the file with the Figma plugin in tools/figma-layout/figma-plugin:
each component becomes a component set with a variant per state.

Options
      --url <url>          Storybook to capture (default: http://localhost:6006)
  -o, --out <dir>          Output directory (default: ./figma-captures)
      --layout <name>      desktop, pendant, android or all. desktop takes the
                           app's stories; pendant and android take the
                           pendant's (src/pendant) at their own screen size.
                           Default: desktop and pendant, whichever have stories.
      --portrait, --landscape
                           Turn the pendant/android screen
  -w, --width <px>         Viewport width (default: the layout's)
  -h, --height <px>        Viewport height (default: the layout's)
      --theme <light|dark|both>
                           Toggle the \`dark\` class on <html> (default: leave
                           each story as it renders)
      --stories <text>     Only components whose title, id or file contains
                           this text. Repeatable.
      --controls <none|primary|all>
                           Which stories also get their controls cycled:
                           none, each component's first story (default), or
                           every story (slow).
      --interaction-states Also capture hover, focus and pressed for stories
                           that show a single button or input
      --max-variants <n>   Most states to keep per component (default: 60)
      --stamp              Put the time in the file name instead of
                           overwriting the previous capture
      --no-raster          Don't screenshot canvases/native widgets
      --chrome <path>      Chrome/Chromium executable (default: auto-detect)
      --headful            Show the browser window while capturing
      --help               Show this help
`;

const { values: opts } = parseArgs({
    options: {
        url: { type: 'string', default: 'http://localhost:6006' },
        out: { type: 'string', short: 'o', default: 'figma-captures' },
        layout: { type: 'string' },
        portrait: { type: 'boolean', default: false },
        landscape: { type: 'boolean', default: false },
        width: { type: 'string', short: 'w' },
        height: { type: 'string', short: 'h' },
        theme: { type: 'string' },
        stories: { type: 'string', multiple: true, default: [] },
        controls: { type: 'string', default: 'primary' },
        'interaction-states': { type: 'boolean', default: false },
        'max-variants': { type: 'string', default: '60' },
        stamp: { type: 'boolean', default: false },
        'no-raster': { type: 'boolean', default: false },
        chrome: { type: 'string' },
        headful: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
});

if (opts.help) {
    console.log(HELP);
    process.exit(0);
}
if (!['none', 'primary', 'all'].includes(opts.controls)) {
    console.error('--controls takes none, primary or all.');
    process.exit(1);
}
if (opts.layout && opts.layout !== 'all' && !LAYOUTS[opts.layout]) {
    console.error('--layout takes desktop, pendant, android or all.');
    process.exit(1);
}

const BASE = opts.url.replace(/\/+$/, '');
const MAX_VARIANTS = Number(opts['max-variants']) || 60;
const RENDER_TIMEOUT = 20000;
// Changing args re-renders in place; if nothing changed there is no render
// to wait for, so don't wait long.
const ARGS_TIMEOUT = 6000;
const COMPONENT_TIMEOUT = 3 * 60000;

/* -------------------------------------------------------------------- */
/* In the story iframe                                                  */
/* -------------------------------------------------------------------- */

// Wraps the bits of Storybook's preview API this needs. Everything returned
// to Node is plain JSON.
const IN_PAGE = `(() => {
    if (window.__l2fSb) return true;
    const ch = window.__STORYBOOK_ADDONS_CHANNEL__;
    const preview = window.__STORYBOOK_PREVIEW__;
    if (!ch || !preview) return false;
    const E = Object.assign(
        {
            STORY_RENDERED: 'storyRendered',
            STORY_ERRORED: 'storyErrored',
            STORY_THREW_EXCEPTION: 'storyThrewException',
            STORY_MISSING: 'storyMissing',
            PLAY_FUNCTION_THREW_EXCEPTION: 'playFunctionThrewException',
            SET_CURRENT_STORY: 'setCurrentStory',
            UPDATE_STORY_ARGS: 'updateStoryArgs',
            RESET_STORY_ARGS: 'resetStoryArgs',
        },
        window.__STORYBOOK_MODULE_CORE_EVENTS__ || {},
    );
    const SETTLED = ['finished', 'completed', 'errored', 'aborted'];
    const FAILED = [E.STORY_ERRORED, E.STORY_THREW_EXCEPTION, E.STORY_MISSING];

    // Resolves with the name of whichever event comes first.
    function first(events, timeout) {
        return new Promise((resolve) => {
            const handlers = events.map((e) => {
                const h = () => done(e);
                ch.on(e, h);
                return [e, h];
            });
            const timer = setTimeout(() => done('timeout'), timeout);
            function done(e) {
                clearTimeout(timer);
                handlers.forEach(([name, h]) => ch.off(name, h));
                resolve(e);
            }
        });
    }
    async function settled(storyId, timeout) {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
            const r = preview.currentRender;
            if (r && r.id === storyId && SETTLED.includes(r.phase)) return r.phase;
            await new Promise((r) => setTimeout(r, 50));
        }
        return 'timeout';
    }
    const errorShown = () => {
        const el = document.querySelector('.sb-errordisplay');
        if (!el || getComputedStyle(el).display === 'none') return null;
        const text = document.querySelector('#error-message');
        return ((text && text.textContent) || 'Story failed to render').trim().slice(0, 200);
    };

    const plain = (v) => {
        try { return JSON.parse(JSON.stringify(v === undefined ? null : v)); }
        catch { return null; }
    };
    const matches = (rule, name) =>
        !rule ? false
        : rule instanceof RegExp ? rule.test(name)
        : Array.isArray(rule) ? rule.includes(name)
        : false;

    // The values a control can be set to, when there are finitely many.
    function valuesOf(argType) {
        const c = argType.control;
        if (c === false || (c && c.disable) || (argType.table && argType.table.disable)) return null;
        const type = typeof c === 'string' ? c : c && c.type;
        const kind = argType.type && argType.type.name;
        if (type === 'boolean' || (!type && kind === 'boolean')) return [true, false];
        const options = argType.options || (c && c.options);
        if (['select', 'radio', 'inline-radio'].includes(type) && Array.isArray(options))
            return options.filter((o) => o === null || ['string', 'number', 'boolean'].includes(typeof o));
        return null;
    }

    window.__l2fSb = {
        // Waits for whichever story the page was opened on.
        async ready(storyId, timeout) {
            await preview.ready?.();
            const phase = await settled(storyId, timeout);
            return { phase, error: errorShown() };
        },
        async show(storyId, timeout) {
            const done = first([E.STORY_RENDERED, ...FAILED], timeout);
            ch.emit(E.SET_CURRENT_STORY, { storyId, viewMode: 'story' });
            const event = await done;
            const phase = FAILED.includes(event) ? 'errored' : await settled(storyId, 5000);
            return { phase, event, error: errorShown() };
        },
        async setArgs(storyId, updatedArgs, timeout) {
            const done = first([E.STORY_RENDERED, ...FAILED], timeout);
            ch.emit(E.UPDATE_STORY_ARGS, { storyId, updatedArgs });
            const event = await done;
            const phase = FAILED.includes(event) ? 'errored' : await settled(storyId, 5000);
            return { phase, event, error: errorShown() };
        },
        async resetArgs(storyId, timeout) {
            const done = first([E.STORY_RENDERED, ...FAILED], timeout);
            ch.emit(E.RESET_STORY_ARGS, { storyId });
            await done;
            await settled(storyId, 5000);
            return true;
        },
        async describe(storyId) {
            const story = await preview.loadStory({ storyId });
            const controls = (story.parameters && story.parameters.controls) || {};
            const list = [];
            for (const [name, argType] of Object.entries(story.argTypes || {})) {
                if (matches(controls.exclude, name)) continue;
                if (controls.include && !matches(controls.include, name)) continue;
                const values = valuesOf(argType);
                if (!values || values.length < 2) continue;
                list.push({
                    name,
                    // Set for controls that drive app state rather than props
                    target: argType.target || null,
                    values,
                    current: plain(story.initialArgs[name]),
                });
            }
            const docs = (story.parameters && story.parameters.docs) || {};
            const c = story.component;
            return {
                // The React component the story shows, which the plugin
                // looks for in captured screens.
                component:
                    (c && (c.displayName || c.name ||
                        (c.render && (c.render.displayName || c.render.name)))) || null,
                args: plain(story.initialArgs),
                controls: list,
                description:
                    (docs.description && (docs.description.story || docs.description.component)) || '',
                hasPlay: !!story.playFunction,
            };
        },
        // Marks the story's one interactive element, if it has exactly one.
        markInteractive() {
            document.querySelectorAll('[data-l2f-interact]')
                .forEach((e) => e.removeAttribute('data-l2f-interact'));
            const found = [...document.querySelectorAll(
                'button, a[href], input, select, textarea, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"]',
            )].filter((el) => {
                if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
                if (el.closest('[data-figma-ignore]')) return false;
                const r = el.getBoundingClientRect();
                const cs = getComputedStyle(el);
                return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden';
            });
            // A control nested in another (an input in its label-button) is one control.
            const outer = found.filter((el) => !found.some((o) => o !== el && o.contains(el)));
            if (outer.length !== 1) return false;
            outer[0].setAttribute('data-l2f-interact', '');
            return true;
        },
    };
    return true;
})()`;

// A call into the page that the page never answers (it reloaded while the
// call was in flight) must fail rather than hang.
const CALL_TIMEOUT = 45000;
function answered(promise, what) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(
                () => reject(new Error(`page stopped responding (${what})`)),
                CALL_TIMEOUT,
            );
        }),
    ]).finally(() => clearTimeout(timer));
}

const call = (cdp, method, ...args) =>
    answered(
        cdp.evaluate(
            `window.__l2fSb.${method}(${args.map((a) => JSON.stringify(a)).join(', ')})`,
        ),
        method,
    );

// Vite's dev server reloads the page when a story file pulls in a
// dependency it hasn't bundled yet (the first capture after stories are
// added), which cuts off whatever was being captured. The reload fixes the
// cause, so capturing that component again works. After a reload the
// helpers this script put in the page are gone too, hence the last few.
const RELOADED =
    /navigated or closed|Timed out waiting for Page|context was destroyed|Cannot find context|Execution context|stopped responding|__l2fSb|__layoutToFigma|Cannot read properties of undefined \(reading '(ready|show|setArgs|resetArgs|describe|markInteractive|captureContent)'\)/i;

/* -------------------------------------------------------------------- */
/* Planning                                                             */
/* -------------------------------------------------------------------- */

const isPendantStory = (entry) => /(^|\/)src\/pendant\//.test(entry.importPath);

function wanted(entry) {
    if (!opts.stories.length) return true;
    const hay = `${entry.title} ${entry.id} ${entry.importPath}`.toLowerCase();
    return opts.stories.some((s) => hay.includes(s.toLowerCase()));
}

/* -------------------------------------------------------------------- */
/* Capturing                                                            */
/* -------------------------------------------------------------------- */

async function loadIndex() {
    let res;
    try {
        res = await fetch(`${BASE}/index.json`, {
            signal: AbortSignal.timeout(10000),
        });
    } catch {
        throw new Error(
            `No Storybook at ${BASE}. Start it with \`yarn storybook\`, or use \`yarn figma --storybook\`, which does.`,
        );
    }
    if (!res.ok) throw new Error(`${BASE}/index.json: HTTP ${res.status}`);
    const index = await res.json();
    const groups = new Map();
    for (const entry of Object.values(index.entries || {})) {
        if (entry.type !== 'story' || !wanted(entry)) continue;
        if (!groups.has(entry.title)) groups.set(entry.title, []);
        groups.get(entry.title).push(entry);
    }
    return [...groups.entries()].map(([title, stories]) => ({ title, stories }));
}

async function snapshot(cdp, doc, prefix, name) {
    await waitForStableDom(cdp, 4000, 300);
    const raster = !opts['no-raster'];
    const json = await answered(
        cdp.evaluate(
            `window.__layoutToFigma.captureContent(${JSON.stringify(prefix)}, ${JSON.stringify({ raster, name })}).then(JSON.stringify)`,
        ),
        'capture',
    );
    const sub = JSON.parse(json);
    if (!sub) return null;
    if (raster)
        await screenshotRasters(
            cdp,
            { rasters: sub.rasters, root: sub.node },
            true,
        );
    Object.assign(doc.tokens.colors, sub.tokens);
    if (!doc.theme) doc.theme = sub.theme;
    return sub.node;
}

// Forces :hover, :focus-visible and :active on the story's one control in
// turn. Returns [{ label, node }].
async function interactionStates(cdp, doc, prefix, name) {
    if (!(await call(cdp, 'markInteractive'))) return [];
    const out = [];
    try {
        const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
        const { nodeId } = await cdp.send('DOM.querySelector', {
            nodeId: root.nodeId,
            selector: '[data-l2f-interact]',
        });
        if (!nodeId) return [];
        for (const [label, pseudo] of [
            ['Hover', ['hover']],
            ['Focus', ['focus', 'focus-visible']],
            ['Pressed', ['hover', 'active']],
        ]) {
            await cdp.send('CSS.forcePseudoState', {
                nodeId,
                forcedPseudoClasses: pseudo,
            });
            // Colour transitions run for 150ms or so.
            await sleep(350);
            const node = await snapshot(cdp, doc, `${prefix}${label[0]}n`, name);
            if (node) out.push({ label, node });
        }
        await cdp.send('CSS.forcePseudoState', {
            nodeId,
            forcedPseudoClasses: [],
        });
    } catch (e) {
        console.warn(`    ! interaction states skipped: ${e.message}`);
    }
    return out;
}

async function openStory(cdp, storyId, theme) {
    const loaded = cdp.once('Page.loadEventFired', 60000);
    loaded.catch(() => {});
    const nav = await cdp.send('Page.navigate', {
        url: `${BASE}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`,
    });
    if (nav.errorText) throw new Error(`${BASE}: ${nav.errorText}`);
    await loaded;
    // The preview bundle defines its globals a moment after load.
    let ok = false;
    for (let i = 0; i < 100 && !ok; i++) {
        ok = await cdp.evaluate(IN_PAGE).catch(() => false);
        if (!ok) await sleep(200);
    }
    if (!ok) throw new Error('Storybook preview did not start.');
    const state = await call(cdp, 'ready', storyId, RENDER_TIMEOUT);
    await cdp.evaluate(
        `document.fonts && document.fonts.ready.then(() => true)`,
    );
    await injectSerializer(cdp);
    if (theme)
        await cdp.evaluate(
            `document.documentElement.classList.toggle('dark', ${theme === 'dark'})`,
        );
    return state;
}

async function captureComponent(cdp, doc, group, index, theme) {
    const title = displayTitle(group.title);
    const component = {
        id: group.stories[0].id.split('--')[0],
        title,
        importPath: group.stories[0].importPath,
        description: '',
        variants: [],
    };
    // Signature → the state that has it. A story is always kept, even when
    // it looks like a control state captured earlier (that state goes
    // instead); control states that look like anything else are dropped.
    const seen = new Map();
    const stats = { duplicates: 0, failed: [] };
    const controlNames = [];
    const booleans = new Set();
    const add = (variant) => {
        const sig = signature(variant.node);
        const twin = seen.get(sig);
        if (twin && !(variant.base && twin.base)) {
            stats.duplicates++;
            if (!variant.base) return;
            component.variants.splice(component.variants.indexOf(twin), 1);
        } else if (component.variants.length >= MAX_VARIANTS && !variant.base) {
            return;
        }
        seen.set(sig, variant);
        component.variants.push(variant);
    };

    for (let s = 0; s < group.stories.length; s++) {
        const entry = group.stories[s];
        const prefix = `c${index}s${s}`;
        const state =
            s === 0
                ? await openStory(cdp, entry.id, theme)
                : await call(cdp, 'show', entry.id, RENDER_TIMEOUT);
        if (state.error || state.phase === 'timeout') {
            stats.failed.push(
                `${entry.name}: ${state.error || 'timed out rendering'}`,
            );
            continue;
        }
        const info = await call(cdp, 'describe', entry.id);
        if (!component.description) component.description = info.description;
        if (!component.componentName && info.component)
            component.componentName = info.component;
        for (const c of info.controls) {
            if (!controlNames.includes(c.name)) controlNames.push(c.name);
            if (c.values.every((v) => typeof v === 'boolean'))
                booleans.add(c.name);
        }
        const base = Object.fromEntries(
            info.controls.map((c) => [c.name, c.current]),
        );
        const node = await snapshot(cdp, doc, `${prefix}n`, `${title} / ${entry.name}`);
        if (!node) {
            stats.failed.push(`${entry.name}: renders nothing visible`);
            continue;
        }
        add({
            story: entry.name,
            storyId: entry.id,
            base: true,
            controls: base,
            args: info.args,
            node,
        });

        const cycle =
            opts.controls === 'all' || (opts.controls === 'primary' && s === 0);
        if (!cycle) continue;

        if (opts['interaction-states']) {
            for (const st of await interactionStates(cdp, doc, prefix, `${title} / ${entry.name}`))
                add({
                    story: entry.name,
                    storyId: entry.id,
                    controls: base,
                    interaction: st.label,
                    args: info.args,
                    node: st.node,
                });
        }

        const plans = planVariations(info.controls);
        for (let v = 0; v < plans.length; v++) {
            if (component.variants.length >= MAX_VARIANTS) break;
            const res = await call(cdp, 'setArgs', entry.id, plans[v], ARGS_TIMEOUT);
            if (!res.error) {
                const varied = await snapshot(
                    cdp,
                    doc,
                    `${prefix}v${v}n`,
                    `${title} / ${entry.name}`,
                );
                if (varied)
                    add({
                        story: entry.name,
                        storyId: entry.id,
                        controls: { ...base, ...plans[v] },
                        args: { ...info.args, ...plans[v] },
                        node: varied,
                    });
            }
            // The next plan starts from the story's own args again.
            await call(cdp, 'resetArgs', entry.id, ARGS_TIMEOUT);
        }
    }

    nameVariants(component, controlNames, booleans);
    return { component, stats };
}

async function captureLayout(layout, groups, theme) {
    const size = layoutSize(layout, {
        width: opts.width,
        height: opts.height,
        orientation: opts.portrait
            ? 'portrait'
            : opts.landscape
              ? 'landscape'
              : undefined,
    });
    const browser = await launchChrome({
        chrome: opts.chrome,
        width: size.width,
        height: size.height,
        headful: opts.headful,
    });
    const doc = {
        format: 'layout-to-figma',
        version: 1,
        kind: 'storybook',
        layout,
        source: {
            url: BASE,
            title: 'Storybook',
            capturedAt: new Date().toISOString(),
        },
        viewport: { ...size, devicePixelRatio: 1 },
        theme: theme ? theme[0].toUpperCase() + theme.slice(1) : '',
        tokens: { colors: {} },
        components: [],
    };
    const failures = [];
    let cdp;
    try {
        const page = await pageTarget(browser.port);
        cdp = await CDP.connect(page.webSocketDebuggerUrl);
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            ...size,
            deviceScaleFactor: 1,
            mobile: false,
        });
        await applyLayout(cdp, layout);
        for (let i = 0; i < groups.length; i++) {
            const title = displayTitle(groups[i].title);
            process.stdout.write(`  ${title} … `);
            try {
                // A story that never settles must not hold up the rest.
                const attempt = () => {
                    let timer;
                    return Promise.race([
                        captureComponent(cdp, doc, groups[i], i, theme),
                        new Promise((_, reject) => {
                            timer = setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            `gave up after ${COMPONENT_TIMEOUT / 60000} minutes`,
                                        ),
                                    ),
                                COMPONENT_TIMEOUT,
                            );
                        }),
                    ]).finally(() => clearTimeout(timer));
                };
                let result;
                for (let tries = 0; ; tries++) {
                    try {
                        result = await attempt();
                        break;
                    } catch (e) {
                        if (tries >= 2 || !RELOADED.test(e.message)) throw e;
                        process.stdout.write('(page reloaded, again) ');
                        // Let the reload finish before navigating again.
                        await sleep(3000);
                    }
                }
                const { component, stats } = result;
                if (component.variants.length) doc.components.push(component);
                const stories = new Set(component.variants.map((v) => v.story));
                console.log(
                    `${component.variants.length} state(s) from ${stories.size} stor${stories.size === 1 ? 'y' : 'ies'}` +
                        (component.properties.length > 1
                            ? `, by ${component.properties.slice(1).join(', ')}`
                            : '') +
                        (stats.duplicates
                            ? ` (${stats.duplicates} identical skipped)`
                            : ''),
                );
                for (const f of stats.failed) {
                    console.log(`    ! ${f}`);
                    failures.push(`${title} / ${f}`);
                }
            } catch (e) {
                console.log(`failed: ${e.message}`);
                failures.push(`${title}: ${e.message}`);
            }
        }
    } finally {
        if (cdp) cdp.close();
        browser.close();
    }
    if (!doc.theme) doc.theme = 'Light';
    return { doc, failures };
}

async function main() {
    const groups = await loadIndex();
    if (!groups.length)
        throw new Error(
            opts.stories.length
                ? `No stories match ${opts.stories.map((s) => `"${s}"`).join(', ')}.`
                : `${BASE} has no stories.`,
        );
    const desktop = groups.filter((g) => !isPendantStory(g.stories[0]));
    const pendant = groups.filter((g) => isPendantStory(g.stories[0]));
    const requested =
        opts.layout === 'all'
            ? ['desktop', 'pendant', 'android']
            : opts.layout
              ? [opts.layout]
              : ['desktop', 'pendant'];
    const themes = opts.theme === 'both' ? ['light', 'dark'] : [opts.theme || null];

    fs.mkdirSync(opts.out, { recursive: true });
    let written = 0;
    const allFailures = [];
    for (const layout of requested) {
        const set = layout === 'desktop' ? desktop : pendant;
        if (!set.length) {
            if (opts.layout)
                console.log(
                    `• ${LAYOUTS[layout].label}: no ${layout === 'desktop' ? 'app' : 'pendant (src/pendant)'} stories${opts.stories.length ? ' match' : ''}.`,
                );
            continue;
        }
        for (const theme of themes) {
            console.log(
                `• ${LAYOUTS[layout].label}${theme ? ` [${theme}]` : ''}: ${set.length} component(s)`,
            );
            const { doc, failures } = await captureLayout(layout, set, theme);
            allFailures.push(...failures);
            if (!doc.components.length) continue;
            const base = `storybook-${layout}-${doc.viewport.width}x${doc.viewport.height}-${doc.theme.toLowerCase()}`;
            const file = path.join(
                opts.out,
                `${opts.stamp ? `${stamp()}-` : ''}${base}.figma-layout.json`,
            );
            fs.writeFileSync(file, JSON.stringify(doc));
            const states = doc.components.reduce(
                (n, c) => n + c.variants.length,
                0,
            );
            const mb = (fs.statSync(file).size / 1048576).toFixed(1);
            console.log(
                `  → ${file} (${doc.components.length} components, ${states} states, ${mb} MB)`,
            );
            written++;
        }
    }
    if (allFailures.length)
        console.log(
            `\n${allFailures.length} stor${allFailures.length === 1 ? 'y' : 'ies'} could not be captured (listed above).`,
        );
    if (!written) throw new Error('Nothing was captured.');
}

main().catch((e) => {
    console.error(`\n${e.message}`);
    process.exit(1);
});
