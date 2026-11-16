/*
 * Tests for the parts of the Layout → Figma tool that don't need a browser
 * or Figma: duplicate masking, prototype matching, Storybook state planning
 * and the launcher's argument building. Run with `yarn figma:test`.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { layoutSize } from '../capture/lib.mjs';
import {
    displayTitle,
    nameVariants,
    planVariations,
} from '../capture/variants.mjs';
import { buildArgs } from '../launcher/server.mjs';
import { syncPlugin } from '../sync-plugin.mjs';

const require = createRequire(import.meta.url);
const diff = require('../shared/diff.cjs');
const match = require('../shared/match.cjs');

/* ---------------------------------------------------------------- fixtures */

const white = { r: 1, g: 1, b: 1, a: 1 };
const blue = { r: 0, g: 0.4, b: 1, a: 1 };
const red = { r: 1, g: 0, b: 0, a: 1 };

const text = (characters, x, y) => ({
    type: 'TEXT',
    name: characters,
    x,
    y,
    w: 60,
    h: 16,
    characters,
    style: { families: ['Inter'], size: 14, weight: 400, color: white },
});
const button = (label, x, y, color = blue) => ({
    type: 'FRAME',
    name: 'Button',
    x,
    y,
    w: 100,
    h: 32,
    fills: [{ type: 'SOLID', color }],
    children: [text(label, x + 20, y + 8)],
});
const screen = (children, extra = {}) => ({
    format: 'layout-to-figma',
    layout: 'desktop',
    theme: 'Light',
    viewport: { width: 1440, height: 900 },
    source: { url: 'http://localhost:5173/#/', capturedAt: 'now' },
    tokens: { colors: {} },
    root: {
        type: 'FRAME',
        name: 'gSender #/',
        x: 0,
        y: 0,
        w: 1440,
        h: 900,
        fills: [{ type: 'SOLID', color: white }],
        children: [
            {
                type: 'FRAME',
                name: 'Toolbar',
                x: 0,
                y: 0,
                w: 1440,
                h: 60,
                children,
            },
        ],
    },
    ...extra,
});
const clone = (v) => JSON.parse(JSON.stringify(v));

/* ----------------------------------------------------------------- masking */

test('identical captures have no differences', () => {
    const a = screen([button('Home', 10, 10), button('Probe', 120, 10)]);
    assert.equal(diff.maskDoc(a, clone(a)), null);
});

test('a moved subtree keeps its signature; a recoloured one does not', () => {
    const a = button('Home', 10, 10);
    assert.equal(diff.signature(a), diff.signature(button('Home', 300, 200)));
    assert.notEqual(diff.signature(a), diff.signature(button('Home', 10, 10, red)));
    assert.notEqual(diff.signature(a), diff.signature(button('Park', 10, 10)));
});

test('only the changed component survives, in its place in the tree', () => {
    const base = screen([button('Home', 10, 10), button('Probe', 120, 10)]);
    const next = screen([button('Home', 10, 10), button('Probe', 120, 10, red)]);
    const masked = diff.maskDoc(base, next);
    assert.equal(masked.root.name, 'gSender #/ (changes)');
    assert.equal(masked.root.fills, undefined);
    const toolbar = masked.root.children[0];
    assert.equal(toolbar.name, 'Toolbar');
    assert.equal(toolbar.children.length, 1);
    assert.equal(toolbar.children[0].children[0].characters, 'Probe');
    assert.deepEqual(toolbar.children[0].fills[0].color, red);
    assert.equal(masked.mask.stats.changed, 2);
    // The capture that was compared is left as it was.
    assert.equal(next.root.children[0].children.length, 2);
    assert.ok(next.root.fills);
});

test('added and removed layers are counted; reordering is not a change', () => {
    const base = screen([button('Home', 10, 10), button('Probe', 120, 10)]);
    const reordered = screen([button('Probe', 10, 10), button('Home', 120, 10)]);
    assert.equal(diff.maskDoc(base, reordered), null);
    // Probe is gone and there is a new layer of another kind.
    const next = screen([button('Home', 10, 10), text('Parked', 230, 10)]);
    const masked = diff.maskDoc(base, next);
    assert.equal(masked.mask.stats.added, 1);
    assert.equal(masked.mask.stats.removed, 2);
    assert.equal(masked.root.children[0].children[0].characters, 'Parked');
});

test('tabs and menus: only states that changed are kept', () => {
    const tabs = (probeColor) => ({
        key: 't0',
        kind: 'tabs',
        name: 'Tools',
        property: 'Tab',
        options: [
            { value: 'Probe', selected: true, node: button('Probe', 0, 0, probeColor) },
            { value: 'Macros', node: button('Macros', 0, 0) },
        ],
    });
    const menu = { key: 'p0', kind: 'popover', name: 'Connect', node: button('COM4', 0, 0) };
    const kids = [button('Home', 10, 10)];
    const base = screen(kids, { states: [tabs(blue), menu] });
    const next = screen(clone(kids), { states: [tabs(red), clone(menu)] });
    const masked = diff.maskDoc(base, next);
    assert.equal(masked.states.length, 1);
    assert.deepEqual(masked.states[0].options.map((o) => o.value), ['Probe']);
    assert.equal(masked.mask.emptyRoot, true);
    assert.equal(masked.root.children.length, 0);
});

test('storybook: changed and new states are kept, unchanged ones dropped', () => {
    const sb = (variants) => ({
        format: 'layout-to-figma',
        kind: 'storybook',
        layout: 'desktop',
        source: { url: 'http://localhost:6006', capturedAt: 'now' },
        components: [
            { title: 'Components/Button', variants },
            {
                title: 'Components/Label',
                variants: [{ name: 'Story=Default', node: text('Label', 0, 0) }],
            },
        ],
    });
    const base = sb([
        { name: 'Story=Primary', node: button('Go', 0, 0) },
        { name: 'Story=Warning', node: button('Go', 0, 0, red) },
    ]);
    const next = sb([
        { name: 'Story=Primary', node: button('Go', 0, 0) },
        { name: 'Story=Warning', node: button('Stop', 0, 0, red) },
        { name: 'Story=Ghost', node: button('Go', 0, 0, white) },
    ]);
    const masked = diff.maskDoc(base, next);
    assert.deepEqual(masked.components.map((c) => c.title), ['Components/Button']);
    assert.deepEqual(
        masked.components[0].variants.map((v) => v.name),
        ['Story=Warning', 'Story=Ghost'],
    );
    assert.deepEqual(masked.mask.stats, { changed: 1, added: 1, removed: 0, unchanged: 2 });
    assert.throws(() => diff.maskDoc(base, screen([])), /Can't compare/);
});

test('pickBaseline prefers the same route, layout and theme', () => {
    const main = screen([]);
    const config = screen([]);
    config.source.url = 'http://localhost:5173/#/configuration';
    const pendant = screen([]);
    pendant.layout = 'pendant';
    const want = screen([]);
    want.source.url = 'http://127.0.0.1:5173/#/configuration';
    assert.equal(diff.pickBaseline([main, pendant, config], want), config);
    assert.equal(diff.pickBaseline([{ kind: 'storybook' }], want), null);
});

/* -------------------------------------------------------------- prototypes */

test('names match across capture suffixes and casing', () => {
    assert.equal(match.nameSimilarity('JogControl', 'jog control'), 1);
    assert.ok(
        match.nameSimilarity('Configuration', 'gSender #/configuration — 1440×900 Light') >= 0.75,
    );
    assert.ok(match.nameSimilarity('Probe', 'Macros') < 0.3);
});

test('screens pair up by route first, then by name, each used once', () => {
    const masters = [
        { name: 'Carve', url: 'http://localhost:5173/#/' },
        { name: 'Config', url: 'http://localhost:5173/#/configuration' },
        { name: 'Tools page' },
    ];
    const imports = [
        { name: 'gSender #/configuration — 1440×900 Dark', url: 'http://localhost:5173/#/configuration' },
        { name: 'gSender #/ — 1440×900 Dark', url: 'http://localhost:5173/#/' },
        { name: 'gSender #/tools — 1440×900 Dark', url: 'http://localhost:5173/#/tools' },
    ];
    const pairs = match.matchFrames(masters, imports);
    const got = Object.fromEntries(pairs.map((p) => [p.master, p.target]));
    assert.deepEqual(got, { 0: 1, 1: 0, 2: 2 });
});

test('a layer is matched by name and place in the tree, not name alone', () => {
    const target = { name: 'Button', path: ['Main', 'JobControl', 'Controls'], cx: 0.8, cy: 0.9, w: 0.05, h: 0.04 };
    const candidates = [
        { name: 'Button', path: ['Header', 'Connection'], cx: 0.1, cy: 0.03, w: 0.1, h: 0.04 },
        // An extra wrapper and a small shift, as in a fresh import
        { name: 'Button', path: ['Main', 'Column', 'JobControl', 'Controls'], cx: 0.81, cy: 0.88, w: 0.05, h: 0.04 },
        { name: 'Label', path: ['Main', 'JobControl', 'Controls'], cx: 0.8, cy: 0.9, w: 0.05, h: 0.04 },
    ];
    assert.equal(match.bestMatch(target, candidates), 1);
    assert.equal(
        match.bestMatch({ name: 'Nowhere', path: ['Other'], cx: 0.5, cy: 0.5 }, candidates),
        -1,
    );
});

/* --------------------------------------------------------------- storybook */

test('props are cycled in combination, app state one control at a time', () => {
    const plans = planVariations([
        { name: 'variant', target: null, values: ['primary', 'ghost'], current: 'primary' },
        { name: 'disabled', target: null, values: [true, false], current: null },
        { name: 'machinePreset', target: 'machine', values: ['idle', 'run', 'alarm'], current: 'idle' },
    ]);
    // 2×2 prop combinations (none equals the story: disabled is unset), then 2 presets
    assert.equal(plans.length, 6);
    assert.deepEqual(plans[0], { variant: 'primary', disabled: true });
    assert.deepEqual(plans.slice(-2), [{ machinePreset: 'run' }, { machinePreset: 'alarm' }]);
});

test('too many prop combinations fall back to one at a time', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const plans = planVariations([
        { name: 'variant', target: null, values: many, current: 'a' },
        { name: 'size', target: null, values: many, current: 'a' },
    ]);
    assert.equal(plans.length, 12);
    assert.ok(plans.every((p) => Object.keys(p).length === 1));
});

test('states are named by story plus only the controls that differ', () => {
    const component = {
        variants: [
            { story: 'Idle', base: true, controls: { machinePreset: 'idle', machineHasHomed: false } },
            { story: 'Idle', controls: { machinePreset: 'alarm', machineHasHomed: false } },
            { story: 'A, B=C', base: true, controls: { machinePreset: 'idle' } },
        ],
    };
    nameVariants(component, ['machinePreset', 'machineHasHomed'], new Set(['machineHasHomed']));
    assert.deepEqual(component.properties, ['Story', 'machinePreset']);
    assert.deepEqual(
        component.variants.map((v) => v.name),
        [
            'Story=Idle, machinePreset=idle',
            'Story=Idle, machinePreset=alarm',
            'Story=A- B-C, machinePreset=idle',
        ],
    );
    assert.equal(displayTitle('app/src/features/Jogging'), 'Features/Jogging');
    assert.equal(displayTitle('Pendant/Carve/StatusBadge'), 'Pendant/Carve/StatusBadge');
});

/* ------------------------------------------------------- layouts, launcher */

test('layouts have their own size and can be turned', () => {
    assert.deepEqual(layoutSize('android'), { width: 1280, height: 800 });
    assert.deepEqual(layoutSize('android', { orientation: 'portrait' }), { width: 800, height: 1280 });
    assert.deepEqual(layoutSize('pendant', { orientation: 'landscape' }), { width: 1280, height: 800 });
    assert.deepEqual(layoutSize('desktop', { width: '1280' }), { width: 1280, height: 900 });
});

test('the launcher builds start.mjs arguments from its options', () => {
    assert.deepEqual(buildArgs({}).args, ['--stamp']);
    assert.deepEqual(
        buildArgs({ mode: 'live', layout: 'android', orientation: 'portrait', machine: 'twin' }).args,
        ['--live', '--no-serve', '--android', '--portrait', '--machine', '127.0.0.1:23'],
    );
    assert.deepEqual(
        buildArgs({ mode: 'storybook', layout: 'all', theme: 'both', interaction: true, stories: ['Button', ' '] }).args,
        ['--storybook', '--layout', 'all', '--theme', 'both', '--stamp', '--controls', 'primary', '--interaction-states', '--stories', 'Button'],
    );
    assert.deepEqual(
        buildArgs({ states: 'header', machine: 'none', urls: ['http://localhost:5173/#/tools'], stamp: false }).args,
        ['--header-states', '--no-machine', 'http://localhost:5173/#/tools'],
    );
});

test('the launcher rejects what it cannot pass on safely', () => {
    assert.throws(() => buildArgs({ machine: '1.2.3.4; rm -rf' }), /host:port/);
    assert.throws(() => buildArgs({ urls: ['file:///etc/passwd'] }), /http/);
    assert.throws(() => buildArgs({ mode: 'storybook', stories: ['--chrome'] }), /story filter/);
    assert.throws(() => buildArgs({ layout: 'all' }), /one layout/);
    assert.throws(() => buildArgs({ width: '12' }), /Width/);
});

test('the plugin files carry the current shared code', () => {
    assert.deepEqual(syncPlugin({ check: true }), []);
});
