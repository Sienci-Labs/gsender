/*
 * Layout Importer — rebuilds a .figma-layout.json capture (see
 * ../capture/serialize.js) as Figma frames, text, vectors and images.
 * Storybook captures (../capture/storybook.mjs) become component sets, and
 * imported screens can be wired up to follow a master prototype.
 */
figma.showUI(__html__, { width: 340, height: 720, themeColors: true });
figma.clientStorage.getAsync('options').then((options) => {
    if (options) figma.ui.postMessage({ type: 'options', options });
});
const LAYOUT_LABELS = { desktop: 'Desktop', pendant: 'Pendant', android: 'Android' };
// Desktop captures keep the name they always had.
function layoutLabel(doc) {
    return doc.layout && doc.layout !== 'desktop'
        ? `${LAYOUT_LABELS[doc.layout] || doc.layout} `
        : '';
}

const COLLECTION_NAME = 'Tailwind colors';
const FALLBACK_FONT = { family: 'Inter', style: 'Regular' };

// The monospace font that goes with a font override, as in the design docs
// (Inter with Inconsolata for the DRO and console).
const MONO_OVERRIDE = { Inter: 'Inconsolata' };

// Fonts Figma ships, whose widths it measures correctly.
const BUNDLED_FONTS = ['Inter', 'Inconsolata'];

// CSS generic / system families → families people actually have in Figma.
const FAMILY_ALIASES = {
    'ui-sans-serif': ['SF Pro Text', 'SF Pro', 'Segoe UI', 'Roboto', 'Inter'],
    'system-ui': ['SF Pro Text', 'SF Pro', 'Segoe UI', 'Roboto', 'Inter'],
    '-apple-system': ['SF Pro Text', 'SF Pro', 'Inter'],
    blinkmacsystemfont: ['SF Pro Text', 'SF Pro', 'Inter'],
    'sans-serif': ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial'],
    'ui-monospace': [
        'SF Mono',
        'Menlo',
        'Roboto Mono',
        'JetBrains Mono',
        'Courier New',
    ],
    monospace: ['SF Mono', 'Menlo', 'Roboto Mono', 'Courier New'],
    'ui-serif': ['New York', 'Georgia', 'Times New Roman'],
    serif: ['Georgia', 'Times New Roman'],
};

// macOS sets the system font's optical size from the font size: the Text
// design up to 19px, the narrower Display design from 20px.
const SF_DISPLAY_SIZE = 20;

// CoreText tightens or loosens SF by size (track 0 of the font's 'trak'
// table, in 1/2048 em). Figma doesn't, so apply it as letter spacing.
const SF_TRACKING = [
    [6, 82], [9, 38], [10, 24], [11, 12], [12, 0], [13, -12], [14, -22],
    [15, -32], [16, -40], [17, -52], [20, -46], [22, -24], [24, 6], [28, 28],
    [32, 26], [36, 21], [50, 14], [64, 7], [80, 0],
];

function sfTracking(size) {
    const t = SF_TRACKING;
    if (size <= t[0][0]) return (t[0][1] / 2048) * size;
    for (let i = 1; i < t.length; i++) {
        if (size <= t[i][0]) {
            const [s0, v0] = t[i - 1];
            const [s1, v1] = t[i];
            const v = v0 + ((v1 - v0) * (size - s0)) / (s1 - s0);
            return (v / 2048) * size;
        }
    }
    return 0;
}

// Dev Mode is read-only: a plugin can open there but can't create layers.
const DEV_MODE_TEXT =
    'Figma is in Dev Mode, which is read-only, so nothing can be imported. Switch to Design Mode (Shift+D, or the Dev Mode toggle in the toolbar), then run Layout Importer again.';
if (figma.editorType === 'dev') figma.ui.postMessage({ type: 'error', text: DEV_MODE_TEXT });

figma.ui.onmessage = async (msg) => {
    if (figma.editorType === 'dev' && msg.type !== 'save-options') {
        figma.ui.postMessage({ type: 'error', text: DEV_MODE_TEXT });
        return;
    }
    if (msg.type === 'save-options') {
        await figma.clientStorage.setAsync('options', msg.options);
        return;
    }
    if (msg.type === 'mark-master' || msg.type === 'clear-master') {
        figma.root.setPluginData(
            MASTER_KEY,
            msg.type === 'mark-master' ? figma.currentPage.id : '',
        );
        await postMaster();
        return;
    }
    if (msg.type === 'link-now') {
        try {
            const picked = screensOf(figma.currentPage).filter((n) =>
                figma.currentPage.selection.some(
                    (sel) => sel === n || isInside(sel, n),
                ),
            );
            const master = await masterPage();
            if (!picked.length && master === figma.currentPage)
                throw new Error(
                    'This page is the master. Select the screens on it to link, or switch to the page with your imports.',
                );
            const targets = picked.length
                ? picked
                : screensOf(figma.currentPage);
            if (!targets.length)
                throw new Error('There are no screens on this page to link.');
            progress('Linking to the master prototype…');
            const linked = await linkToMaster(targets);
            figma.ui.postMessage({ type: 'done', text: linkSummary(linked) });
        } catch (e) {
            console.error(e);
            figma.ui.postMessage({
                type: 'error',
                text: String((e && e.message) || e),
            });
        }
        return;
    }
    if (msg.type === 'attach-states') {
        try {
            const page = figma.currentPage;
            const all = capturedScreens(page);
            const picked = all.filter((n) =>
                page.selection.some((sel) => sel === n || isInside(sel, n)),
            );
            const targets = picked.length ? picked : all;
            if (!targets.length)
                throw new Error(
                    'There are no captured screens on this page. Import a Screens or Live capture first.',
                );
            const r = await attachStoryStates(targets);
            if (r.sections.length) {
                page.selection = r.sections;
                figma.viewport.scrollAndZoomIntoView(r.sections);
            }
            figma.ui.postMessage({ type: 'done', text: storySummary(r) });
        } catch (e) {
            console.error(e);
            figma.ui.postMessage({
                type: 'error',
                text: String((e && e.message) || e),
            });
        }
        return;
    }
    if (msg.type === 'make-playground') {
        try {
            const page = figma.currentPage;
            const all = capturedScreens(page);
            const picked = all.filter((n) =>
                page.selection.some((sel) => sel === n || isInside(sel, n)),
            );
            const targets = picked.length ? picked : all;
            const repaired = await repairModeBars();
            if (!targets.length && repaired) {
                figma.ui.postMessage({ type: 'done', text: `Machine state bar fixed: ${repaired} button links. Select the playground screen and press Present (⌥⌘↵).` });
                return;
            }
            if (!targets.length)
                throw new Error(
                    'There are no captured screens on this page. Open the page with your imported screens (or import one), then try again.',
                );
            const { placed, results } = await playgroundize(targets, []);
            figma.currentPage.selection = placed;
            figma.viewport.scrollAndZoomIntoView(placed);
            reportSettled();
            figma.ui.postMessage({ type: 'done', text: playgroundSummary(results).trim() });
        } catch (e) {
            console.error(e);
            figma.ui.postMessage({ type: 'error', text: String((e && e.message) || e) });
        }
        return;
    }
    if (msg.type !== 'import') return;
    try {
        // Storybook first, so the screens in the same batch can use it.
        msg.docs = msg.docs
            .filter((d) => d.kind === 'storybook')
            .concat(msg.docs.filter((d) => d.kind !== 'storybook'))
            .reduce((all, d) => all.concat(expandModes(d)), []);
        const created = [];
        const screens = [];
        const texts = [];
        const fontsUsed = {};
        let components = 0;
        let variants = 0;
        sharedTabs.clear();
        sharedPopovers.clear();
        // Playground mode builds on its own page; see placePlayground.
        const play = !!msg.options.playground;
        const partsSections = [];
        if (play) {
            const page = await pageNamed(PLAYGROUND_PAGE);
            if (figma.currentPage !== page) await figma.setCurrentPageAsync(page);
        }
        let x = nextFreeX();
        for (let i = 0; i < msg.docs.length; i++) {
            const doc = msg.docs[i];
            if (doc.kind === 'storybook') {
                progress(
                    `Importing ${i + 1}/${msg.docs.length}: Storybook (${doc.components.length} components)`,
                );
                const section = await importStorybook(
                    doc,
                    msg.options,
                    texts,
                    fontsUsed,
                );
                section.x = x;
                section.y = 0;
                x += section.width + 200;
                if (play) partsSections.push(section);
                else created.push(section);
                components += doc.components.length;
                variants += doc.components.reduce(
                    (n, c) => n + c.variants.length,
                    0,
                );
                continue;
            }
            progress(`Importing ${i + 1}/${msg.docs.length}: ${doc.root.name}`);
            const { frame, section } = await importDoc(
                doc,
                play ? Object.assign({}, msg.options, { states: true }) : msg.options,
                texts,
                fontsUsed,
            );
            progress(`Finishing ${doc.root.name}${doc.modeLabel ? ` · ${doc.modeLabel}` : ''}…`);
            frame.x = x;
            frame.y = 0;
            x += frame.width + 200;
            created.push(frame);
            screens.push(frame);
            if (section) {
                section.x = x - 100;
                section.y = 0;
                x += section.width + 200;
                created.push(section);
            }
        }
        progress('Laying out text…');
        const laidOut = await refreshText(created);
        const tally = {};
        for (const t of laidOut) {
            const f = t.fontName;
            const k = f === figma.mixed ? 'mixed' : `${f.family} ${f.style}`;
            tally[k] = (tally[k] || 0) + 1;
        }
        // After everything is built, so links can point at any new screen.
        let linked = '';
        if (msg.options.linkProto && screens.length) {
            try {
                if (await masterPage()) {
                    progress('Linking to the master prototype…');
                    linked = ` ${linkSummary(await linkToMaster(screens))}`;
                }
            } catch (e) {
                console.error(e);
                linked = ` Not linked to the master: ${(e && e.message) || e}`;
            }
        }
        // A new Storybook capture applies to every screen on the page; new
        // screens use whatever Storybook capture the file already has.
        let stories = '';
        if (play) {
            // New screens, and (with a new Storybook capture) the playgrounds
            // already in the file, so their components can be swapped in.
            const targets = screens.concat(
                components ? playgroundScreens().filter((f) => !screens.includes(f)) : [],
            );
            const { placed, results } = await playgroundize(targets, partsSections);
            created.splice(0, created.length, ...placed);
            if (!targets.length && partsSections.length) {
                stories = ` The Storybook components are on the "${PARTS_PAGE}" page. To use them, import screens with the playground on, or open the page with your screens and click "Make playground from this page".`;
                const parts = figma.root.children.find((p) => p.name === PARTS_PAGE);
                if (parts && figma.currentPage !== parts) await figma.setCurrentPageAsync(parts);
                created.splice(0, created.length, ...partsSections);
            } else stories = playgroundSummary(results);
        } else if (msg.options.storyStates !== false) {
            const targets = components
                ? capturedScreens(figma.currentPage)
                : screens;
            if (targets.length) {
                try {
                    progress('Placing Storybook states…');
                    const r = await attachStoryStates(targets);
                    created.push(...r.sections);
                    if (r.sets) stories = ` ${storySummary(r)}`;
                } catch (e) {
                    console.error(e);
                    stories = ` Storybook states not placed: ${(e && e.message) || e}`;
                }
            }
        }
        figma.currentPage.selection = created;
        figma.viewport.scrollAndZoomIntoView(created);
        const screenDocs = msg.docs.filter((d) => d.kind !== 'storybook');
        const tabs = screenDocs.reduce(
            (n, d) =>
                n + (d.states || []).filter((st) => st.kind === 'tabs').length,
            0,
        );
        const pops = screenDocs.reduce(
            (n, d) =>
                n +
                (d.states || []).filter((st) => st.kind === 'popover').length,
            0,
        );
        const parts = [];
        if (screens.length) parts.push(`${screens.length} screen(s)`);
        if (components)
            parts.push(
                `${components} Storybook component(s) with ${variants} state(s)`,
            );
        parts.push(`${texts.length} text layers`);
        if (msg.options.states !== false && (tabs || pops))
            parts.push(
                `${tabs} tab group(s) and ${pops} menu(s)/popover(s) as components`,
            );
        const fonts = Object.keys(tally)
            .sort((a, b) => tally[b] - tally[a])
            .map((k) => `${k} ×${tally[k]}`)
            .join(', ');
        reportSettled();
        figma.ui.postMessage({
            type: 'done',
            text: `${msg.note ? `${msg.note} ` : ''}Imported ${parts.join(', ')}.${linked}${stories}${fonts ? ` Fonts: ${fonts}.` : ''}${failedFonts.length ? ` Couldn't load: ${failedFonts.splice(0).join(', ')}.` : ''}`,
        });
    } catch (e) {
        console.error(e);
        figma.ui.postMessage({
            type: 'error',
            text: String((e && e.message) || e),
        });
    }
};

function progress(text) {
    figma.ui.postMessage({ type: 'progress', text });
}

// After an import Figma goes on drawing and saving what was made, and the
// plugin's timers fire late while it does. Once a few in a row are on time
// it has caught up; the UI says so.
function reportSettled() {
    let calm = 0;
    let last = Date.now();
    const started = last;
    const tick = () => {
        const now = Date.now();
        calm = now - last < 400 ? calm + 1 : 0;
        last = now;
        if (calm >= 4 || now - started > 10 * 60000) figma.ui.postMessage({ type: 'settled' });
        else setTimeout(tick, 250);
    };
    setTimeout(tick, 250);
}

function nextFreeX() {
    let right = 0;
    for (const n of figma.currentPage.children)
        right = Math.max(right, n.x + n.width);
    return figma.currentPage.children.length ? right + 200 : 0;
}

/* -------------------------------------------------------------------- */
/* Import                                                               */
/* -------------------------------------------------------------------- */

async function importDoc(doc, options, texts, fontsUsed) {
    const prep = (n) => (options.simplify ? simplify(n, true) : n);
    const root = prep(doc.root);
    const states = options.states === false ? [] : doc.states || [];
    const stateRoots = [];
    for (const st of states) {
        if (st.kind === 'tabs' || st.kind === 'sections') {
            // Shared with an earlier machine state: nothing to build.
            if (st.sameAs) continue;
            for (const o of st.options) {
                o.node = prep(o.node);
                stateRoots.push(o.node);
            }
        } else {
            if (st.sameAs) continue;
            st.node = prep(st.node);
            stateRoots.push(st.node);
        }
    }
    const roots = [root].concat(stateRoots);
    const state = {
        options,
        doc,
        total: roots.reduce((n, r) => n + countNodes(r), 0),
        done: 0,
        fonts: await prepareFonts(roots, options.font, fontsUsed),
        texts,
        colorVars: options.variables ? await colorVariables(doc) : null,
        imageHashes: {},
        stateNodes: {},
        built: { tabs: [], popovers: [] },
    };
    const frame = await build(root, state);
    frame.name = `${doc.root.name} — ${layoutLabel(doc)}${doc.viewport.width}×${doc.viewport.height} ${doc.theme}`;
    frame.setPluginData('sourceUrl', doc.source.url);
    frame.setPluginData('layout', doc.layout || 'desktop');
    frame.setPluginData('capturedAt', doc.source.capturedAt);
    frame.setPluginData('theme', doc.theme || '');
    if (doc.mode) {
        frame.name += ` · ${doc.modeLabel}`;
        frame.setPluginData('mode', doc.mode);
        frame.setPluginData('modeLabel', doc.modeLabel);
        frame.setPluginData('modeGroup', doc.modeGroup);
        frame.setPluginData('modeOrder', String(doc.modeOrder));
    }
    const section = states.length
        ? await buildStates(states, frame, state)
        : null;
    if (section) {
        section.setPluginData('statesFor', frame.id);
        frame.setPluginData('statesSection', section.id);
    }
    if (state.sharedPopovers) frame.setPluginData('sharedPopovers', JSON.stringify(state.sharedPopovers));
    if (state.colorVars) {
        for (const n of section ? [frame, section] : [frame]) {
            try {
                n.setExplicitVariableModeForCollection(
                    state.colorVars.collection,
                    state.colorVars.modeId,
                );
            } catch (e) {
                console.warn('variable mode not set', e);
            }
        }
    }
    return { frame, section, built: state.built };
}

/* -------------------------------------------------------------------- */
/* Storybook                                                            */
/* -------------------------------------------------------------------- */

const SET_GAP = 120;
const SET_COLUMN_HEIGHT = 6000;
const SET_MAX_WIDTH = 2400;

// A Storybook capture holds components rather than a screen. Each becomes a
// component set with one variant per story or control state; the variant
// properties are `Story` plus each control the states differ in, so the
// state can be picked from an instance's properties like a tab can.
async function importStorybook(doc, options, texts, fontsUsed) {
    const roots = [];
    for (const comp of doc.components) {
        for (const v of comp.variants) {
            if (options.simplify) v.node = simplify(v.node, true);
            roots.push(v.node);
        }
    }
    const state = {
        options,
        doc,
        total: roots.reduce((n, r) => n + countNodes(r), 0),
        done: 0,
        fonts: await prepareFonts(roots, options.font, fontsUsed),
        texts,
        colorVars: options.variables ? await colorVariables(doc) : null,
        imageHashes: {},
        stateNodes: {},
    };
    await storyFonts();
    const section = figma.createSection();
    section.name = `Storybook — ${layoutLabel(doc)}${doc.viewport.width}×${doc.viewport.height} ${doc.theme}${doc.mask ? ' (changes)' : ''}`;
    section.setPluginData('layout', doc.layout || 'desktop');
    section.setPluginData('capturedAt', doc.source.capturedAt);
    section.setPluginData('theme', doc.theme || '');
    let x = SECTION_PADDING;
    let y = SECTION_PADDING;
    let columnWidth = 0;
    let bottom = SECTION_PADDING;
    for (const comp of doc.components) {
        progress(`Building ${comp.title} (${comp.variants.length} states)…`);
        const variants = [];
        for (const v of comp.variants) {
            const built = await build(v.node, state);
            const c = figma.createComponentFromNode(built);
            c.name = v.name;
            if (v.storyId) c.setPluginData('storyId', v.storyId);
            if (v.args) c.setPluginData('args', JSON.stringify(v.args));
            variants.push(c);
        }
        const set = figma.combineAsVariants(variants, section);
        set.name = comp.title;
        if (comp.description) set.description = comp.description;
        if (comp.importPath) set.setPluginData('storyFile', comp.importPath);
        set.setPluginData('storyComponent', comp.componentName || '');
        layoutVariants(set, variants);
        if (options.clickStates !== false) await addClickStates(set);
        const play = options.playgrounds !== false ? playground(set, set.width) : null;
        if (play) section.appendChild(play);
        const height = (play ? play.height + 24 : 0) + set.height;
        if (y > SECTION_PADDING && y + height > SET_COLUMN_HEIGHT) {
            x += columnWidth + SET_GAP;
            y = SECTION_PADDING;
            columnWidth = 0;
        }
        if (play) {
            play.x = x;
            play.y = y;
            y += play.height + 24;
            columnWidth = Math.max(columnWidth, play.width);
        }
        set.x = x;
        set.y = y;
        y += set.height + SET_GAP;
        columnWidth = Math.max(columnWidth, set.width);
        bottom = Math.max(bottom, y - SET_GAP);
    }
    section.resizeWithoutConstraints(
        x + columnWidth + SECTION_PADDING,
        bottom + SECTION_PADDING,
    );
    if (state.colorVars) {
        try {
            section.setExplicitVariableModeForCollection(
                state.colorVars.collection,
                state.colorVars.modeId,
            );
        } catch (e) {
            console.warn('variable mode not set', e);
        }
    }
    return section;
}

// Small states (buttons) flow in rows; a set of big ones is a column.
function layoutVariants(set, variants) {
    const gap = 40;
    const pad = 40;
    const widest = variants.reduce((w, v) => Math.max(w, v.width), 0);
    const total =
        variants.reduce((w, v) => w + v.width, 0) + gap * (variants.length - 1);
    set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = pad;
    set.itemSpacing = gap;
    try {
        set.layoutMode = 'HORIZONTAL';
        set.layoutWrap = 'WRAP';
        set.counterAxisSpacing = gap;
        // resize() fixes both axes; set the height to hug afterwards.
        set.resize(
            Math.min(total, Math.max(widest, SET_MAX_WIDTH)) + pad * 2,
            set.height,
        );
        set.primaryAxisSizingMode = 'FIXED';
        set.counterAxisSizingMode = 'AUTO';
    } catch (e) {
        // Wrapping auto layout isn't available everywhere.
        set.layoutMode = 'VERTICAL';
        set.primaryAxisSizingMode = 'AUTO';
        set.counterAxisSizingMode = 'AUTO';
    }
}

/* -------------------------------------------------------------------- */
/* Playgrounds and click-to-toggle                                      */
/* -------------------------------------------------------------------- */

// Controls whose click is the obvious thing to try in Present mode come
// first; any other on/off control after them.
const TOGGLE_FIRST = /^(checked|active|selected|open|opened|expanded|on|enabled|toggled|pressed|value|is[A-Z_].*)$/;

// Then a control that changes the whole look: the machine's state for
// feature stories, a button's variant.
const CYCLE_FIRST = ['machinePreset', 'variant', 'status', 'state'];

function variantProps(variant) {
    return variant.variantProperties || {};
}

// Which property a click changes: an obvious on/off control, then one of
// CYCLE_FIRST, then any on/off control, then the first other control, then
// the story.
function clickProperty(set) {
    let defs = {};
    try {
        defs = set.componentPropertyDefinitions || {};
    } catch (e) {
        return null;
    }
    const variants = Object.keys(defs).filter(
        (k) => defs[k].type === 'VARIANT' && (defs[k].variantOptions || []).length > 1,
    );
    const isBool = (k) => {
        const o = defs[k].variantOptions.slice().sort();
        return o.length === 2 && o[0] === 'false' && o[1] === 'true';
    };
    const bools = variants.filter(isBool);
    const pick =
        bools.find((k) => TOGGLE_FIRST.test(k)) ||
        CYCLE_FIRST.map((n) => variants.find((k) => k === n)).find(Boolean) ||
        bools[0] ||
        variants.find((k) => k !== 'Story' && k !== 'Interaction') ||
        variants.find((k) => k === 'Story');
    if (!pick) return null;
    return { name: pick, options: defs[pick].variantOptions, toggle: isBool(pick) };
}

// The variant a click on `from` changes to: `prop` moved to its next value,
// everything else kept where it can be.
function clickTarget(variants, from, prop) {
    const props = variantProps(from);
    const options = prop.options;
    const next = options[(options.indexOf(props[prop.name]) + 1) % options.length];
    let best = null;
    let bestScore = -1;
    for (const v of variants) {
        if (v === from) continue;
        const vp = variantProps(v);
        if (vp[prop.name] !== next) continue;
        // Keeping the other controls matters more than keeping the story:
        // a click on an "Off" switch should land on "On", not move it.
        let score = 0;
        for (const k of Object.keys(props))
            if (k !== prop.name && vp[k] === props[k]) score += k === 'Story' ? 0.5 : 1;
        if (score > bestScore) {
            best = v;
            bestScore = score;
        }
    }
    return best;
}

// Makes the set an interactive component: in Present mode a click on any
// instance changes it to the state with the click property moved on.
// Returns the property's name, or null if nothing could be wired.
async function addClickStates(set) {
    const prop = clickProperty(set);
    if (!prop) return null;
    const variants = set.children.filter((c) => c.type === 'COMPONENT');
    let wired = 0;
    for (const v of variants) {
        if (!('setReactionsAsync' in v)) break;
        const to = clickTarget(variants, v, prop);
        if (!to) continue;
        try {
            await v.setReactionsAsync([
                {
                    trigger: { type: 'ON_CLICK' },
                    actions: [
                        {
                            type: 'NODE',
                            destinationId: to.id,
                            navigation: 'CHANGE_TO',
                            transition: null,
                            resetVideoPosition: false,
                        },
                    ],
                },
            ]);
            wired++;
        } catch (e) {
            console.warn('click state not added', v.name, e);
            break;
        }
    }
    if (!wired) return null;
    set.setPluginData('clickProperty', prop.name);
    return prop.name;
}

function clickHint(set) {
    const prop = set.getPluginData('clickProperty');
    return prop ? ` · in Present mode, click it to change ${prop}` : '';
}

// One instance to play with: pick control values in the right-hand panel
// and it shows that captured state.
function playground(set, width) {
    const frame = hugFrame(`Playground — ${set.name}`, 'VERTICAL', 8);
    const text = caption(
        `Playground: select it and set the controls in the right-hand panel${clickHint(set)}`,
        11,
        false,
    );
    if (text) {
        frame.appendChild(text);
        if (width && text.width > width) {
            // resize() fixes the box; let it grow downwards after.
            text.resize(Math.max(200, width), text.height);
            text.textAutoResize = 'HEIGHT';
        }
    }
    const def = set.defaultVariant || set.children.find((c) => c.type === 'COMPONENT');
    const inst = def.createInstance();
    inst.name = `${set.name} (playground)`;
    frame.appendChild(inst);
    frame.setPluginData('playgroundFor', set.id);
    return frame;
}

/* -------------------------------------------------------------------- */
/* Linked prototypes                                                    */
/* -------------------------------------------------------------------- */

/* <shared:match> */
/* Generated from shared/match.cjs by sync-plugin.mjs. Don't edit here. */
/*
 * Linked prototypes: finds which layer of an imported screen corresponds to
 * a layer of the master prototype, by how alike their names are and where
 * they sit in the layer tree.
 *
 * Plain ES2017 with no imports: it runs in Node (tests) and inside the
 * Figma plugin, where sync-plugin.mjs pastes it into code.js. Edit it here,
 * then run `yarn figma:sync-plugin`.
 *
 * It works on plain descriptors rather than Figma nodes:
 *   { name, path: [ancestor names, outermost first], cx, cy, w, h }
 * with cx/cy the layer's centre and w/h its size, as fractions of the frame.
 */
var L2FMatch = (function () {
    // Words that say how a screen was captured rather than which screen it
    // is: sizes, themes, layouts, and the suffixes the importer adds.
    var NOISE = {
        light: 1,
        dark: 1,
        desktop: 1,
        changes: 1,
        gsender: 1,
        http: 1,
        https: 1,
        localhost: 1,
        index: 1,
        html: 1,
    };

    function tokens(name) {
        var out = [];
        String(name || '')
            // Before the camelCase split turns it into "g" and "sender"
            .replace(/gsender/gi, ' ')
            // camelCase and PascalCase component names split into words
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .toLowerCase()
            .replace(/\d+\s*[×x]\s*\d+/g, ' ')
            .split(/[^a-z0-9]+/)
            .forEach(function (t) {
                if (!t || NOISE[t] || /^\d+$/.test(t)) return;
                out.push(t);
            });
        return out;
    }

    // 0..1. Exact (ignoring case and noise) is 1; otherwise shared words,
    // counting a name wholly contained in the other ("Configuration" in
    // "gSender #/configuration") as a strong match.
    function nameSimilarity(a, b) {
        var ta = tokens(a);
        var tb = tokens(b);
        if (!ta.length || !tb.length)
            return String(a || '').trim().toLowerCase() ===
                String(b || '').trim().toLowerCase() && String(a || '').trim()
                ? 1
                : 0;
        var setB = {};
        tb.forEach(function (t) {
            setB[t] = 1;
        });
        var setA = {};
        var shared = 0;
        ta.forEach(function (t) {
            if (setA[t]) return;
            setA[t] = 1;
            if (setB[t]) shared++;
        });
        var sizeA = Object.keys(setA).length;
        var sizeB = Object.keys(setB).length;
        var jaccard = shared / (sizeA + sizeB - shared);
        var contained = shared / Math.min(sizeA, sizeB);
        return 0.5 * jaccard + 0.5 * contained;
    }

    // 0..1: how alike two ancestor chains are. The longest run of matching
    // names in order, with ancestors nearer the layer counting for more, so
    // extra wrappers near the top of one tree cost little.
    function pathSimilarity(a, b) {
        a = a || [];
        b = b || [];
        if (!a.length && !b.length) return 1;
        if (!a.length || !b.length) return 0.3;
        var n = a.length;
        var m = b.length;
        var weight = function (i, len) {
            return 1 + (2 * (i + 1)) / len;
        };
        var dp = [];
        for (var i = 0; i <= n; i++) {
            dp.push([]);
            for (var j = 0; j <= m; j++) dp[i].push(0);
        }
        for (var x = 1; x <= n; x++) {
            for (var y = 1; y <= m; y++) {
                var sim = nameSimilarity(a[x - 1], b[y - 1]);
                var take =
                    sim >= 0.6
                        ? dp[x - 1][y - 1] +
                          (sim * (weight(x - 1, n) + weight(y - 1, m))) / 2
                        : 0;
                dp[x][y] = Math.max(dp[x - 1][y], dp[x][y - 1], take);
            }
        }
        var total = function (len) {
            var t = 0;
            for (var k = 0; k < len; k++) t += weight(k, len);
            return t;
        };
        return dp[n][m] / Math.max(total(n), total(m));
    }

    function positionSimilarity(a, b) {
        var dx = (a.cx || 0) - (b.cx || 0);
        var dy = (a.cy || 0) - (b.cy || 0);
        var dist = Math.sqrt(dx * dx + dy * dy);
        var size =
            Math.abs((a.w || 0) - (b.w || 0)) + Math.abs((a.h || 0) - (b.h || 0));
        return Math.max(0, 1 - dist / 0.3) * 0.75 + Math.max(0, 1 - size / 0.3) * 0.25;
    }

    function score(a, b) {
        var name = nameSimilarity(a.name, b.name);
        var path = pathSimilarity(a.path, b.path);
        var pos = positionSimilarity(a, b);
        // A layer with a generic name ("div", "button") can still match on
        // where it is, but only when both its place in the tree and its
        // position agree.
        if (name < 0.6 && !(name >= 0.3 && path >= 0.8 && pos >= 0.8)) return 0;
        return 0.45 * name + 0.35 * path + 0.2 * pos;
    }

    var THRESHOLD = 0.55;

    // Index of the best candidate for `target`, or -1.
    function bestMatch(target, candidates, threshold) {
        var best = -1;
        var bestScore = threshold === undefined ? THRESHOLD : threshold;
        for (var i = 0; i < candidates.length; i++) {
            var s = score(target, candidates[i]);
            if (s > bestScore) {
                best = i;
                bestScore = s;
            }
        }
        return best;
    }

    // Pairs screens of the master with imported screens, each used once,
    // best pairs first. `masters` and `imports` are [{ name, url }]; a
    // shared source URL (both are captures of the same route) wins outright.
    // Returns [{ master, target, score }] of indexes.
    function matchFrames(masters, imports, threshold) {
        var min = threshold === undefined ? 0.5 : threshold;
        var pairs = [];
        for (var i = 0; i < masters.length; i++) {
            for (var j = 0; j < imports.length; j++) {
                var a = masters[i];
                var b = imports[j];
                var s =
                    a.url && b.url && routeOf(a.url) === routeOf(b.url)
                        ? 1
                        : nameSimilarity(a.name, b.name);
                // Same route captured for another layout is a weaker match
                // than the same route in the same layout.
                if (a.layout && b.layout && a.layout !== b.layout) s *= 0.8;
                if (s >= min) pairs.push({ master: i, target: j, score: s });
            }
        }
        pairs.sort(function (p, q) {
            return q.score - p.score;
        });
        var usedM = {};
        var usedT = {};
        return pairs.filter(function (p) {
            if (usedM[p.master] || usedT[p.target]) return false;
            usedM[p.master] = usedT[p.target] = true;
            return true;
        });
    }

    function routeOf(url) {
        var m = String(url).match(/^[a-z]+:\/\/[^/]+(.*)$/i);
        return (m ? m[1] : String(url)).replace(/\/+$/, '') || '/';
    }

    /*
     * Storybook states beside screens: a screen layer shows a Storybook
     * component when one of the React components it was rendered by has
     * that component's name. Keys ignore case, punctuation, a "Widget"
     * suffix and a plural, so "MacroWidget", "Macros" and "macro" agree.
     */
    function componentKey(name) {
        var k = String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/widget$/, '');
        if (k.length > 3) k = k.replace(/s$/, '');
        return k;
    }

    // Keys for a Storybook component set: the story's component and the
    // last part of its title ("Features/Jogging" → "jogging").
    function setKeys(title, componentName) {
        var out = [];
        var last = String(title || '').split('/').pop();
        [componentName, last].forEach(function (n) {
            var k = componentKey(n);
            if (k && out.indexOf(k) < 0) out.push(k);
        });
        return out;
    }

    // Keys for a screen layer: every React component it was rendered by
    // (`react`, a list or comma-separated), or else the component name the
    // capture put first in its layer name. Bare tags ("div #root") aren't.
    function layerKeys(name, react) {
        var names = Array.isArray(react)
            ? react
            : react
              ? String(react).split(',')
              : [];
        if (!names.length) {
            var first = String(name || '').split(' ')[0];
            if (/^[A-Z]/.test(first)) names = [first];
        }
        var out = [];
        names.forEach(function (n) {
            var k = componentKey(n);
            if (k && out.indexOf(k) < 0) out.push(k);
        });
        return out;
    }

    return {
        componentKey: componentKey,
        setKeys: setKeys,
        layerKeys: layerKeys,
        tokens: tokens,
        nameSimilarity: nameSimilarity,
        pathSimilarity: pathSimilarity,
        positionSimilarity: positionSimilarity,
        score: score,
        bestMatch: bestMatch,
        matchFrames: matchFrames,
    };
})();
/* </shared:match> */

const MASTER_KEY = 'masterPage';
const SCREEN_TYPES = ['FRAME', 'COMPONENT', 'INSTANCE'];

async function masterPage() {
    const id = figma.root.getPluginData(MASTER_KEY);
    if (!id) return null;
    const page = await figma.getNodeByIdAsync(id);
    return page && page.type === 'PAGE' ? page : null;
}

async function postMaster() {
    const page = await masterPage();
    figma.ui.postMessage({
        type: 'master',
        name: page ? page.name : null,
        current: !!page && page === figma.currentPage,
        page: figma.currentPage.name,
    });
}

// Screens are the frames directly on a page, or inside its sections.
function screensOf(parent) {
    const out = [];
    for (const n of parent.children) {
        if (n.type === 'SECTION') out.push(...screensOf(n));
        else if (SCREEN_TYPES.includes(n.type)) out.push(n);
    }
    return out;
}

function screenOf(node) {
    let n = node;
    while (n.parent && n.parent.type !== 'PAGE' && n.parent.type !== 'SECTION')
        n = n.parent;
    return n;
}

function isInside(node, ancestor) {
    for (let p = node.parent; p; p = p.parent) if (p === ancestor) return true;
    return false;
}

function screenInfo(n) {
    return {
        name: n.name,
        url: n.getPluginData('sourceUrl'),
        layout: n.getPluginData('layout'),
    };
}

// A layer as shared/match.cjs sees it: its name, its ancestors' names, and
// where it sits in its screen.
function describeLayer(node, screen) {
    const path = [];
    for (let p = node.parent; p && p !== screen && p.type !== 'PAGE'; p = p.parent)
        path.unshift(p.name);
    const a = node.absoluteBoundingBox;
    const s = screen.absoluteBoundingBox;
    if (!a || !s || !s.width || !s.height)
        return { name: node.name, path, cx: 0.5, cy: 0.5, w: 0, h: 0 };
    return {
        name: node.name,
        path,
        cx: (a.x + a.width / 2 - s.x) / s.width,
        cy: (a.y + a.height / 2 - s.y) / s.height,
        w: a.width / s.width,
        h: a.height / s.height,
    };
}

// Copies the master prototype's interactions onto `targets` (screens on the
// current page). Each master screen is paired with the target it most
// resembles by name or captured route; within a pair, every layer that has
// an interaction is matched to the target layer most like it in name and
// place in the layer tree, and its interactions are copied there with
// their destinations swapped for the corresponding screens on this page.
async function linkToMaster(targets) {
    const master = await masterPage();
    if (!master)
        throw new Error(
            'No master prototype yet. Open the page that holds your prototype and click “Use this page as master”.',
        );
    await master.loadAsync();
    const page = figma.currentPage;
    const samePage = page === master;
    const targetIds = {};
    for (const t of targets) targetIds[t.id] = true;
    const masterScreens = screensOf(master).filter((n) => !targetIds[n.id]);
    // A link's destination can be any screen here, not only the new ones.
    const local = samePage ? targets : screensOf(page);
    const counterpart = {};
    for (const pair of L2FMatch.matchFrames(
        masterScreens.map(screenInfo),
        local.map(screenInfo),
    ))
        counterpart[masterScreens[pair.master].id] = local[pair.target];

    const layersOf = {};
    const layers = (screen) => {
        if (!layersOf[screen.id]) {
            const nodes = [screen].concat(screen.findAll(() => true));
            layersOf[screen.id] = {
                nodes,
                descs: nodes.map((n) => describeLayer(n, screen)),
            };
        }
        return layersOf[screen.id];
    };
    const twin = (node, from, to) => {
        if (node === from) return to;
        const l = layers(to);
        const i = L2FMatch.bestMatch(describeLayer(node, from), l.descs);
        return i >= 0 ? l.nodes[i] : null;
    };

    const result = {
        master: master.name,
        screens: 0,
        links: 0,
        unmatched: 0,
        dropped: 0,
        unpaired: 0,
    };
    for (const m of masterScreens) {
        const t = counterpart[m.id];
        if (!t || !targetIds[t.id]) continue;
        result.screens++;
        const sources = [m]
            .concat(m.findAll((n) => 'reactions' in n && n.reactions.length > 0))
            .filter((n) => 'reactions' in n && n.reactions.length > 0);
        for (const src of sources) {
            const dest = twin(src, m, t);
            if (!dest || !('setReactionsAsync' in dest)) {
                result.unmatched++;
                continue;
            }
            const reactions = [];
            for (const reaction of src.reactions) {
                const copy = await remapReaction(
                    reaction,
                    counterpart,
                    samePage,
                    twin,
                );
                if (copy) reactions.push(copy);
                else result.dropped++;
            }
            if (!reactions.length) continue;
            try {
                await dest.setReactionsAsync(reactions);
                result.links += reactions.length;
            } catch (e) {
                console.warn('interaction not copied', src.name, e);
                result.unmatched++;
            }
        }
    }
    result.unpaired = targets.filter(
        (t) => !masterScreens.some((m) => counterpart[m.id] === t),
    ).length;

    // Flows that start on a paired screen start on its copy too.
    try {
        const flows = page.flowStartingPoints.slice();
        for (const flow of master.flowStartingPoints) {
            const t = counterpart[flow.nodeId];
            if (!t || !targetIds[t.id]) continue;
            if (flows.some((f) => f.nodeId === t.id)) continue;
            flows.push({ nodeId: t.id, name: flow.name });
        }
        page.flowStartingPoints = flows;
    } catch (e) {
        console.warn('flow starting points not copied', e);
    }
    return result;
}

// A copy of one interaction with every destination pointed at this page's
// version of the screen, or null if none of its destinations exist here.
async function remapReaction(reaction, counterpart, samePage, twin) {
    const copy = JSON.parse(JSON.stringify(reaction));
    const actions = copy.actions || (copy.action ? [copy.action] : []);
    const kept = [];
    for (const action of actions) {
        if (!action || !action.destinationId) {
            // Back, close overlay, open URL, set variable: nothing to remap.
            if (action) kept.push(action);
            continue;
        }
        const dest = await figma.getNodeByIdAsync(action.destinationId);
        if (!dest) continue;
        const screen = screenOf(dest);
        const mapped = counterpart[screen.id];
        if (mapped) {
            const node = twin(dest, screen, mapped);
            if (!node) continue;
            action.destinationId = node.id;
            kept.push(action);
        } else if (samePage) {
            // No copy of that screen; keep pointing at the master's.
            kept.push(action);
        }
    }
    if (!kept.length) return null;
    copy.actions = kept;
    // `action` is the deprecated single-action form; Figma rejects both.
    delete copy.action;
    return copy;
}

function linkSummary(r) {
    if (!r.screens)
        return `No screen here matches one on the master page “${r.master}”. Screens are matched by name or by the route they were captured from.`;
    const notes = [];
    if (r.unmatched)
        notes.push(`${r.unmatched} layer(s) with interactions had no match`);
    if (r.dropped)
        notes.push(`${r.dropped} link(s) go to screens that aren't on this page`);
    if (r.unpaired)
        notes.push(`${r.unpaired} screen(s) have no counterpart on the master`);
    return `Linked ${r.links} interaction(s) on ${r.screens} screen(s) to follow “${r.master}”${notes.length ? ` (${notes.join('; ')})` : ''}.`;
}

/* -------------------------------------------------------------------- */
/* Storybook states beside screens                                      */
/* -------------------------------------------------------------------- */

const STORY_FOR = 'storyStatesFor';
const STORY_ROW_WIDTH = 2400;

// Screens that came from a capture, as opposed to components and sections
// the importer laid out beside them.
function capturedScreens(page) {
    return screensOf(page).filter((n) => n.getPluginData('sourceUrl'));
}

function layoutOf(node) {
    for (let p = node; p && p.type !== 'DOCUMENT'; p = p.parent) {
        const l = p.getPluginData('layout');
        if (l) return l;
    }
    return '';
}

// How well a component set captured for one layout suits a screen of
// another: the Android app shows the pendant UI, so pendant stories suit it.
function layoutFit(screenLayout, setLayout) {
    const s = screenLayout || 'desktop';
    const c = setLayout || 'desktop';
    if (s === c) return 2;
    if ((s === 'android' || s === 'pendant') && (c === 'android' || c === 'pendant'))
        return 1;
    return 0;
}

// Every Storybook component set in the file, by key (see setKeys in
// shared/match.cjs).
// `pages` limits the search; otherwise every page is loaded, which in a big
// file (whole Storybook captures on other pages) takes a minute.
async function storySetIndex(pages) {
    let sets;
    if (pages) {
        sets = [];
        for (const p of pages) {
            if (!p) continue;
            if ('loadAsync' in p) await p.loadAsync();
            sets.push(...p.findAllWithCriteria({ types: ['COMPONENT_SET'] }));
        }
    } else {
        await figma.loadAllPagesAsync();
        sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] });
    }
    const index = {};
    let count = 0;
    for (const set of sets) {
        if (!set.getPluginData('storyFile') && !set.getPluginData('storyComponent'))
            continue;
        count++;
        let at = '';
        for (let p = set.parent; p && p.type !== 'PAGE'; p = p.parent)
            at = at || p.getPluginData('capturedAt');
        const entry = { set, layout: layoutOf(set), capturedAt: at };
        for (const k of L2FMatch.setKeys(set.name, set.getPluginData('storyComponent')))
            (index[k] = index[k] || []).push(entry);
    }
    return { index, count };
}

// The set for one key that suits a screen of `layout`: same layout first,
// then the newest capture.
function pickSet(entries, layout) {
    let best = null;
    for (const e of entries || []) {
        const fit = layoutFit(layout, e.layout);
        if (!fit) continue;
        if (
            !best ||
            fit > best.fit ||
            (fit === best.fit && e.capturedAt > best.capturedAt)
        )
            best = { fit, capturedAt: e.capturedAt, set: e.set };
    }
    return best && best.set;
}

// The Storybook components a screen shows: walks its layers and records,
// for each component set, the outermost layers rendered by its component.
// `seenMains` can be shared between screens (the machine states of one
// screen use the same tab components), so each is walked once.
async function componentsIn(screen, index, seenMains = new Set()) {
    const layout = screen.getPluginData('layout') || 'desktop';
    const found = new Map(); // set id → { set, layers }
    const walk = async (node, active) => {
        let inside = active;
        if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
            for (const k of L2FMatch.layerKeys(node.name, node.getPluginData('react'))) {
                const set = pickSet(index[k], layout);
                if (!set || inside.has(set.id)) continue;
                if (!found.has(set.id)) found.set(set.id, { set, layers: [] });
                found.get(set.id).layers.push(node);
                if (inside === active) inside = new Set(active);
                inside.add(set.id);
            }
        }
        // Tab panels are instances of the tab group's variants; what they
        // show is in the main component, where the capture's names are.
        if (node.type === 'INSTANCE') {
            const main = await node.getMainComponentAsync();
            if (main && !seenMains.has(main.id)) {
                seenMains.add(main.id);
                for (const c of main.children) await walk(c, inside);
            }
            return;
        }
        if ('children' in node) for (const c of node.children) await walk(c, inside);
    };
    await walk(screen, new Set());
    // In reading order of where each first appears.
    const box = (n) => n.absoluteBoundingBox || { x: 0, y: 0 };
    return [...found.values()].sort((a, b) => {
        const p = box(a.layers[0]);
        const q = box(b.layers[0]);
        return Math.abs(p.y - q.y) > 8 ? p.y - q.y : p.x - q.x;
    });
}

let storyFontsLoaded = null;
async function storyFonts() {
    if (storyFontsLoaded === null) {
        try {
            await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
            await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
            storyFontsLoaded = true;
        } catch (e) {
            console.warn('Inter not available for Storybook captions', e);
            storyFontsLoaded = false;
        }
    }
    return storyFontsLoaded;
}

function caption(text, size, bold) {
    if (!storyFontsLoaded) return null;
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: bold ? 'Semi Bold' : 'Regular' };
    t.fontSize = size;
    t.characters = text;
    t.fills = [{ type: 'SOLID', color: bold ? { r: 0.1, g: 0.11, b: 0.13 } : { r: 0.4, g: 0.42, b: 0.46 } }];
    return t;
}

function hugFrame(name, direction, gap) {
    const f = figma.createFrame();
    f.name = name;
    f.fills = [];
    f.clipsContent = false;
    f.layoutMode = direction;
    f.itemSpacing = gap;
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'AUTO';
    return f;
}

// "JobControl › Button": the layer under its nearest named component, as
// bare tags ("div") don't say where it is.
function placeOf(layer) {
    const own = layer.name.split(' ')[0];
    for (let p = layer.parent; p && p.type !== 'PAGE' && p.type !== 'SECTION'; p = p.parent) {
        const name = p.name.split(' ')[0];
        if (/^[A-Z]/.test(name) && name !== own && !p.getPluginData('sourceUrl'))
            return `${name} › ${own}`;
    }
    return own;
}

// One component's states: a title, where it is in the screen, and an
// instance of every variant with its name above it.
async function stateGroup(set, layers) {
    const group = hugFrame(set.name, 'VERTICAL', 16);
    const title = caption(set.name, 20, true);
    if (title) group.appendChild(title);
    const where = layers
        .slice(0, 3)
        .map(placeOf)
        .filter((p, i, all) => all.indexOf(p) === i)
        .join('; ');
    const sub = caption(
        `${set.children.length} state(s) · in this screen ${layers.length === 1 ? 'at' : `${layers.length}×, e.g.`} ${where}`,
        12,
        false,
    );
    if (sub) group.appendChild(sub);
    // Sets imported before click states existed get them now.
    if (!set.getPluginData('clickProperty')) await addClickStates(set);
    group.appendChild(playground(set));

    const cells = [];
    for (const variant of set.children) {
        if (variant.type !== 'COMPONENT') continue;
        const cell = hugFrame(variant.name, 'VERTICAL', 8);
        const label = caption(variant.name, 11, false);
        if (label) cell.appendChild(label);
        cell.appendChild(variant.createInstance());
        cells.push(cell);
    }
    const row = figma.createFrame();
    row.name = 'States';
    row.fills = [];
    row.clipsContent = false;
    const gap = 32;
    const widest = cells.reduce((w, c) => Math.max(w, c.width), 0);
    const total = cells.reduce((w, c) => w + c.width, 0) + gap * Math.max(0, cells.length - 1);
    try {
        row.layoutMode = 'HORIZONTAL';
        row.layoutWrap = 'WRAP';
        row.itemSpacing = gap;
        row.counterAxisSpacing = gap;
        // resize() fixes both axes, so it goes before the height is set to
        // hug the wrapped rows; the other way round the rows overflow a 1px
        // frame and pile onto whatever is below.
        row.resize(Math.max(1, Math.min(total, Math.max(widest, STORY_ROW_WIDTH))), 1);
        row.primaryAxisSizingMode = 'FIXED';
        row.counterAxisSizingMode = 'AUTO';
    } catch (e) {
        row.layoutMode = 'VERTICAL';
        row.itemSpacing = gap;
        row.primaryAxisSizingMode = 'AUTO';
        row.counterAxisSizingMode = 'AUTO';
    }
    for (const c of cells) row.appendChild(c);
    group.appendChild(row);

    // Show the states in the colour mode they were captured in.
    for (let p = set.parent; p && p.type !== 'PAGE'; p = p.parent) {
        const modes = p.explicitVariableModes || {};
        for (const id of Object.keys(modes)) {
            try {
                const collection = await figma.variables.getVariableCollectionByIdAsync(id);
                if (collection) group.setExplicitVariableModeForCollection(collection, modes[id]);
            } catch (e) {
                console.warn('variable mode not copied', e);
            }
        }
        if (Object.keys(modes).length) break;
    }
    return group;
}

// Below `box`, clear of everything else on the page.
function freeSpotBelow(box, w, h, ignore) {
    const page = figma.currentPage;
    const x = box.x;
    let y = box.y + box.height + 200;
    const others = page.children.filter((c) => !ignore.includes(c));
    for (let moved = true, guard = 0; moved && guard < 500; guard++) {
        moved = false;
        for (const c of others) {
            if (c.x < x + w && c.x + c.width > x && c.y < y + h && c.y + c.height > y) {
                y = c.y + c.height + 200;
                moved = true;
            }
        }
    }
    return { x, y };
}

// Lays out, beneath each screen, the Storybook states of the components it
// shows. A screen's earlier states section is replaced in place.
async function attachStoryStates(targets) {
    const { index, count } = await storySetIndex();
    const result = { screens: targets.length, withStates: 0, sets: 0, places: 0, sections: [], inFile: count };
    if (!count) return result;
    await storyFonts();
    const page = figma.currentPage;
    const previous = {};
    for (const s of page.findAllWithCriteria({ types: ['SECTION'] })) {
        const id = s.getPluginData(STORY_FOR);
        if (id) previous[id] = s;
    }
    const used = new Set();
    for (const screen of targets) {
        const found = await componentsIn(screen, index);
        const old = previous[screen.id];
        const spot = old ? { x: old.x, y: old.y } : null;
        if (old) old.remove();
        if (!found.length) continue;
        progress(`Placing Storybook states for ${screen.name} (${found.length} component(s))…`);
        const section = figma.createSection();
        section.name = `${screen.name} — Storybook states`;
        section.setPluginData(STORY_FOR, screen.id);
        // One auto layout column, so Figma stacks the components itself.
        const column = hugFrame('Storybook states', 'VERTICAL', STATE_GAP);
        section.appendChild(column);
        column.x = SECTION_PADDING;
        column.y = SECTION_PADDING;
        for (const { set, layers } of found) {
            column.appendChild(await stateGroup(set, layers));
            used.add(set.id);
            result.places += layers.length;
        }
        section.resizeWithoutConstraints(
            column.width + SECTION_PADDING * 2,
            column.height + SECTION_PADDING * 2,
        );
        const at =
            spot ||
            freeSpotBelow(
                screen.absoluteBoundingBox || screen,
                section.width,
                section.height,
                [section],
            );
        section.x = at.x;
        section.y = at.y;
        result.withStates++;
        result.sections.push(section);
    }
    result.sets = used.size;
    return result;
}

/* -------------------------------------------------------------------- */
/* Interactive playground                                               */
/* -------------------------------------------------------------------- */

// A playground is the screen made usable in Present mode: tabs switch,
// menus open over it, and Storybook components that look the same as the
// screen's are swapped in so a click changes their state. The parts it
// needs (component sets, menus) go on a page of their own, out of the way.

const PLAYGROUND_PAGE = 'Playground';
const PARTS_PAGE = 'Playground components';

async function pageNamed(name) {
    let page = figma.root.children.find((p) => p.name === name);
    if (!page) {
        page = figma.createPage();
        page.name = name;
    }
    if ('loadAsync' in page) await page.loadAsync();
    return page;
}

const click = (actions) => [{ trigger: { type: 'ON_CLICK' }, actions }];
const changeTo = (node) => ({
    type: 'NODE',
    destinationId: node.id,
    navigation: 'CHANGE_TO',
    transition: null,
    resetVideoPosition: false,
});

function inInstance(node) {
    for (let p = node.parent; p && p.type !== 'PAGE'; p = p.parent)
        if (p.type === 'INSTANCE') return true;
    return false;
}

// Where `node` is, relative to `frame`'s top-left.
function boxIn(node, frame) {
    const a = node.absoluteBoundingBox;
    const f = frame.absoluteBoundingBox;
    if (!a || !f) return null;
    return { x: a.x - f.x, y: a.y - f.y, w: a.width, h: a.height };
}

function overlap(a, b) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (w <= 0 || h <= 0) return 0;
    const both = w * h;
    return both / (a.w * a.h + b.w * b.h - both);
}

// Every layer under `root`, not looking inside instances. In Figma a
// search also walks each instance's copy of its component, which on the
// Configuration page is ~10,000 layers per screen; nothing a playground
// wires up is inside one.
function ownLayers(root) {
    const out = [];
    const walk = (n) => {
        for (const c of n.children || []) {
            out.push(c);
            if (c.type !== 'INSTANCE' && 'children' in c) walk(c);
        }
    };
    if ('children' in root) walk(root);
    return out;
}

// Each tab of each variant changes to that tab's variant on click.
async function wireTabs(tabs) {
    const { st, components } = tabs;
    const byValue = {};
    // Values can be upper-cased by CSS while the text isn't, so ignore case.
    const norm = (t) => String(t).trim().toLowerCase();
    st.options.forEach((o, i) => (byValue[norm(o.value)] = components[i]));
    let wired = 0;
    const labels = new Set(Object.keys(byValue));
    for (const comp of components) {
        if (!comp) continue;
        const layers = ownLayers(comp);
        const labelled = layers.filter((n) => n.type === 'TEXT' && labels.has(norm(n.characters)));
        for (const label of labels) {
            const to = byValue[label];
            if (!to || to === comp) continue;
            // The tab strip is above the panel, so the topmost label is the tab.
            const texts = labelled
                .filter((n) => norm(n.characters) === label)
                .map((n) => ({ n, b: boxIn(n, comp) }))
                .filter((t) => t.b)
                .sort((a, b) => a.b.y - b.b.y);
            if (!texts.length) continue;
            const text = texts[0].n;
            const p = text.parent;
            const target = p && p !== comp && p.type === 'FRAME' && p.height < 80 ? p : text;
            try {
                await target.setReactionsAsync(click([changeTo(to)]));
                wired++;
            } catch (e) {
                console.warn('tab not wired', label, e);
            }
        }
        // A strip too narrow for every tab has scroll arrows; they step to
        // the next or previous tab, so the hidden ones can be reached.
        const i = components.indexOf(comp);
        const step = [
            [/scroll.*(right|next)|next tab/i, components[i + 1]],
            [/scroll.*(left|prev)|previous tab/i, components[i - 1]],
        ];
        for (const [pattern, to] of step) {
            if (!to) continue;
            const arrow = layers.find((n) => n.type === 'FRAME' && pattern.test(n.name));
            if (!arrow || arrow.reactions.length) continue;
            try {
                await arrow.setReactionsAsync(click([changeTo(to)]));
                wired++;
            } catch (e) {
                console.warn('tab arrow not wired', e);
            }
        }
    }
    return wired;
}

// The layer in the screen a menu was opened from: the one whose box best
// covers where the capture clicked, outermost on a near tie.
function triggerLayer(frame, rect, boxes) {
    let best = null;
    for (const { n, b } of boxes) {
        const score = overlap(b, rect);
        if (score < 0.4) continue;
        if (!best || score > best.score + 0.05 || (Math.abs(score - best.score) <= 0.05 && b.w * b.h > best.area))
            best = { node: n, score, area: b.w * b.h };
    }
    return best && best.node;
}

// A menu opens as an overlay the size of the screen, with the menu where
// the app shows it; a click anywhere closes it. (Figma centres overlays and
// plugins can't change that, so the overlay fills the screen instead.)
async function wireMenu(frame, pop, holder, boxes) {
    const { info, comp } = pop;
    const rect = info.trigger;
    const trigger = triggerLayer(frame, rect, boxes);
    if (!trigger) return null;
    // A menu shared by several machine states opens the same overlay.
    const reuse = holder.byMenu && holder.byMenu.get(comp.id);
    if (reuse) {
        try {
            await trigger.setReactionsAsync(
                click([{ type: 'NODE', destinationId: reuse.id, navigation: 'OVERLAY', transition: null, resetVideoPosition: false }]),
            );
            return { overlay: reuse, trigger };
        } catch (e) {
            console.warn('menu not wired', info.name, e);
            return null;
        }
    }
    const overlay = figma.createFrame();
    overlay.name = `Menu — ${info.name}`;
    overlay.fills = [];
    overlay.clipsContent = false;
    overlay.resize(frame.width, frame.height);
    const inst = comp.createInstance();
    overlay.appendChild(inst);
    inst.x = info.at.x;
    inst.y = info.at.y;
    holder.appendChild(overlay);
    if (holder.byMenu) holder.byMenu.set(comp.id, overlay);
    try {
        await overlay.setReactionsAsync(click([{ type: 'CLOSE' }]));
        await trigger.setReactionsAsync(
            click([
                {
                    type: 'NODE',
                    destinationId: overlay.id,
                    navigation: 'OVERLAY',
                    transition: null,
                    resetVideoPosition: false,
                },
            ]),
        );
    } catch (e) {
        console.warn('menu not wired', info.name, e);
        overlay.remove();
        return null;
    }
    return { overlay, trigger };
}

// What a layer looks like, close enough to tell whether a Storybook state
// is the same thing: its text, and each layer's kind, place, size and colour.
function looks(node) {
    const root = node.absoluteBoundingBox;
    const r2 = (v) => Math.round(v / 2) * 2;
    const parts = [];
    const walk = (n) => {
        if (n.visible === false) return;
        const b = n.absoluteBoundingBox;
        let fill = '';
        const fills = n.fills;
        if (Array.isArray(fills)) {
            const solid = fills.find((f) => f.type === 'SOLID' && f.visible !== false);
            if (solid)
                fill = ['r', 'g', 'b'].map((k) => Math.round(solid.color[k] * 15).toString(16)).join('');
        }
        if (b && root)
            parts.push(
                `${n.type === 'INSTANCE' || n.type === 'COMPONENT' ? 'FRAME' : n.type}:${r2(b.x - root.x)},${r2(b.y - root.y)},${r2(b.width)}x${r2(b.height)}:${fill}:${n.type === 'TEXT' ? n.characters : ''}`,
            );
        if ('children' in n) for (const c of n.children) walk(c);
    };
    walk(node);
    return parts.sort().join('|');
}

// The part of one of `set`'s states that looks just like `layer`, if any.
// A state is the whole story (backdrop and padding included), so the match
// is usually a layer somewhere inside it.
function sameState(set, layer, cache) {
    const w = layer.width;
    const h = layer.height;
    let mine = null;
    for (const v of set.children) {
        if (v.type !== 'COMPONENT') continue;
        if (v.width < w - 2 || v.height < h - 2) continue;
        const near = (n) => Math.abs(n.width - w) <= 2 && Math.abs(n.height - h) <= 2;
        const candidates = (near(v) ? [v] : []).concat(
            v.findAll((n) => n.type === 'FRAME' && near(n)),
        );
        for (const node of candidates) {
            if (!cache.has(node.id)) cache.set(node.id, looks(node));
            if (mine === null) mine = looks(layer);
            if (cache.get(node.id) === mine) return { variant: v, node };
        }
    }
    return null;
}

function pathTo(root, node) {
    const path = [];
    for (let n = node; n !== root; n = n.parent) path.unshift(n.parent.children.indexOf(n));
    return path;
}

function atPath(root, path) {
    let n = root;
    for (const i of path) {
        if (!('children' in n) || !n.children[i]) return null;
        n = n.children[i];
    }
    return n;
}

// A component set of just that part, cut from every state of `set` at the
// same place, with the same variant properties and click states. One per
// set and part, shared by every screen layer that matches it.
async function pieceSet(match, set, ctx) {
    const path = pathTo(match.variant, match.node);
    const key = `${set.id}:${path.join('.')}`;
    if (!ctx.pieces.size) {
        // Ones earlier imports made are reused.
        for (const old of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] })) {
            const k = old.getPluginData('pieceKey');
            if (!k) continue;
            const byVariant = {};
            for (const c of old.children) {
                const from = c.getPluginData('pieceFrom');
                if (from) byVariant[from] = c;
            }
            ctx.pieces.set(k, { set: old, byVariant });
        }
        ctx.pieces.set('', null);
    }
    if (ctx.pieces.has(key)) return ctx.pieces.get(key);
    if (!ctx.section) {
        ctx.section = figma.createSection();
        ctx.section.name = 'Playground — components as they appear in screens';
        ctx.y = SECTION_PADDING;
        ctx.width = 0;
    }
    const comps = [];
    const byVariant = {};
    for (const v of set.children) {
        if (v.type !== 'COMPONENT') continue;
        const part = v === match.variant ? match.node : atPath(v, path);
        if (!part || part.type !== match.node.type || part.name !== match.node.name) continue;
        const copy = part.clone();
        ctx.section.appendChild(copy);
        const c = figma.createComponentFromNode(copy);
        c.name = v.name;
        c.setPluginData('pieceFrom', v.id);
        comps.push(c);
        byVariant[v.id] = c;
    }
    let piece = null;
    if (comps.length) {
        const pset = figma.combineAsVariants(comps, ctx.section);
        pset.name = `${set.name} (in screen)`;
        pset.setPluginData('pieceOf', set.id);
        pset.setPluginData('pieceKey', key);
        pset.setPluginData('clickProperty', '');
        layoutVariants(pset, comps);
        await addClickStates(pset);
        pset.x = SECTION_PADDING;
        pset.y = ctx.y;
        ctx.y += pset.height + SET_GAP;
        ctx.width = Math.max(ctx.width, pset.width);
        ctx.section.resizeWithoutConstraints(ctx.width + SECTION_PADDING * 2, ctx.y - SET_GAP + SECTION_PADDING);
        piece = { set: pset, byVariant };
    }
    ctx.pieces.set(key, piece);
    return piece;
}

function swapIn(original, node) {
    const parent = original.parent;
    const absolute = original.layoutPositioning === 'ABSOLUTE';
    const flow = parent.layoutMode && parent.layoutMode !== 'NONE';
    parent.insertChild(parent.children.indexOf(original), node);
    if (flow) {
        if (absolute) node.layoutPositioning = 'ABSOLUTE';
        node.layoutAlign = original.layoutAlign;
        node.layoutGrow = original.layoutGrow;
    }
    if (!flow || absolute) {
        node.x = original.x;
        node.y = original.y;
    }
    node.name = original.name;
    const react = original.getPluginData('react');
    if (react) node.setPluginData('react', react);
    original.remove();
}

// What a screen's tabs & menus section holds, as a playground needs it.
// Screens imported before this was stored still give their tab groups
// (from the variant names); their menus can't be placed.
async function builtFrom(frame) {
    const built = { tabs: [], popovers: [] };
    const id = frame.getPluginData('statesSection');
    let section = id ? await figma.getNodeByIdAsync(id) : null;
    if (!section) {
        const page = pageOf(frame);
        section = page && page.findAllWithCriteria({ types: ['SECTION'] }).find((n) => n.name === `${frame.name} — tabs & menus`);
    }
    // Menus shared with another machine state live in that state's section.
    try {
        for (const pid of JSON.parse(frame.getPluginData('sharedPopovers') || '[]')) {
            const comp = await figma.getNodeByIdAsync(pid);
            const info = comp && JSON.parse(comp.getPluginData('popover') || 'null');
            if (info) built.popovers.push({ info, comp });
        }
    } catch (e) {}
    if (!section) return built;
    built.section = section;
    for (const n of section.children) {
        // Section menus link themselves when they're built.
        if (n.type === 'COMPONENT_SET' && / — sections$/.test(n.name)) continue;
        if (n.type === 'COMPONENT_SET') {
            const variants = n.children.filter((c) => c.type === 'COMPONENT');
            let info = null;
            try {
                info = JSON.parse(n.getPluginData('tabs') || 'null');
            } catch (e) {}
            if (!info) {
                const props = Object.keys(variantProps(variants[0] || {}));
                if (props.length !== 1) continue;
                info = { property: props[0], values: variants.map((v) => variantProps(v)[props[0]]) };
            }
            const components = info.values.map((v) =>
                variants.find((c) => variantProps(c)[info.property] === v),
            );
            built.tabs.push({ st: { options: info.values.map((value) => ({ value })) }, set: n, components });
        } else if (n.type === 'COMPONENT') {
            try {
                const info = JSON.parse(n.getPluginData('popover') || 'null');
                if (info) built.popovers.push({ info, comp: n });
            } catch (e) {}
        }
    }
    return built;
}

function pageOf(node) {
    let n = node;
    while (n && n.type !== 'PAGE') n = n.parent;
    return n;
}

function frameTheme(frame) {
    const t = frame.getPluginData('theme');
    if (t) return t;
    const m = / (light|dark)$/i.exec(frame.name);
    return m ? m[1] : '';
}

// Menu overlays waiting to be placed. They stay directly on the page (then
// go directly into a section): Figma rejects an overlay link to a frame
// nested in another frame ("Reaction at index 0 was invalid").
// The menus a playground opens, out of the way in a section of their own:
// each is an overlay the size of the screen (Figma opens overlays centred,
// so the menu sits where the app shows it inside a screen-sized frame), in
// a labelled grid. They have to stay on this page for Present mode.
function menuSection(overlays) {
    if (!overlays.length) return null;
    progress(`Placing ${overlays.length} menu(s)…`);
    const section = figma.createSection();
    section.name = 'Menus the playground opens (keep; used in Present mode)';
    const cols = 4;
    const w = overlays[0].width;
    const h = overlays[0].height;
    let row = 0;
    overlays.forEach((o, i) => {
        const col = i % cols;
        row = Math.floor(i / cols);
        const x = SECTION_PADDING + col * (w + 120);
        const y = SECTION_PADDING + row * (h + 160);
        const label = caption(o.name.replace(/^Menu — /, ''), 28, true);
        if (label) {
            section.appendChild(label);
            label.x = x;
            label.y = y;
        }
        section.appendChild(o);
        o.x = x;
        o.y = y + 56;
    });
    const cnt = Math.min(cols, overlays.length);
    section.resizeWithoutConstraints(
        SECTION_PADDING * 2 + cnt * w + (cnt - 1) * 120,
        SECTION_PADDING * 2 + (row + 1) * (h + 160) - 104,
    );
    return section;
}

function menuList() {
    return {
        children: [],
        byMenu: new Map(),
        appendChild(n) {
            if (!this.children.includes(n)) this.children.push(n);
        },
        remove() {},
    };
}

// Wires one screen up. `holder` takes new menu overlays; `again` is set for
// a screen that is already a playground, whose menus are already wired and
// which only needs its tabs and components redone.
async function makePlayground(frame, built, holder, ctx, again) {
    const r = { tabs: 0, menus: [], components: [], menusUnknown: false };
    for (const t of built.tabs) if (await wireTabs(t)) r.tabs++;
    // The screen's own layers and where they are, looked up once.
    const layers = ownLayers(frame);
    r.sections = layers.some((n) => n.type === 'INSTANCE' && / \(sections\)$/.test(n.name));
    if (!again && built.popovers.length) {
        const boxes = [];
        for (const n of layers) {
            if (!('setReactionsAsync' in n)) continue;
            const b = boxIn(n, frame);
            if (b && b.w > 0 && b.h > 0) boxes.push({ n, b });
        }
        for (const p of built.popovers) {
            const m = await wireMenu(frame, p, holder, boxes);
            if (m) r.menus.push(p.info.name);
        }
        if (!built.popovers.length && built.section && built.section.children.some((n) => n.type === 'COMPONENT' && /^Popover/.test(n.name)))
            r.menusUnknown = true;
    }
    // Layers that open a menu stay as they are.
    const triggers = layers.filter(
        (n) => n.reactions && n.reactions.some((x) => (x.actions || [x.action]).some((a) => a && a.navigation === 'OVERLAY')),
    );

    if (!ctx.stories)
        ctx.stories = await storySetIndex([
            figma.currentPage,
            figma.root.children.find((p) => p.name === PARTS_PAGE),
        ]);
    const { index, count } = ctx.stories;
    if (!count) {
        // Nothing to swap in: don't walk the screen for components.
        r.noStorybook = true;
        return r;
    }
    const theme = frameTheme(frame);
    const cache = ctx.looks;
    const holds = (layer) => triggers.some((t) => t === layer || isInside(t, layer));
    for (const { set, layers } of await componentsIn(frame, index, ctx.seenMains)) {
        const setTheme = set.parent && set.parent.getPluginData ? set.parent.getPluginData('theme') : '';
        if (theme && setTheme && theme.toLowerCase() !== setTheme.toLowerCase()) {
            r.otherTheme = setTheme;
            continue;
        }
        let swapped = 0;
        let click = '';
        for (const layer of layers) {
            if (layer.removed || layer === frame || !layer.parent || inInstance(layer)) continue;
            if (layer.type !== 'FRAME' || holds(layer)) continue;
            const match = sameState(set, layer, cache);
            if (!match) continue;
            const piece = await pieceSet(match, set, ctx);
            const comp = piece && piece.byVariant[match.variant.id];
            if (!comp) continue;
            // With machine states captured, the bar under the screen changes
            // the machine for everything; one widget doing it alone would
            // contradict the rest of the screen.
            if (frame.getPluginData('modeGroup') && /^machine/.test(piece.set.getPluginData('clickProperty'))) continue;
            swapIn(layer, comp.createInstance());
            swapped++;
            click = piece.set.getPluginData('clickProperty');
        }
        if (swapped) r.components.push({ name: set.name, count: swapped, click });
    }
    return r;
}

function playgroundGuide(frame, r) {
    const box = hugFrame('How to use this playground', 'VERTICAL', 14);
    box.paddingTop = box.paddingBottom = box.paddingLeft = box.paddingRight = 32;
    box.fills = [{ type: 'SOLID', color: { r: 1, g: 0.98, b: 0.9 } }];
    box.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.8, b: 0.5 } }];
    box.cornerRadius = 12;
    const add = (text, size, bold) => {
        const t = caption(text, size, bold);
        if (!t) return;
        box.appendChild(t);
        t.resize(456, t.height);
        t.textAutoResize = 'HEIGHT';
    };
    add('How to use this playground', 24, true);
    add('1. Click the screen to the right so it is selected.', 14, false);
    add('2. Press Present: the ▶ button at the top right of Figma, or ⌥⌘↵ (Ctrl+Alt+Enter on Windows).', 14, false);
    add('3. Use it like the app:', 14, false);
    add(
        [
            r.modes
                ? `• Switch the machine state with the bar under the screen (${r.modes.join(', ')}): everything that depends on it changes at once.`
                : '',
            r.sections ? `• Click a section in the side menu to open it and jump the list to it, as in the app. (Once there, sections above it are reached by clicking them, not by scrolling up.)` : '',
            r.tabs ? `• Click a tab to switch to it (${r.tabs} tab group${r.tabs === 1 ? '' : 's'}).` : '',
            r.menus.length ? `• Click a menu button to open it, and anywhere to close it: ${r.menus.join(', ')}.` : '',
            r.components.length
                ? `• Click these to change their state: ${r.components
                      .map((c) => (c.click ? `${c.name.split('/').pop()} (${c.click})` : c.name.split('/').pop()))
                      .join(', ')}.`
                : '',
        ]
            .filter(Boolean)
            .join('\n') || '• Nothing on this screen could be made clickable.',
        14,
        false,
    );
    if (r.menusUnknown)
        add('This screen was imported before menus could be placed; import its capture again with the playground on to make its menus open.', 12, false);
    if (r.noStorybook)
        add('Import a Storybook capture too (Storybook in the launcher), and components here that look the same as one of its states become clickable.', 12, false);
    else if (r.otherTheme && !r.components.length)
        add(`The Storybook capture in this file is ${r.otherTheme.toLowerCase()} and this screen isn't, so its components weren't swapped in. Capture Storybook in the same theme to add them.`, 12, false);
    else
        add('Only components showing exactly what a Storybook state shows can be swapped in; ones with other text or data (DROs, labels) stay as captured.', 12, false);
    add('Showing a particular state', 16, true);
    add(
        'Leave Present mode (Esc). ⌘-click (Ctrl-click) a component in the screen to select it, then set its controls in the right-hand panel. Tab groups have a Tab control.',
        14,
        false,
    );
    add('Keep the "Playground components" page: the components and menus here come from it.', 12, false);
    return box;
}

/* -------------------------------------------------------------------- */
/* Machine states                                                       */
/* -------------------------------------------------------------------- */

// A capture taken with --modes holds the screen once per machine state.
// Each becomes a screen of its own; a playground combines them again.
function expandModes(doc) {
    if (!doc.modes || doc.modes.length < 2) return [doc];
    const group = `${doc.source.url} ${doc.source.capturedAt}`;
    return doc.modes.map((m, i) =>
        Object.assign({}, doc, {
            root: m.root,
            states: m.states || [],
            modes: undefined,
            mode: m.name,
            modeLabel: m.label,
            modeGroup: group,
            modeOrder: i,
        }),
    );
}

const BAR_HEIGHT = 64;

// Tab groups built for one machine state, reused by the states that show the
// same: `${modeGroup}|${mode}|${state key}` → { st, set, components }.
const sharedTabs = new Map();
// The same for menus: `${modeGroup}|${mode}|${state key}` → component.
const sharedPopovers = new Map();

// The bar under a playground screen: one button per machine state, this
// one highlighted. Returns the bar and its buttons.
function modeBar(labels, current, width) {
    const bar = figma.createFrame();
    bar.name = 'Machine state';
    bar.layoutMode = 'HORIZONTAL';
    bar.primaryAxisSizingMode = 'FIXED';
    bar.counterAxisSizingMode = 'FIXED';
    bar.counterAxisAlignItems = 'CENTER';
    bar.itemSpacing = 8;
    bar.paddingLeft = bar.paddingRight = 16;
    bar.fills = [{ type: 'SOLID', color: { r: 0.12, g: 0.13, b: 0.16 } }];
    bar.resize(width, BAR_HEIGHT);
    const title = caption('Machine state', 13, true);
    if (title) {
        title.fills = [{ type: 'SOLID', color: { r: 0.75, g: 0.77, b: 0.8 } }];
        bar.appendChild(title);
    }
    const buttons = labels.map((label, i) => {
        const b = figma.createFrame();
        b.name = label;
        b.layoutMode = 'HORIZONTAL';
        b.primaryAxisSizingMode = 'AUTO';
        b.counterAxisSizingMode = 'AUTO';
        b.paddingLeft = b.paddingRight = 14;
        b.paddingTop = b.paddingBottom = 8;
        b.cornerRadius = 6;
        const on = i === current;
        b.fills = on ? [{ type: 'SOLID', color: { r: 0.15, g: 0.45, b: 0.95 } }] : [];
        b.strokes = [{ type: 'SOLID', color: on ? { r: 0.15, g: 0.45, b: 0.95 } : { r: 0.4, g: 0.42, b: 0.46 } }];
        b.strokeWeight = 1;
        const t = caption(label, 13, on);
        if (t) {
            t.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            b.appendChild(t);
        }
        bar.appendChild(b);
        return b;
    });
    return { bar, buttons };
}

// Each button of each variant's Machine state bar changes to the variant
// with that state. Returns how many buttons were wired.
async function wireModeBar(set) {
    const variants = set.children.filter((c) => c.type === 'COMPONENT');
    let wired = 0;
    for (const v of variants) {
        // The bar is a direct child of each state.
        const bar = v.children.find((n) => n.name === 'Machine state' && n.type === 'FRAME');
        if (!bar) continue;
        for (const b of bar.children) {
            if (b.type !== 'FRAME') continue;
            const to = variants.find((c) => variantProps(c)['Machine state'] === b.name);
            if (!to || to === v) continue;
            try {
                await b.setReactionsAsync(click([changeTo(to)]));
                wired++;
            } catch (e) {
                console.warn('machine state button not wired', b.name, e);
            }
        }
    }
    return wired;
}

// Machine-state screens imported before the bar was wired correctly.
async function repairModeBars() {
    await figma.loadAllPagesAsync();
    let wired = 0;
    for (const set of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }))
        if (set.getPluginData('machineStates') === '1' || / — machine states$/.test(set.name))
            wired += await wireModeBar(set);
    return wired;
}

// Several machine states of one screen, already playgrounds each, become
// one component with a "Machine state" property and a bar of buttons
// under the screen that switch it. Returns what placePlayground needs.
async function combineModes(group, parts) {
    progress(`Combining ${group.length} machine states into one screen…`);
    group.sort((a, b) => Number(a.frame.getPluginData('modeOrder')) - Number(b.frame.getPluginData('modeOrder')));
    const labels = group.map((e) => e.frame.getPluginData('modeLabel') || e.frame.name);
    const first = group[0].frame;
    const w = first.width;
    const h = first.height;
    const section = figma.createSection();
    section.name = `Playground — machine states of ${first.name.replace(/ · [^·]+$/, '')}`;
    const comps = [];
    for (let i = 0; i < group.length; i++) {
        const wrap = figma.createFrame();
        wrap.name = `Machine state=${labels[i]}`;
        wrap.fills = [];
        wrap.clipsContent = true;
        wrap.resize(w, h + BAR_HEIGHT);
        section.appendChild(wrap);
        wrap.appendChild(group[i].frame);
        group[i].frame.x = 0;
        group[i].frame.y = 0;
        const { bar } = modeBar(labels, i, w);
        wrap.appendChild(bar);
        bar.x = 0;
        bar.y = h;
        comps.push(figma.createComponentFromNode(wrap));
    }
    const set = figma.combineAsVariants(comps, section);
    set.name = `${first.name.replace(/ · [^·]+$/, '')} — machine states`;
    set.setPluginData('machineStates', '1');
    // Only now: Figma takes "Change to" between variants of one set only.
    await wireModeBar(set);
    layoutVariants(set, comps);
    section.resizeWithoutConstraints(set.width + SECTION_PADDING * 2, set.height + SECTION_PADDING * 2);
    set.x = SECTION_PADDING;
    set.y = SECTION_PADDING;
    // Kept on the Playground page, below the playground: the menus its
    // screens open are there, and links between pages are not to be trusted.

    // What gets presented: an instance of the first state.
    const play = figma.createFrame();
    play.name = `${first.name.replace(/ · [^·]+$/, '')} — playground`;
    play.fills = [];
    play.resize(w, h + BAR_HEIGHT);
    play.appendChild(set.defaultVariant.createInstance());

    // One note and one set of menus for all the states.
    const holder = group[0].holder;
    for (const e of group.slice(1)) {
        for (const o of [...e.holder.children]) holder.appendChild(o);
        e.holder.remove();
    }
    // A menu that differs between states has an overlay per state; say which.
    const names = {};
    for (const o of holder.children) names[o.name] = (names[o.name] || 0) + 1;
    group.forEach((e, i) => {
        for (const o of holder.children)
            if (names[o.name.replace(/ \([^)]*\)$/, '')] > 1 && !/\)$/.test(o.name) && e.menuIds && e.menuIds.includes(o.id))
                o.name += ` (${labels[i]})`;
    });
    const merged = { tabs: 0, menus: [], components: [], modes: labels };
    const seen = new Set();
    for (const e of group) {
        merged.tabs = Math.max(merged.tabs, e.result.tabs);
        merged.sections = merged.sections || e.result.sections;
        for (const m of e.result.menus) if (!merged.menus.includes(m)) merged.menus.push(m);
        for (const c of e.result.components)
            if (!seen.has(c.name)) {
                seen.add(c.name);
                merged.components.push(c);
            }
        merged.noStorybook = merged.noStorybook || e.result.noStorybook;
        merged.otherTheme = merged.otherTheme || e.result.otherTheme;
        merged.menusUnknown = merged.menusUnknown || e.result.menusUnknown;
        e.guide.remove();
    }
    const guide = playgroundGuide(play, merged);
    for (const e of group) {
        e.frame.setPluginData('playMenus', JSON.stringify(merged.menus));
        e.frame.setPluginData('modeLabels', JSON.stringify(labels));
        e.frame.setPluginData('guide', guide.id);
    }
    return { frame: play, guide, holder, statesSection: section };
}

// Moves what an import made into place: screens and their menus on the
// Playground page, component sets on the parts page.
async function placePlayground(given, partsSections) {
    const page = await pageNamed(PLAYGROUND_PAGE);
    const parts = await pageNamed(PARTS_PAGE);
    // Machine states of one screen are combined into one playground.
    const groups = new Map();
    for (const e of given) {
        const key = e.frame.getPluginData('modeGroup') || e.frame.id;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
    }
    progress('Placing the playground…');
    const entries = [];
    for (const group of groups.values())
        entries.push(group.length > 1 ? await combineModes(group, partsSections) : group[0]);
    let px = 0;
    for (const n of parts.children) px = Math.max(px, n.x + n.width + 200);
    for (const s of partsSections) {
        parts.appendChild(s);
        s.x = px;
        s.y = 0;
        px += s.width + 200;
    }
    // Right of what was on the page before this import.
    const moving = new Set();
    for (const e of entries) {
        for (const n of [e.frame, e.guide]) moving.add(n.id);
        for (const o of e.holder.children) moving.add(o.id);
    }
    let x = 0;
    for (const n of page.children)
        if (!moving.has(n.id)) x = Math.max(x, n.x + n.width + 400);
    const placed = [];
    for (const { frame, guide, holder, statesSection } of entries) {
        const section = figma.createSection();
        section.name = `Playground — ${frame.name}`;
        page.appendChild(section);
        section.appendChild(guide);
        section.appendChild(frame);
        guide.x = SECTION_PADDING;
        guide.y = SECTION_PADDING;
        frame.x = guide.x + guide.width + 80;
        frame.y = SECTION_PADDING;
        let w = frame.x + frame.width;
        let h = Math.max(guide.y + guide.height, frame.y + frame.height);
        holder.remove();
        section.resizeWithoutConstraints(w + SECTION_PADDING, h + SECTION_PADDING);
        section.x = x;
        section.y = 0;
        let below = section.height + 600;
        let widest = section.width;
        if (statesSection) {
            page.appendChild(statesSection);
            statesSection.name = 'Machine states (used by the playground above; keep)';
            statesSection.x = x;
            statesSection.y = below;
            below += statesSection.height + 600;
            widest = Math.max(widest, statesSection.width);
        }
        const menus = menuSection(holder.children);
        if (menus) {
            page.appendChild(menus);
            menus.x = x;
            menus.y = below;
            widest = Math.max(widest, menus.width);
        }
        x += widest + 400;
        placed.push(section);
        try {
            page.flowStartingPoints = page.flowStartingPoints
                .filter((f) => f.nodeId !== frame.id)
                .concat([{ nodeId: frame.id, name: frame.name }]);
        } catch (e) {
            console.warn('flow not added', e);
        }
    }
    if (figma.currentPage !== page) await figma.setCurrentPageAsync(page);
    return placed;
}

// Screens already made into playgrounds.
function playgroundScreens() {
    // Machine-state screens live in their component on the parts page.
    return figma.root.children
        .filter((p) => p.name === PLAYGROUND_PAGE || p.name === PARTS_PAGE)
        .reduce(
            (all, p) =>
                all.concat(
                    p
                        .findAllWithCriteria({ types: ['FRAME'], pluginData: { keys: ['playground'] } })
                        .filter((n) => n.getPluginData('playground') === '1'),
                ),
            [],
        );
}

// Swaps a playground's note for a new one, in the same place.
async function replaceGuide(frame, guide) {
    const id = frame.getPluginData('guide');
    let old = id ? await figma.getNodeByIdAsync(id) : null;
    if (!old && frame.parent) old = frame.parent.children.find((n) => n.name === 'How to use this playground');
    if (!old || !old.parent) {
        guide.remove();
        return;
    }
    const section = old.parent;
    frame.setPluginData('guide', guide.id);
    section.insertChild(section.children.indexOf(old), guide);
    guide.x = old.x;
    guide.y = old.y;
    old.remove();
    if (section.type === 'SECTION') {
        let w = 0;
        let h = 0;
        for (const n of section.children) {
            w = Math.max(w, n.x + n.width);
            h = Math.max(h, n.y + n.height);
        }
        section.resizeWithoutConstraints(w + SECTION_PADDING, h + SECTION_PADDING);
    }
}

// Makes playgrounds of `frames`: new ones move to the Playground page with
// their tabs & menus; ones that already are get their tabs and components
// redone (after a newer Storybook import, say). `parts` are sections to
// move to the parts page.
async function playgroundize(frames, parts) {
    await storyFonts();
    const ctx = { pieces: new Map(), looks: new Map(), section: null, seenMains: new Set() };
    const fresh = [];
    const results = [];
    for (const frame of frames) {
        progress(`Making ${frame.name} interactive…`);
        const again = frame.getPluginData('playground') === '1';
        const built = await builtFrom(frame);
        const holder = again ? null : menuList();
        // One overlay per distinct menu, whichever machine state opens it.
        if (holder) holder.byMenu = ctx.overlays || (ctx.overlays = new Map());
        const r = await makePlayground(frame, built, holder, ctx, again);
        r.group = frame.getPluginData('modeGroup') || frame.id;
        r.hasModes = !!frame.getPluginData('modeGroup');
        frame.setPluginData('playground', '1');
        if (again) {
            try {
                r.menus = JSON.parse(frame.getPluginData('playMenus') || '[]');
                const modes = JSON.parse(frame.getPluginData('modeLabels') || 'null');
                if (modes) r.modes = modes;
            } catch (e) {}
            await replaceGuide(frame, playgroundGuide(frame, r));
        } else {
            frame.setPluginData('playMenus', JSON.stringify(r.menus));
            const guide = playgroundGuide(frame, r);
            frame.setPluginData('guide', guide.id);
            fresh.push({ frame, guide, holder, result: r, menuIds: holder.children.map((o) => o.id) });
            if (built.section && pageOf(built.section) && pageOf(built.section).name !== PARTS_PAGE)
                parts.push(built.section);
        }
        results.push(r);
    }
    if (ctx.section) parts.push(ctx.section);
    const placed = await placePlayground(fresh, parts);
    if (!placed.length && frames.length) {
        const page = pageOf(frames[0]);
        if (page && figma.currentPage !== page) await figma.setCurrentPageAsync(page);
        placed.push(...frames.map((f) => f.parent));
    }
    return { placed, results };
}

function playgroundSummary(results) {
    // The machine states of one screen count once.
    const screens = new Map();
    for (const r of results) {
        const s = screens.get(r.group) || { tabs: 0, menus: new Set(), components: new Map(), modes: r.hasModes };
        s.tabs = Math.max(s.tabs, r.tabs);
        r.menus.forEach((m) => s.menus.add(m));
        r.components.forEach((c) => s.components.set(c.name, Math.max(s.components.get(c.name) || 0, c.count)));
        screens.set(r.group, s);
    }
    let t = 0;
    let m = 0;
    let c = 0;
    let modes = 0;
    for (const s of screens.values()) {
        t += s.tabs;
        m += s.menus.size;
        for (const n of s.components.values()) c += n;
        if (s.modes) modes++;
    }
    const states = modes ? ` (${modes} with a machine-state bar)` : '';
    return ` Playground: ${screens.size} screen(s)${states}, ${t} tab group(s), ${m} menu(s) and ${c} component(s) clickable. Open the Playground page, select a screen and press Present (⌥⌘↵); the note beside it says what to try.`;
}

function storySummary(r) {
    if (!r.inFile)
        return 'No Storybook capture in this file yet. Capture one (Storybook in the launcher) and import it; its states then show up beside the screens that use those components.';
    if (!r.withStates)
        return `None of the ${r.screens} screen(s) show a component that has Storybook states.`;
    return `Placed the states of ${r.sets} Storybook component(s) beneath ${r.withStates} of ${r.screens} screen(s).`;
}

/* -------------------------------------------------------------------- */
/* Tabs & popovers                                                      */
/* -------------------------------------------------------------------- */

const SECTION_PADDING = 80;
const STATE_GAP = 80;

// Tab groups become a component set with a variant per tab, and the screen
// gets an instance of the selected tab in place of the static copy, so the
// tab can be switched from the instance's properties. Popovers, menus and
// dialogs become components laid out beside the screen.
async function buildStates(states, frame, state) {
    const section = figma.createSection();
    section.name = `${frame.name} — tabs & menus`;
    let y = SECTION_PADDING;
    let width = 0;
    const place = (node) => {
        section.appendChild(node);
        node.x = SECTION_PADDING;
        node.y = y;
        y += node.height + STATE_GAP;
        width = Math.max(width, node.width);
    };

    for (const tabState of states.filter((s) => s.kind === 'tabs')) {
        let st = tabState;
        const doc = state.doc;
        let components = [];
        let set = null;
        // A machine state whose tabs look just like an earlier state's (the
        // plugin UI marks them) uses that state's component set, so a big
        // tab group (the Configuration page's) is built once, not six times.
        const shared = st.sameAs && sharedTabs.get(`${doc.modeGroup}|${st.sameAs}|${st.key}`);
        if (st.sameAs && !shared) continue;
        if (shared) {
            ({ st, set, components } = shared);
            sharedTabs.set(`${doc.modeGroup}|${doc.mode}|${st.key}`, shared);
        }
        if (!shared) {
        progress(`Building ${st.name} variants…`);
        for (const o of st.options) {
            const built = await build(o.node, state);
            applyBackdrop(built, o.node, state);
            const comp = figma.createComponentFromNode(built);
            comp.name = `${st.property}=${variantValue(o.value)}`;
            components.push(comp);
        }
        set = figma.combineAsVariants(components, section);
        set.name = st.name;
        set.setPluginData(
            'tabs',
            JSON.stringify({ property: st.property, values: st.options.map((o) => variantValue(o.value)) }),
        );
        state.built.tabs.push({ st, set, components });
        set.layoutMode = 'VERTICAL';
        set.primaryAxisSizingMode = 'AUTO';
        set.counterAxisSizingMode = 'AUTO';
        set.itemSpacing = 80;
        set.paddingTop =
            set.paddingRight =
            set.paddingBottom =
            set.paddingLeft =
                40;
        place(set);
        if (doc.modeGroup) sharedTabs.set(`${doc.modeGroup}|${doc.mode}|${st.key}`, { st, set, components });
        }

        // Swap the static copy in the screen for a switchable instance.
        const original = state.stateNodes[st.key];
        const selected = st.options.findIndex((o) => o.selected);
        if (original && original.parent && selected >= 0) {
            const inst = components[selected].createInstance();
            const parent = original.parent;
            const absolute = original.layoutPositioning === 'ABSOLUTE';
            const { grown, shownHeight } = st.options[selected].node;
            // Variants hold the panel's full scrolled content; the screen
            // shows only what fit, so clip the instance to that height.
            let view = inst;
            if (shownHeight && inst.height > shownHeight + 0.5) {
                view = figma.createFrame();
                view.name = original.name;
                view.fills = [];
                view.clipsContent = true;
                // The panel scrolled in the app, so it scrolls in Present mode.
                view.overflowDirection = 'VERTICAL';
                view.resize(inst.width, shownHeight);
                view.appendChild(inst);
                inst.x = 0;
                inst.y = 0;
            }
            let placed = view;
            if (grown && parent.layoutMode && parent.layoutMode !== 'NONE' &&
                !absolute) {
                // The component covers more than the panel it replaces (its
                // tab strip hangs outside); hold it in a box the panel's size
                // so the auto layout around it doesn't move.
                placed = figma.createFrame();
                placed.name = original.name;
                placed.fills = [];
                placed.clipsContent = false;
                placed.resize(original.width, original.height);
                placed.layoutAlign = original.layoutAlign;
                placed.layoutGrow = original.layoutGrow;
                placed.appendChild(view);
                view.x = -grown.x;
                view.y = -grown.y;
            }
            parent.insertChild(parent.children.indexOf(original), placed);
            if (absolute) placed.layoutPositioning = 'ABSOLUTE';
            if (placed === view) {
                view.x = original.x - (grown ? grown.x : 0);
                view.y = original.y - (grown ? grown.y : 0);
            }
            original.remove();
            // A scrolling list a section menu can jump through.
            if (view !== inst) (state.scrollViews = state.scrollViews || []).push({ placed, view, inst });
        }
    }

    for (const st of states.filter((s) => s.kind === 'sections')) await buildSections(st, frame, state, place);

    const sharedHere = [];
    for (const st of states.filter((s) => s.kind === 'popover')) {
        const doc = state.doc;
        if (st.sameAs) {
            // Built for an earlier machine state; this screen opens that one.
            const shared = sharedPopovers.get(`${doc.modeGroup}|${st.sameAs}|${st.sameKey}`);
            if (shared) {
                sharedPopovers.set(`${doc.modeGroup}|${doc.mode}|${st.key}`, shared);
                sharedHere.push(shared.id);
            }
            continue;
        }
        progress(`Building ${st.name}…`);
        const built = await build(st.node, state);
        applyBackdrop(built, st.node, state);
        const comp = figma.createComponentFromNode(built);
        comp.name = `Popover / ${st.name}`;
        // Where it opened from and where it showed, relative to the screen,
        // so a playground can be made from this screen later.
        const ox = state.doc.root.x || 0;
        const oy = state.doc.root.y || 0;
        if (st.trigger)
            comp.setPluginData(
                'popover',
                JSON.stringify({
                    name: st.name,
                    trigger: { x: st.trigger.x - ox, y: st.trigger.y - oy, w: st.trigger.w, h: st.trigger.h },
                    at: { x: st.node.x - ox, y: st.node.y - oy },
                }),
            );
        state.built.popovers.push({ st, comp });
        if (doc.modeGroup) sharedPopovers.set(`${doc.modeGroup}|${doc.mode}|${st.key}`, comp);
        place(comp);
    }
    if (sharedHere.length) state.sharedPopovers = sharedHere;

    section.resizeWithoutConstraints(
        width + SECTION_PADDING * 2,
        Math.max(y - STATE_GAP + SECTION_PADDING, 1),
    );
    return section;
}

// A side menu that opens one section at a time (gSender's Configuration
// page). It becomes a component with a variant per section: the menu as the
// capture recorded it with that section open, beside the scrolling list
// moved to that section's heading. Clicking an item changes to its variant,
// the way the app opens it and scrolls there. (Figma can't scroll to a
// layer inside a component copy, so the list is moved instead: in a
// section's variant the sections above it are out of reach until another
// item is clicked.)
async function buildSections(st, frame, state, place) {
    const doc = state.doc;
    const menu = state.stateNodes[st.key];
    if (!menu || !menu.parent) return;
    const mb = boxIn(menu, frame);
    // The list it scrolls: the scrolling list to its right.
    const list = (state.scrollViews || [])
        .map((v) => ({ v, b: boxIn(v.placed, frame) }))
        .filter((x) => x.b && x.b.x >= mb.x + mb.w - 4)
        .sort((a, b) => a.b.x - b.b.x)[0];
    let set;
    let components;
    const shared = st.sameAs && sharedTabs.get(`${doc.modeGroup}|${st.sameAs}|${st.key}`);
    if (st.sameAs && !shared) return;
    const u = list
        ? {
              x: Math.min(mb.x, list.b.x),
              y: Math.min(mb.y, list.b.y),
              r: Math.max(mb.x + mb.w, list.b.x + list.b.w),
              b: Math.max(mb.y + mb.h, list.b.y + list.b.h),
          }
        : { x: mb.x, y: mb.y, r: mb.x + mb.w, b: mb.y + mb.h };
    if (shared) {
        ({ set, components } = shared);
        st = shared.st;
    } else {
        progress(`Building ${st.name} sections…`);
        // Headings in the list, to move it to.
        let heads = new Map();
        if (list) {
            const main = await list.v.inst.getMainComponentAsync();
            const texts = main ? ownLayers(main).filter((n) => n.type === 'TEXT' && typeof n.fontSize === 'number') : [];
            const biggest = texts.reduce((m, t) => Math.max(m, t.fontSize), 0);
            for (const t of texts) {
                if (t.fontSize < Math.max(18, biggest * 0.75)) continue;
                const b = boxIn(t, main);
                const k = t.characters.trim().toLowerCase();
                if (b && k && !heads.has(k)) heads.set(k, b.y);
            }
        }
        components = [];
        for (const [k, o] of st.options.entries()) {
            progress(`Building ${st.name} sections (${k + 1}/${st.options.length}: ${o.value})…`);
            const wrap = figma.createFrame();
            wrap.name = `${st.property}=${variantValue(o.value)}`;
            wrap.fills = [];
            wrap.clipsContent = true;
            wrap.resize(Math.max(1, u.r - u.x), Math.max(1, u.b - u.y));
            const built = await build(o.node, state);
            applyBackdrop(built, o.node, state);
            wrap.appendChild(built);
            built.x = mb.x - u.x;
            built.y = mb.y - u.y;
            if (list) {
                const copy = list.v.placed.clone();
                wrap.appendChild(copy);
                copy.x = list.b.x - u.x;
                copy.y = list.b.y - u.y;
                const head = heads.get(String(o.value).trim().toLowerCase());
                const view = copy.type === 'FRAME' && copy.overflowDirection === 'VERTICAL'
                    ? copy
                    : copy.findOne((n) => n.type === 'FRAME' && n.overflowDirection === 'VERTICAL');
                const inst = view && view.children.find((c) => c.type === 'INSTANCE');
                if (inst && head !== undefined) inst.y = -Math.max(0, head - 16);
            }
            components.push(figma.createComponentFromNode(wrap));
        }
        set = figma.combineAsVariants(components, figma.currentPage);
        set.name = `${st.name} — sections`;
        set.layoutMode = 'VERTICAL';
        set.primaryAxisSizingMode = 'AUTO';
        set.counterAxisSizingMode = 'AUTO';
        set.itemSpacing = 80;
        set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 40;
        place(set);
        // Each item changes to its section's variant.
        const norm = (t) => String(t).trim().toLowerCase();
        for (const comp of components) {
            const menuPart = comp.children[0];
            const texts = ownLayers(menuPart).filter((n) => n.type === 'TEXT');
            for (let j = 0; j < st.options.length; j++) {
                const to = components[j];
                if (to === comp) continue;
                const text = texts.find((t) => norm(t.characters) === norm(st.options[j].value));
                if (!text) continue;
                // The whole menu row, not just its word.
                let target = text;
                for (let p = text.parent; p && p !== menuPart; p = p.parent) if (p.type === 'FRAME' && p.height < 60) target = p;
                try {
                    await target.setReactionsAsync(click([changeTo(to)]));
                } catch (e) {
                    console.warn('section not wired', st.options[j].value, e);
                }
            }
        }
        if (doc.modeGroup) sharedTabs.set(`${doc.modeGroup}|${doc.mode}|${st.key}`, { st, set, components });
    }
    if (shared && doc.modeGroup) sharedTabs.set(`${doc.modeGroup}|${doc.mode}|${st.key}`, shared);
    // In the screen: an instance of the open section, over the menu and the
    // list, which stay (invisibly) so the layout around them doesn't move.
    const selected = Math.max(0, st.options.findIndex((o) => o.selected));
    const inst = components[selected].createInstance();
    inst.name = `${st.name} (sections)`;
    frame.appendChild(inst);
    if (frame.layoutMode && frame.layoutMode !== 'NONE') inst.layoutPositioning = 'ABSOLUTE';
    inst.x = u.x;
    inst.y = u.y;
    menu.opacity = 0;
    if (list) list.v.placed.opacity = 0;
    (state.sectionsBuilt = state.sectionsBuilt || []).push(st.options.length);
}

// A tab panel or menu with no background of its own shows the colour of the
// box behind it in the app, so the component looks right on the canvas.
function applyBackdrop(node, data, state) {
    if (!state.options.backdrops || !data.backdrop || data.fills) return;
    node.fills = [solidPaint(data.backdrop.color, data.backdrop.token, state)];
}

// `=` and `,` delimit variant properties in Figma.
function variantValue(v) {
    return String(v).replace(/[=,]/g, '-').trim() || 'Untitled';
}

function countNodes(n) {
    let c = 1;
    for (const ch of n.children || []) c += countNodes(ch);
    return c;
}

// Drop boxes that paint nothing and have no children, and wrappers whose
// single child occupies exactly the same box.
function simplify(n, isRoot) {
    if (n.children) {
        const kids = [];
        for (const c of n.children) {
            const s = simplify(c, false);
            if (s) kids.push(s);
        }
        n.children = kids;
    }
    if (isRoot || n.type !== 'FRAME') return n;
    const paints =
        n.fills ||
        n.stroke ||
        n.effects ||
        n.clipPath ||
        n.stateKey ||
        (n.opacity !== undefined && n.opacity < 1);
    if (paints) return n;
    if (!n.children.length) return null;
    if (n.children.length === 1) {
        const c = n.children[0];
        const same =
            Math.abs(c.x - n.x) < 0.5 &&
            Math.abs(c.y - n.y) < 0.5 &&
            Math.abs(c.w - n.w) < 0.5 &&
            Math.abs(c.h - n.h) < 0.5;
        if (
            same &&
            !(n.clip && c.type === 'FRAME' && c.children && c.children.length)
        ) {
            // Keep whichever name came from a component rather than a bare tag.
            if (
                c.type === 'FRAME' &&
                /^[a-z0-9]+(\s|$)/.test(c.name) &&
                !/^[a-z0-9]+(\s|$)/.test(n.name)
            )
                c.name = n.name;
            if (n.absolute) c.absolute = true;
            // The wrapper's components still render what's left.
            if (n.react)
                c.react = (c.react || []).concat(
                    n.react.filter((r) => !(c.react || []).includes(r)),
                );
            return c;
        }
    }
    return n;
}

async function tick(state) {
    state.done++;
    if (state.done % 150 === 0) {
        progress(`Building ${state.done}/${state.total} layers…`);
        await new Promise((r) => setTimeout(r, 0));
    }
}

async function build(data, state) {
    await tick(state);
    let node;
    if (data.type === 'TEXT') node = buildText(data, state);
    else if (data.type === 'SVG') node = buildSvg(data);
    else node = figma.createFrame();

    if (data.type === 'FRAME' || data.type === 'IMAGE') {
        node.name = data.name || 'frame';
        node.resize(Math.max(0.01, data.w), Math.max(0.01, data.h));
        node.clipsContent = !!data.clip || data.type === 'IMAGE';
        applyBox(node, data, state);
        if (data.classes) node.setPluginData('classes', data.classes);
        if (data.react) node.setPluginData('react', data.react.join(','));
    }
    if (data.stateKey) state.stateNodes[data.stateKey] = node;

    if (data.type === 'FRAME' && data.children) {
        const placed = data.clipPath ? applyClipPath(node, data) : [];
        for (const child of data.children) {
            const c = await build(child, state);
            node.appendChild(c);
            // Children are positioned relative to their parent.
            c.x =
                child.x -
                data.x +
                (child.type === 'TEXT'
                    ? Number(c.getPluginData('dx') || 0) +
                      grownTextShift(child, c, data)
                    : 0);
            c.y =
                child.y -
                data.y +
                (child.type === 'TEXT' ? textYOffset(child) : 0);
            placed.push({ node: c, data: child, x: c.x, y: c.y });
        }
        if (state.options.autoLayout && data.layout)
            applyAutoLayout(node, data.layout, placed);
        for (const p of placed) {
            if (p.w === undefined) continue;
            if (p.node.width !== p.w || p.node.height !== p.h)
                p.node.resize(p.w, p.h);
            p.node.x = p.x;
            p.node.y = p.y;
        }
    }
    return node;
}

/* -------------------------------------------------------------------- */
/* Boxes                                                                */
/* -------------------------------------------------------------------- */

function rgb(c) {
    return { r: clamp01(c.r), g: clamp01(c.g), b: clamp01(c.b) };
}
function rgba(c) {
    return {
        r: clamp01(c.r),
        g: clamp01(c.g),
        b: clamp01(c.b),
        a: clamp01(c.a),
    };
}
function clamp01(v) {
    return Math.max(0, Math.min(1, v));
}

function solidPaint(color, token, state) {
    let paint = { type: 'SOLID', color: rgb(color), opacity: clamp01(color.a) };
    const vars = state.colorVars && state.colorVars.vars;
    // Only opaque tokens are bound: a variable's alpha and the paint's
    // opacity would otherwise both apply.
    if (token && vars && vars[token] && color.a > 0.999) {
        paint = figma.variables.setBoundVariableForPaint(
            paint,
            'color',
            vars[token],
        );
    }
    return paint;
}

function gradientPaint(g, w, h) {
    const stops = g.stops.map((s) => ({
        position: s.position,
        color: rgba(s.color),
    }));
    if (g.type === 'GRADIENT_RADIAL') {
        return {
            type: 'GRADIENT_RADIAL',
            gradientTransform: [
                [1, 0, 0],
                [0, 1, 0],
            ],
            gradientStops: stops,
        };
    }
    // Gradient line in pixels (CSS: 0deg points up, clockwise), then map the
    // node's unit square onto Figma's gradient space where t runs along x.
    const a = (g.angle * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const len = Math.abs(w * dx) + Math.abs(h * dy);
    const sx = w / 2 - (dx * len) / 2;
    const sy = h / 2 - (dy * len) / 2;
    const ex = dx * len;
    const ey = dy * len;
    // G maps gradient space (u, v) → normalised node space; Figma wants G⁻¹.
    const G = [
        [ex / w, -ey / w, sx / w + (0.5 * ey) / w],
        [ey / h, ex / h, sy / h - (0.5 * ex) / h],
    ];
    return {
        type: 'GRADIENT_LINEAR',
        gradientTransform: invert(G),
        gradientStops: stops,
    };
}

function invert(m) {
    const [[a, b, c], [d, e, f]] = m;
    const det = a * e - b * d || 1e-9;
    return [
        [e / det, -b / det, (b * f - c * e) / det],
        [-d / det, a / det, (c * d - a * f) / det],
    ];
}

function imagePaint(img, state) {
    if (!img || !img.src) return null;
    let hash = state.imageHashes[img.src];
    if (!hash) {
        const b64 = img.src.slice(img.src.indexOf(',') + 1);
        try {
            hash = figma.createImage(figma.base64Decode(b64)).hash;
        } catch (e) {
            // Unsupported format or larger than Figma's 4096px limit.
            console.warn('image skipped', e);
            return null;
        }
        state.imageHashes[img.src] = hash;
    }
    return { type: 'IMAGE', imageHash: hash, scaleMode: img.fit || 'FILL' };
}

function applyBox(node, data, state) {
    const fills = [];
    if (data.raster) {
        // The screenshot already contains the element's own background and border.
        const p = imagePaint(data.image, state);
        if (p) fills.push(p);
        else
            fills.push({
                type: 'SOLID',
                color: { r: 0.85, g: 0.85, b: 0.85 },
                opacity: 1,
            });
        node.fills = fills;
        if (!p) node.name = `[not captured] ${node.name}`;
    } else {
        for (const f of data.fills || []) {
            try {
                if (f.type === 'SOLID')
                    fills.push(solidPaint(f.color, f.token, state));
                else if (f.type === 'IMAGE') {
                    const p = imagePaint(f, state);
                    if (p) fills.push(p);
                } else fills.push(gradientPaint(f, data.w, data.h));
            } catch (e) {
                console.warn('fill skipped', e);
            }
        }
        if (data.type === 'IMAGE') {
            const p = imagePaint(data.image, state);
            if (p) fills.push(p);
        }
        node.fills = fills;

        if (data.stroke) {
            const s = data.stroke;
            node.strokes = [solidPaint(s.color, s.token, state)];
            node.strokeAlign = 'INSIDE';
            node.strokeTopWeight = s.weights[0];
            node.strokeRightWeight = s.weights[1];
            node.strokeBottomWeight = s.weights[2];
            node.strokeLeftWeight = s.weights[3];
            if (s.dash) node.dashPattern = s.dash;
        }
    }

    if (data.radius) {
        node.topLeftRadius = data.radius[0];
        node.topRightRadius = data.radius[1];
        node.bottomRightRadius = data.radius[2];
        node.bottomLeftRadius = data.radius[3];
    }
    if (data.effects) {
        try {
            node.effects = data.effects.map(effect);
        } catch (e) {
            // Newer API versions require blurType on blur effects.
            node.effects = data.effects
                .map(effect)
                .map((f) =>
                    f.type.endsWith('BLUR')
                        ? Object.assign({ blurType: 'NORMAL' }, f)
                        : f,
                );
        }
    }
    if (data.opacity !== undefined) node.opacity = data.opacity;
}

function effect(e) {
    if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
        return {
            type: e.type,
            color: rgba(e.color),
            offset: { x: e.x, y: e.y },
            radius: Math.max(0, e.blur),
            spread: e.spread,
            visible: true,
            blendMode: 'NORMAL',
        };
    }
    return { type: e.type, radius: e.radius, visible: true };
}

// CSS clip-path → a vector "background" in the clip's shape, carrying the
// frame's own fill and border; box-shadows go, since clip-path cuts those
// off in the browser too.
function applyClipPath(frame, data) {
    const shape = data.clipPath;
    let bg;
    try {
        if (shape.type === 'ellipse') {
            bg = figma.createEllipse();
            bg.resize(
                Math.max(0.01, shape.rx * 2),
                Math.max(0.01, shape.ry * 2),
            );
            bg.x = shape.cx - shape.rx;
            bg.y = shape.cy - shape.ry;
            frame.appendChild(bg);
        } else {
            const d =
                shape.type === 'path'
                    ? shape.d
                    : 'M ' +
                      shape.points.map((p) => p[0] + ' ' + p[1]).join(' L ') +
                      ' Z';
            const svg = figma.createNodeFromSvg(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${data.w}" height="${data.h}" viewBox="0 0 ${data.w} ${data.h}"><path d="${d}" fill="#000"/></svg>`,
            );
            bg = svg.children[0];
            const mx = bg.x;
            const my = bg.y;
            frame.appendChild(bg);
            bg.x = mx;
            bg.y = my;
            svg.remove();
        }
    } catch (e) {
        console.warn('clip-path skipped', e);
        return [];
    }
    // No mask: one over the children hid their text in Figma when the frame
    // used auto layout, and a plain shape is easier to edit anyway. The cost
    // is that children sticking out past the shape's edge aren't clipped.
    bg.name = 'background';
    // Shapes from SVG scale with their frame by default, so switching the
    // frame to auto layout (which resizes it for a moment) shrank and moved
    // this one. Pin it; build() also puts it back once layout is done.
    bg.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    bg.fills = frame.fills;
    bg.strokes = frame.strokes;
    if (frame.strokes.length) {
        bg.strokeAlign = 'INSIDE';
        bg.strokeWeight = Math.max(
            frame.strokeTopWeight,
            frame.strokeRightWeight,
            frame.strokeBottomWeight,
            frame.strokeLeftWeight,
        );
    }
    frame.fills = [];
    frame.strokes = [];
    frame.effects = [];
    // It sits outside any auto layout flow.
    return [
        {
            node: bg,
            data: { absolute: true },
            x: bg.x,
            y: bg.y,
            w: bg.width,
            h: bg.height,
        },
    ];
}

/* -------------------------------------------------------------------- */
/* Auto layout                                                          */
/* -------------------------------------------------------------------- */

// Switch a frame to auto layout, then keep it only if every in-flow child
// ends up where the browser put it. Anything Figma's model can't express
// (margins, flex-grow quirks, baseline alignment, …) falls back to absolute.
function applyAutoLayout(frame, layout, placed) {
    const flow = placed.filter((p) => !p.data.absolute);
    if (!flow.length) return;
    const w = frame.width;
    const h = frame.height;
    try {
        frame.layoutMode = layout.mode;
        frame.primaryAxisSizingMode = 'FIXED';
        frame.counterAxisSizingMode = 'FIXED';
        frame.paddingTop = layout.padding[0];
        frame.paddingRight = layout.padding[1];
        frame.paddingBottom = layout.padding[2];
        frame.paddingLeft = layout.padding[3];
        frame.itemSpacing = layout.gap;
        frame.primaryAxisAlignItems = layout.justify;
        frame.counterAxisAlignItems = layout.align;
        for (const p of placed) {
            if (p.data.absolute) {
                p.node.layoutPositioning = 'ABSOLUTE';
                p.node.x = p.x;
                p.node.y = p.y;
            }
        }
        frame.resize(w, h);
        const ok = flow.every(
            (p) =>
                Math.abs(p.node.x - p.x) <= 2 && Math.abs(p.node.y - p.y) <= 2,
        );
        if (ok) return;
    } catch (e) {
        console.warn('auto layout failed', e);
    }
    for (const p of placed) {
        if (p.node.layoutPositioning === 'ABSOLUTE')
            p.node.layoutPositioning = 'AUTO';
    }
    frame.layoutMode = 'NONE';
    frame.resize(w, h);
    for (const p of placed) {
        p.node.x = p.x;
        p.node.y = p.y;
    }
}

/* -------------------------------------------------------------------- */
/* Text                                                                 */
/* -------------------------------------------------------------------- */

const STYLE_WEIGHTS = [
    [/thin|hairline/, 100],
    [/extralight|ultralight/, 200],
    [/semibold|demibold/, 600],
    [/extrabold|ultrabold/, 800],
    [/light/, 300],
    [/medium/, 500],
    [/bold/, 700],
    [/black|heavy/, 900],
];

function styleWeight(style) {
    const s = style.toLowerCase().replace(/[\s_-]/g, '');
    for (const [re, w] of STYLE_WEIGHTS) if (re.test(s)) return w;
    return 400;
}

let fontIndex = null;
async function getFontIndex() {
    if (fontIndex) return fontIndex;
    fontIndex = {};
    for (const f of await figma.listAvailableFontsAsync()) {
        const key = f.fontName.family.toLowerCase();
        (fontIndex[key] = fontIndex[key] || []).push(f.fontName);
    }
    return fontIndex;
}

function pickFont(index, families, weight, italic, size) {
    for (const fam of families) {
        let candidates = FAMILY_ALIASES[fam.toLowerCase()] || [fam];
        if (size >= SF_DISPLAY_SIZE)
            candidates = candidates.flatMap((c) =>
                c === 'SF Pro Text' ? ['SF Pro Display', c] : [c],
            );
        for (const c of candidates) {
            const styles = index[c.toLowerCase()];
            if (!styles) continue;
            let best = null;
            let bestScore = Infinity;
            for (const fn of styles) {
                const s = fn.style.toLowerCase();
                const isItalic = /italic|oblique/.test(s);
                // Another width (SF Pro lists Compressed, Condensed and
                // Expanded styles in its one family) only as a last resort.
                const score =
                    Math.abs(styleWeight(fn.style) - weight) +
                    (isItalic !== italic ? 1000 : 0) +
                    (/compressed|condensed|narrow|expanded|extended|wide/.test(s)
                        ? 1000
                        : 0) +
                    (/display|rounded/.test(s) ? 50 : 0);
                if (score < bestScore) {
                    best = fn;
                    bestScore = score;
                }
            }
            if (best) return best;
        }
    }
    return null;
}

const failedFonts = [];

async function prepareFonts(roots, override, fontsUsed) {
    const index = await getFontIndex();
    const resolved = {};
    const toLoad = {};
    function visit(n) {
        if (n.type === 'TEXT') {
            const s = n.style;
            const key = fontKey(s);
            if (!resolved[key]) {
                // Monospace stays monospace so numbers keep lining up.
                const mono = /mono|courier|menlo|consolas/i.test(
                    s.families.join(','),
                );
                let families = s.families;
                if (override && !mono) families = [override];
                else if (override && MONO_OVERRIDE[override])
                    families = [MONO_OVERRIDE[override], ...s.families];
                resolved[key] =
                    pickFont(index, families, s.weight, s.italic, s.size) ||
                    FALLBACK_FONT;
                fontsUsed[s.families[0]] = resolved[key].family;
                toLoad[resolved[key].family + '|' + resolved[key].style] =
                    resolved[key];
            }
        }
        for (const c of n.children || []) visit(c);
    }
    roots.forEach(visit);
    toLoad['fallback'] = FALLBACK_FONT;
    for (const k of Object.keys(toLoad)) {
        try {
            await figma.loadFontAsync(toLoad[k]);
        } catch (e) {
            console.warn('font failed', toLoad[k], e);
            failedFonts.push(`${toLoad[k].family} ${toLoad[k].style}`);
            for (const rk of Object.keys(resolved))
                if (resolved[rk] === toLoad[k]) resolved[rk] = FALLBACK_FONT;
            for (const fk of Object.keys(fontsUsed))
                if (fontsUsed[fk] === toLoad[k].family)
                    fontsUsed[fk] = FALLBACK_FONT.family;
        }
    }
    return resolved;
}

function fontKey(s) {
    return (
        s.families.join(',') +
        '|' +
        s.weight +
        '|' +
        s.italic +
        (s.size >= SF_DISPLAY_SIZE ? '|display' : '')
    );
}

function buildText(data, state) {
    const s = data.style;
    const t = figma.createText();
    t.fontName = state.fonts[fontKey(s)] || FALLBACK_FONT;
    // Figma measures local fonts (SF Pro especially) too narrow until it has
    // rendered them, so only fix a width when the font is one Figma bundles.
    // Anything else stays auto-width, which can't wrap.
    const measurable = BUNDLED_FONTS.includes(t.fontName.family);
    t.characters = data.characters;
    t.fontSize = Math.max(1, s.size);
    t.lineHeight = s.lineHeight
        ? { value: s.lineHeight, unit: 'PIXELS' }
        : { unit: 'AUTO' };
    const tracking = /^SF Pro/.test(t.fontName.family) ? sfTracking(s.size) : 0;
    if (s.letterSpacing || tracking)
        t.letterSpacing = {
            value: (s.letterSpacing || 0) + tracking,
            unit: 'PIXELS',
        };
    t.textDecoration = s.decoration;
    t.textCase = s.textCase;
    t.fills = [solidPaint(s.color, s.colorToken, state)];
    if (data.name) t.name = data.name;
    state.texts.push(t);

    if (data.fixedBox) {
        t.textAlignHorizontal = s.align;
        t.textAutoResize = 'NONE';
        t.resize(Math.max(1, data.w), Math.max(1, data.h));
        t.textAlignVertical = data.verticalAlign || 'TOP';
        if (data.truncate) t.textTruncation = 'ENDING';
    } else if (data.multiline) {
        t.textAlignHorizontal = s.align;
        if (data.lines && data.lines.length > 1) {
            // Break exactly where the browser did (U+2028 is a line break
            // within one paragraph), then widen the box if Figma's font runs
            // wider so nothing re-wraps.
            t.characters = data.lines.join('\u2028');
            t.textAutoResize = 'WIDTH_AND_HEIGHT';
            if (!measurable) return t;
            const natural = t.width;
            const width = Math.max(data.w + 1, natural + 1);
            t.textAutoResize = 'HEIGHT';
            t.resize(width, t.height);
            const extra = width - (data.w + 1);
            if (extra > 0 && s.align !== 'LEFT' && s.align !== 'JUSTIFIED') {
                t.setPluginData(
                    'dx',
                    String(s.align === 'CENTER' ? -extra / 2 : -extra),
                );
            }
        } else {
            t.textAutoResize = 'HEIGHT';
            t.resize(Math.max(1, data.w + 1), t.height);
        }
    } else {
        // The measured box hugs the glyphs, so alignment within it is moot.
        t.textAutoResize = 'WIDTH_AND_HEIGHT';
        if (data.truncate) {
            t.textAutoResize = 'NONE';
            t.resize(Math.max(1, data.w), t.height);
            t.textTruncation = 'ENDING';
        } else if (measurable && t.width <= data.w + 0.25) {
            // Fits: pin the browser's width so neighbours don't shift, and
            // keep a centred or right-aligned label where it was.
            const h = t.height;
            t.textAutoResize = 'NONE';
            t.resize(Math.max(1, data.w + 0.25), h);
            t.textAlignHorizontal = data.anchor || 'LEFT';
        }
    }
    return t;
}

// Text set through the API with some local fonts (SF Pro in particular)
// stays blank on canvas until the font is touched. Change each layer's font
// and change it back, with a render in between, so Figma lays it out again.
async function refreshText(roots) {
    // Collect what exists now: swapping tab areas for instances deletes the
    // static copies, and text inside instances must not be overridden.
    const texts = [];
    for (const root of roots) {
        for (const t of root.findAllWithCriteria({ types: ['TEXT'] })) {
            let inInstance = false;
            for (let p = t.parent; p && p !== root; p = p.parent) {
                if (p.type === 'INSTANCE') {
                    inInstance = true;
                    break;
                }
            }
            if (!inInstance && !t.removed) texts.push(t);
        }
    }
    const original = texts.map((t) => ({ font: t.fontName, size: t.fontSize }));
    texts.forEach((t, i) => {
        const o = original[i];
        if (
            o.font.family === FALLBACK_FONT.family &&
            o.font.style === FALLBACK_FONT.style
        ) {
            t.fontSize = o.size + 1;
        } else {
            t.fontName = FALLBACK_FONT;
        }
    });
    await new Promise((r) => setTimeout(r, 50));
    texts.forEach((t, i) => {
        t.fontName = original[i].font;
        t.fontSize = original[i].size;
    });
    return texts;
}

// A one-line label that comes out wider in Figma than in the browser (a
// different font) grows to the right. If it sat centred or right-aligned in
// its parent, keep it that way instead.
function grownTextShift(child, node, parent) {
    if (child.multiline || child.fixedBox) return 0;
    const extra = node.width - child.w;
    if (extra <= 0.5) return 0;
    if (child.anchor === 'CENTER') return -extra / 2;
    if (child.anchor === 'RIGHT') return -extra;
    if (child.anchor) return 0;
    // Captures from before anchors were recorded.
    const gapLeft = child.x - parent.x;
    const gapRight = parent.x + parent.w - (child.x + child.w);
    if (Math.abs(gapLeft - gapRight) <= 2) return -extra / 2;
    if (gapRight <= 2 && gapLeft > 2) return -extra;
    return 0;
}

// The browser measures text by its glyph box; Figma's box is the full line
// height. Centre one on the other.
function textYOffset(data) {
    const s = data.style;
    if (data.fixedBox || !s.lineHeight) return 0;
    return -(s.lineHeight - s.size * 1.15) / 2;
}

/* -------------------------------------------------------------------- */
/* SVG                                                                  */
/* -------------------------------------------------------------------- */

function buildSvg(data) {
    let node;
    try {
        node = figma.createNodeFromSvg(data.svg);
        node.fills = [];
        node.clipsContent = false;
        if (
            Math.abs(node.width - data.w) > 0.5 ||
            Math.abs(node.height - data.h) > 0.5
        ) {
            node.resize(Math.max(0.01, data.w), Math.max(0.01, data.h));
        }
    } catch (e) {
        node = figma.createFrame();
        node.resize(Math.max(0.01, data.w), Math.max(0.01, data.h));
        node.fills = [
            { type: 'SOLID', color: { r: 1, g: 0, b: 1 }, opacity: 0.3 },
        ];
        node.name = `[svg failed] ${data.name}`;
        return node;
    }
    node.name = data.name || 'svg';
    if (data.opacity !== undefined) node.opacity = data.opacity;
    return node;
}

/* -------------------------------------------------------------------- */
/* Variables                                                            */
/* -------------------------------------------------------------------- */

function variableName(token) {
    // `/` would create a group; Tailwind uses it for opacity (`black/50`).
    return token.replace(/\/(\d+)$/, ' $1%').replace(/[./{}]/g, '-');
}

async function colorVariables(doc) {
    const colors = (doc.tokens && doc.tokens.colors) || {};
    const tokens = Object.keys(colors);
    if (!tokens.length) return null;

    const collections =
        await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find((c) => c.name === COLLECTION_NAME);
    if (!collection) {
        collection = figma.variables.createVariableCollection(COLLECTION_NAME);
        collection.renameMode(collection.modes[0].modeId, doc.theme);
    }
    let mode = collection.modes.find((m) => m.name === doc.theme);
    if (!mode) {
        try {
            mode = { modeId: collection.addMode(doc.theme) };
        } catch (e) {
            // Plans limited to one mode: share it.
            mode = collection.modes[0];
        }
    }

    const existing = {};
    for (const id of collection.variableIds) {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (v) existing[v.name] = v;
    }
    const vars = {};
    for (const token of tokens) {
        const name = variableName(token);
        const v =
            existing[name] ||
            figma.variables.createVariable(name, collection, 'COLOR');
        v.setValueForMode(mode.modeId, rgba(colors[token]));
        vars[token] = v;
    }
    return { collection, modeId: mode.modeId, vars };
}

/* -------------------------------------------------------------------- */

// Last, once everything above is defined.
postMaster();
figma.on('currentpagechange', postMaster);
