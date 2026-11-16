/*
 * Layout Importer — rebuilds a .figma-layout.json capture (see
 * ../capture/serialize.js) as Figma frames, text, vectors and images.
 */
figma.showUI(__html__, { width: 320, height: 660, themeColors: true });
figma.clientStorage.getAsync('options').then((options) => {
    if (options) figma.ui.postMessage({ type: 'options', options });
});

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

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'save-options') {
        await figma.clientStorage.setAsync('options', msg.options);
        return;
    }
    if (msg.type !== 'import') return;
    try {
        const created = [];
        const texts = [];
        const fontsUsed = {};
        let x = nextFreeX();
        for (let i = 0; i < msg.docs.length; i++) {
            const doc = msg.docs[i];
            progress(`Importing ${i + 1}/${msg.docs.length}: ${doc.root.name}`);
            const { frame, section } = await importDoc(
                doc,
                msg.options,
                texts,
                fontsUsed,
            );
            frame.x = x;
            frame.y = 0;
            x += frame.width + 200;
            created.push(frame);
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
        figma.currentPage.selection = created;
        figma.viewport.scrollAndZoomIntoView(created);
        const tabs = msg.docs.reduce(
            (n, d) =>
                n + (d.states || []).filter((st) => st.kind === 'tabs').length,
            0,
        );
        const pops = msg.docs.reduce(
            (n, d) =>
                n +
                (d.states || []).filter((st) => st.kind === 'popover').length,
            0,
        );
        const extras =
            msg.options.states === false || !(tabs || pops)
                ? ''
                : `${tabs} tab group(s) and ${pops} menu(s)/popover(s) as components`;
        const fonts = Object.keys(tally)
            .sort((a, b) => tally[b] - tally[a])
            .map((k) => `${k} ×${tally[k]}`)
            .join(', ');
        figma.ui.postMessage({
            type: 'done',
            text: `Imported ${msg.docs.length} screen(s), ${texts.length} text layers${extras ? `, ${extras}` : ''}.${fonts ? ` Fonts: ${fonts}.` : ''}${failedFonts.length ? ` Couldn't load: ${failedFonts.splice(0).join(', ')}.` : ''}`,
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
        if (st.kind === 'tabs') {
            for (const o of st.options) {
                o.node = prep(o.node);
                stateRoots.push(o.node);
            }
        } else {
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
    };
    const frame = await build(root, state);
    frame.name = `${doc.root.name} — ${doc.viewport.width}×${doc.viewport.height} ${doc.theme}`;
    frame.setPluginData('sourceUrl', doc.source.url);
    frame.setPluginData('capturedAt', doc.source.capturedAt);
    const section = states.length
        ? await buildStates(states, frame, state)
        : null;
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
    return { frame, section };
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

    for (const st of states.filter((s) => s.kind === 'tabs')) {
        progress(`Building ${st.name} variants…`);
        const components = [];
        for (const o of st.options) {
            const built = await build(o.node, state);
            applyBackdrop(built, o.node, state);
            const comp = figma.createComponentFromNode(built);
            comp.name = `${st.property}=${variantValue(o.value)}`;
            components.push(comp);
        }
        const set = figma.combineAsVariants(components, section);
        set.name = st.name;
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
        }
    }

    for (const st of states.filter((s) => s.kind === 'popover')) {
        progress(`Building ${st.name}…`);
        const built = await build(st.node, state);
        applyBackdrop(built, st.node, state);
        const comp = figma.createComponentFromNode(built);
        comp.name = `Popover / ${st.name}`;
        place(comp);
    }

    section.resizeWithoutConstraints(
        width + SECTION_PADDING * 2,
        Math.max(y - STATE_GAP + SECTION_PADDING, 1),
    );
    return section;
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
