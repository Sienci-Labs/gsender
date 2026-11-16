/*
 * Layout → Figma serializer.
 *
 * Walks the live DOM and records what is actually rendered (computed styles
 * and measured boxes), so it works the same for Tailwind, CSS modules, inline
 * styles or anything else. The output is a JSON document consumed by the
 * "Layout Importer" Figma plugin in ../figma-plugin.
 *
 * Usage:
 *   - CLI: `node tools/figma-layout/capture/cli.mjs` injects this file and
 *     calls `window.__layoutToFigma.capture()`.
 *   - Console: paste this whole file into DevTools (works inside Electron too).
 *     It captures immediately and downloads `<title>.figma-layout.json`.
 */
(function () {
    const VERSION = 1;
    const SKIP_TAGS = new Set([
        'SCRIPT',
        'STYLE',
        'NOSCRIPT',
        'TEMPLATE',
        'HEAD',
        'META',
        'LINK',
        'TITLE',
        'BR',
        'WBR',
        'SOURCE',
        'TRACK',
        'DATALIST',
    ]);
    // Elements whose pixels can't be described as boxes/text/vectors.
    const RASTER_TAGS = new Set(['CANVAS', 'VIDEO', 'OBJECT', 'EMBED']);
    const TEXT_INPUT_TYPES = new Set([
        '',
        'text',
        'number',
        'email',
        'password',
        'search',
        'tel',
        'url',
        'date',
        'time',
        'datetime-local',
        'month',
        'week',
    ]);
    const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset']);
    const MAX_IMAGE_SIDE = 2048;

    let nextId = 1;
    let idPrefix = 'n';
    const newId = () => idPrefix + nextId++;

    /* ------------------------------------------------------------------ */
    /* Colours                                                            */
    /* ------------------------------------------------------------------ */

    let colorCtx = null;
    function parseColor(str) {
        if (!str || str === 'transparent' || str === 'none') return null;
        let m = str.match(
            /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
        );
        if (m) {
            return {
                r: +m[1] / 255,
                g: +m[2] / 255,
                b: +m[3] / 255,
                a: alpha(m[4]),
            };
        }
        m = str.match(
            /^color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
        );
        if (m) return { r: +m[1], g: +m[2], b: +m[3], a: alpha(m[4]) };
        // Anything else (oklch, lab, …): let the browser rasterise it.
        if (!colorCtx) {
            const c = document.createElement('canvas');
            c.width = c.height = 1;
            colorCtx = c.getContext('2d', { willReadFrequently: true });
        }
        colorCtx.clearRect(0, 0, 1, 1);
        colorCtx.fillStyle = '#000';
        colorCtx.fillStyle = str;
        colorCtx.fillRect(0, 0, 1, 1);
        const d = colorCtx.getImageData(0, 0, 1, 1).data;
        return { r: d[0] / 255, g: d[1] / 255, b: d[2] / 255, a: d[3] / 255 };
    }
    function alpha(v) {
        if (v === undefined) return 1;
        return v.endsWith('%') ? parseFloat(v) / 100 : +v;
    }
    const visible = (c) => c && c.a > 0.001;
    const sameColor = (a, b) =>
        a &&
        b &&
        Math.abs(a.r - b.r) < 0.002 &&
        Math.abs(a.g - b.g) < 0.002 &&
        Math.abs(a.b - b.b) < 0.002 &&
        Math.abs(a.a - b.a) < 0.002;

    // Split on commas that are not inside parentheses.
    function splitTopLevel(str, sep = ',') {
        const out = [];
        let depth = 0;
        let cur = '';
        for (const ch of str) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
            if (ch === sep && depth === 0) {
                out.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }
    const COLOR_RE =
        /(rgba?\([^)]*\)|color\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|#[0-9a-f]{3,8}\b|transparent)/i;

    /* ------------------------------------------------------------------ */
    /* Tailwind colour tokens                                             */
    /* ------------------------------------------------------------------ */

    // A class like `bg-robin-500` is turned into the token `robin-500` by
    // rendering a probe element with just that class and reading the colour
    // back. That way custom theme colours and CSS-variable colours resolve
    // exactly as the app renders them, in the current light/dark theme.
    const SENTINEL = 'rgb(1, 2, 3)';
    const UTILITIES = {
        bg: 'backgroundColor',
        text: 'color',
        border: 'borderTopColor',
        fill: 'fill',
        stroke: 'stroke',
    };
    const tokenCache = new Map();
    const tokens = {};
    let probeHost = null;
    let probe = null;
    let borderBaseline = null;

    function probeClass(cls, prop) {
        const key = cls + '|' + prop;
        if (tokenCache.has(key)) return tokenCache.get(key);
        if (!probeHost) {
            probeHost = document.createElement('div');
            probeHost.setAttribute('aria-hidden', 'true');
            probeHost.style.cssText =
                'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;' +
                'overflow:hidden;pointer-events:none;color:' +
                SENTINEL +
                ';fill:' +
                SENTINEL +
                ';stroke:' +
                SENTINEL;
            probe = document.createElement('div');
            probeHost.appendChild(probe);
            document.body.appendChild(probeHost);
            borderBaseline = getComputedStyle(probe).borderTopColor;
        }
        probe.className = cls;
        const value = getComputedStyle(probe)[prop];
        let result = null;
        const isBaseline =
            (prop === 'backgroundColor' &&
                (value === 'rgba(0, 0, 0, 0)' || value === 'transparent')) ||
            ((prop === 'color' || prop === 'fill' || prop === 'stroke') &&
                value === SENTINEL) ||
            (prop === 'borderTopColor' && value === borderBaseline);
        if (!isBaseline) result = parseColor(value);
        tokenCache.set(key, result);
        return result;
    }

    function colorToken(el, utility, color) {
        if (!color) return undefined;
        // Text colour inherits, so the class that set it may be on an ancestor.
        if (utility === 'text') {
            for (
                let e = el, depth = 0;
                e && depth < 12;
                e = e.parentElement, depth++
            ) {
                const t = classColorToken(e, utility, color);
                if (t) return t;
            }
            return undefined;
        }
        return classColorToken(el, utility, color);
    }

    function classColorToken(el, utility, color) {
        if (!el.classList || !el.classList.length) return undefined;
        const prop = UTILITIES[utility];
        for (const raw of el.classList) {
            const base = raw.slice(raw.lastIndexOf(':') + 1).replace(/^!/, '');
            if (!base.startsWith(utility + '-') || base.includes('[')) continue;
            const c = probeClass(base, prop);
            if (c && sameColor(c, color)) {
                const name = base.slice(utility.length + 1);
                tokens[name] = c;
                return name;
            }
        }
        return undefined;
    }

    /* ------------------------------------------------------------------ */
    /* Naming                                                             */
    /* ------------------------------------------------------------------ */

    function reactComponentName(el) {
        const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
        if (!key) return null;
        let fiber = el[key];
        let name = null;
        // Walk up until the previous host (DOM) element: every composite in
        // between renders this element as its root.
        for (
            fiber = fiber && fiber.return;
            fiber && typeof fiber.type !== 'string';
            fiber = fiber.return
        ) {
            const t = fiber.type;
            if (!t) continue;
            const n =
                typeof t === 'function'
                    ? t.displayName || t.name
                    : typeof t === 'object'
                      ? t.displayName ||
                        (t.render && (t.render.displayName || t.render.name))
                      : null;
            if (
                n &&
                !/^(Anonymous|ForwardRef|Memo|Context|Provider|Consumer|Fragment|Suspense|_c\d*)$/.test(
                    n,
                )
            ) {
                name = n;
            }
        }
        return name;
    }

    function layerName(el) {
        const component = reactComponentName(el);
        const tag = el.tagName.toLowerCase();
        const hint =
            (el.id && '#' + el.id) ||
            el.getAttribute('data-testid') ||
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            '';
        let name = component || tag;
        if (hint) name += ' ' + hint;
        return name.slice(0, 80);
    }

    /* ------------------------------------------------------------------ */
    /* Box styles                                                         */
    /* ------------------------------------------------------------------ */

    const px = (v) => parseFloat(v) || 0;

    function radii(cs, w, h) {
        const corner = (v) => {
            const first = String(v).split(' ')[0];
            const r = first.endsWith('%')
                ? (parseFloat(first) / 100) * Math.min(w, h)
                : px(first);
            return Math.min(r, w / 2, h / 2);
        };
        const r = [
            corner(cs.borderTopLeftRadius),
            corner(cs.borderTopRightRadius),
            corner(cs.borderBottomRightRadius),
            corner(cs.borderBottomLeftRadius),
        ];
        return r.some((v) => v > 0) ? r : undefined;
    }

    function borders(el, cs) {
        const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({
            width:
                cs['border' + s + 'Style'] === 'none' ||
                cs['border' + s + 'Style'] === 'hidden'
                    ? 0
                    : px(cs['border' + s + 'Width']),
            color: parseColor(cs['border' + s + 'Color']),
            style: cs['border' + s + 'Style'],
        }));
        const painted = sides.filter((s) => s.width > 0 && visible(s.color));
        if (!painted.length) return undefined;
        const main = painted.reduce((a, b) => (b.width > a.width ? b : a));
        return {
            color: main.color,
            weights: sides.map((s) =>
                s.width > 0 && visible(s.color) ? s.width : 0,
            ),
            dash:
                main.style === 'dashed'
                    ? [main.width * 3, main.width * 2]
                    : main.style === 'dotted'
                      ? [main.width, main.width]
                      : undefined,
            token: colorToken(el, 'border', main.color),
        };
    }

    function shadows(cs) {
        if (!cs.boxShadow || cs.boxShadow === 'none') return [];
        const out = [];
        for (const part of splitTopLevel(cs.boxShadow)) {
            const cm = part.match(COLOR_RE);
            const color = parseColor(cm ? cm[0] : 'rgb(0,0,0)');
            if (!visible(color)) continue;
            const rest = part.replace(COLOR_RE, ' ');
            const nums = (rest.match(/-?[\d.]+px|-?[\d.]+(?=\s|$)/g) || []).map(
                px,
            );
            if (nums.length < 2) continue;
            out.push({
                type: /\binset\b/.test(rest) ? 'INNER_SHADOW' : 'DROP_SHADOW',
                x: nums[0],
                y: nums[1],
                blur: nums[2] || 0,
                spread: nums[3] || 0,
                color,
            });
        }
        return out;
    }

    function blurs(cs) {
        const out = [];
        const f = (cs.filter || '').match(/blur\(([\d.]+)px\)/);
        if (f && +f[1] > 0) out.push({ type: 'LAYER_BLUR', radius: +f[1] });
        const b = (cs.backdropFilter || cs.webkitBackdropFilter || '').match(
            /blur\(([\d.]+)px\)/,
        );
        if (b && +b[1] > 0)
            out.push({ type: 'BACKGROUND_BLUR', radius: +b[1] });
        return out;
    }

    // Whether a gradient argument is a colour stop rather than a direction
    // or shape. Computed styles drop the default direction (`to bottom`), so
    // the first argument is often already a stop.
    function startsWithColor(part) {
        const m = part.trim().match(COLOR_RE);
        return !!m && m.index === 0;
    }

    function parseGradient(str, w, h) {
        const m = str.match(/^(repeating-)?(linear|radial)-gradient\((.*)\)$/s);
        if (!m) return null;
        const repeating = !!m[1];
        const kind = m[2];
        if (repeating && kind !== 'linear') return null;
        const parts = splitTopLevel(m[3]);
        let angle = 180;
        if (
            kind === 'linear' &&
            parts.length &&
            !startsWithColor(parts[0])
        ) {
            const head = parts.shift().trim();
            if (head.startsWith('to ')) {
                const sx = /right/.test(head) ? 1 : /left/.test(head) ? -1 : 0;
                const sy = /bottom/.test(head) ? 1 : /top/.test(head) ? -1 : 0;
                // Corner directions are aspect-ratio dependent (CSS Images §3.1.1).
                const dx = sx * (sy ? h : 1);
                const dy = sy * (sx ? w : 1);
                angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
            } else if (head.endsWith('deg')) angle = parseFloat(head);
            else if (head.endsWith('turn')) angle = parseFloat(head) * 360;
            else if (head.endsWith('rad'))
                angle = (parseFloat(head) * 180) / Math.PI;
        } else if (
            kind === 'radial' &&
            parts.length &&
            !startsWithColor(parts[0])
        ) {
            parts.shift();
        }
        // Length of the CSS gradient line, to turn px stops into fractions.
        const a = (angle * Math.PI) / 180;
        const lineLength =
            kind === 'linear'
                ? Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))
                : 0;
        let stops = [];
        for (const p of parts) {
            const cm = p.match(COLOR_RE);
            if (!cm) continue;
            const color = parseColor(cm[0]) || { r: 0, g: 0, b: 0, a: 0 };
            // A stop can have two positions (`red 10% 20%`): a hard band.
            const positions = [
                ...p.replace(cm[0], '').matchAll(/(-?[\d.]+)(%|px)/g),
            ].map(([, v, unit]) =>
                unit === '%' ? +v / 100 : lineLength ? +v / lineLength : null,
            );
            if (!positions.length) positions.push(null);
            for (const position of positions) stops.push({ color, position });
        }
        if (stops.length < 2) return null;
        // Fill in missing positions evenly between known ones.
        if (stops[0].position === null) stops[0].position = 0;
        if (stops[stops.length - 1].position === null)
            stops[stops.length - 1].position = 1;
        for (let i = 1; i < stops.length; i++) {
            if (stops[i].position !== null) continue;
            let j = i;
            while (stops[j].position === null) j++;
            const a = stops[i - 1].position;
            const step = (stops[j].position - a) / (j - i + 1);
            for (let k = i; k < j; k++)
                stops[k].position = a + step * (k - i + 1);
        }
        // A stop placed before an earlier one sits on it instead.
        for (let i = 1; i < stops.length; i++)
            stops[i].position = Math.max(
                stops[i].position,
                stops[i - 1].position,
            );
        if (repeating) {
            // Figma has no repeating gradients: tile the pattern across the
            // whole line as one gradient.
            const first = stops[0].position;
            const period = stops[stops.length - 1].position - first;
            if (period <= 0) return null;
            const from = Math.floor(-first / period);
            const to = Math.ceil((1 - first) / period);
            if ((to - from) * stops.length > 500) return null;
            const tiled = [];
            for (let n = from; n < to; n++)
                for (const st of stops)
                    tiled.push({
                        color: st.color,
                        position: st.position + n * period,
                    });
            stops = tiled;
        }
        stops = cropStops(stops);
        return {
            type: kind === 'linear' ? 'GRADIENT_LINEAR' : 'GRADIENT_RADIAL',
            angle,
            stops,
        };
    }

    // Keep the 0–1 part of a gradient, with the colours it has at each end.
    // At a hard edge (two stops in one place) the start takes the colour
    // after the edge and the end the colour before it.
    function cropStops(stops) {
        const mix = (a, b, t) => {
            const f =
                b.position === a.position
                    ? 0
                    : (t - a.position) / (b.position - a.position);
            const c = (k) => a.color[k] + (b.color[k] - a.color[k]) * f;
            return { r: c('r'), g: c('g'), b: c('b'), a: c('a') };
        };
        const last = stops.length - 1;
        let i = stops.findLastIndex((st) => st.position <= 0);
        const start =
            i < 0
                ? stops[0].color
                : i === last
                  ? stops[last].color
                  : mix(stops[i], stops[i + 1], 0);
        let j = stops.findIndex((st) => st.position >= 1);
        const end =
            j < 0
                ? stops[last].color
                : j === 0
                  ? stops[0].color
                  : mix(stops[j - 1], stops[j], 1);
        return [
            { color: start, position: 0 },
            ...stops.filter((st) => st.position > 0 && st.position < 1),
            { color: end, position: 1 },
        ];
    }

    async function backgroundLayers(cs, w, h) {
        const out = [];
        if (!cs.backgroundImage || cs.backgroundImage === 'none') return out;
        const sizes = splitTopLevel(cs.backgroundSize || '');
        const repeats = splitTopLevel(cs.backgroundRepeat || '');
        const layers = splitTopLevel(cs.backgroundImage);
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const url = layer.match(/^url\(["']?(.*?)["']?\)$/);
            if (url) {
                const img = await loadImageSrc(url[1]);
                if (!img) continue;
                const size = sizes[i] || sizes[0] || 'auto';
                const repeat = repeats[i] || repeats[0] || 'repeat';
                out.push({
                    type: 'IMAGE',
                    ...img,
                    fit:
                        size === 'contain'
                            ? 'FIT'
                            : size === 'cover'
                              ? 'FILL'
                              : repeat.startsWith('repeat') && size === 'auto'
                                ? 'TILE'
                                : 'FILL',
                });
            } else {
                const g = parseGradient(layer, w, h);
                if (g) out.push(g);
                else out.unsupported = true;
            }
        }
        // CSS lists the top layer first; Figma paints the last fill on top.
        const unsupported = out.unsupported;
        out.reverse();
        out.unsupported = unsupported;
        return out;
    }

    /* ------------------------------------------------------------------ */
    /* Images & SVG                                                       */
    /* ------------------------------------------------------------------ */

    const imageCache = new Map();

    function rasterizeImage(img) {
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        if (!nw || !nh) return null;
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(nw, nh));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(nw * scale));
        c.height = Math.max(1, Math.round(nh * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/png'); // throws if the canvas is tainted
    }

    function isSvgUrl(src) {
        return /^data:image\/svg\+xml/i.test(src) || /\.svg(\?|#|$)/i.test(src);
    }

    // Resolves to { src: <png data url> } or { svg: <markup> }, or null.
    function loadImageSrc(src) {
        if (imageCache.has(src)) return imageCache.get(src);
        const p = (async () => {
            try {
                if (isSvgUrl(src)) {
                    const text = await (await fetch(src)).text();
                    if (text.includes('<svg')) return { svg: text };
                }
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = src;
                await img.decode();
                return { src: rasterizeImage(img) };
            } catch (e) {
                return null;
            }
        })();
        imageCache.set(src, p);
        return p;
    }

    const SVG_PAINT_PROPS = [
        'fill',
        'fill-opacity',
        'fill-rule',
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-dasharray',
        'stroke-dashoffset',
        'stroke-miterlimit',
        'opacity',
        'clip-rule',
        'font-family',
        'font-size',
        'font-weight',
        'text-anchor',
        'dominant-baseline',
    ];

    function serializeSvg(svg, w, h) {
        const clone = svg.cloneNode(true);
        const origs = [svg, ...svg.querySelectorAll('*')];
        const clones = [clone, ...clone.querySelectorAll('*')];
        const DEFS =
            'defs, clipPath, mask, pattern, symbol, marker, linearGradient, radialGradient';
        for (let i = 0; i < origs.length; i++) {
            const o = origs[i];
            const c = clones[i];
            const cs = getComputedStyle(o);
            if (o.tagName === 'stop') {
                c.setAttribute('stop-color', cs.stopColor);
                c.setAttribute('stop-opacity', cs.stopOpacity);
            } else if (!o.closest(DEFS) || o.tagName === 'use') {
                if (cs.display === 'none') {
                    c.setAttribute('display', 'none');
                    continue;
                }
                for (const p of SVG_PAINT_PROPS) {
                    const v = cs.getPropertyValue(p);
                    if (v && v !== 'normal' && v !== 'auto')
                        c.setAttribute(p, v);
                }
                if (cs.visibility === 'hidden')
                    c.setAttribute('visibility', 'hidden');
            }
            c.removeAttribute('class');
            c.removeAttribute('style');
        }
        // Inline symbols referenced from elsewhere in the document (icon sprites).
        const missing = [];
        for (const use of clone.querySelectorAll('use')) {
            const ref = (
                use.getAttribute('href') ||
                use.getAttribute('xlink:href') ||
                ''
            ).trim();
            if (!ref.startsWith('#') || clone.querySelector(ref)) continue;
            const target = document.querySelector(ref);
            if (target) missing.push(target.cloneNode(true));
        }
        if (missing.length) {
            const defs = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'defs',
            );
            missing.forEach((m) => defs.appendChild(m));
            clone.insertBefore(defs, clone.firstChild);
        }
        if (!clone.getAttribute('viewBox')) {
            const vb = svg.viewBox && svg.viewBox.baseVal;
            clone.setAttribute(
                'viewBox',
                vb && vb.width
                    ? `${vb.x} ${vb.y} ${vb.width} ${vb.height}`
                    : `0 0 ${w} ${h}`,
            );
        }
        clone.setAttribute('width', w);
        clone.setAttribute('height', h);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        return new XMLSerializer().serializeToString(clone);
    }

    /* ------------------------------------------------------------------ */
    /* Text                                                               */
    /* ------------------------------------------------------------------ */

    function fontFamilies(cs) {
        return splitTopLevel(cs.fontFamily).map((f) =>
            f.replace(/^["']|["']$/g, '').trim(),
        );
    }

    function textStyle(el, cs, color) {
        const deco = cs.textDecorationLine || '';
        return {
            families: fontFamilies(cs),
            weight: parseInt(cs.fontWeight, 10) || 400,
            italic:
                cs.fontStyle === 'italic' || cs.fontStyle.startsWith('oblique'),
            size: px(cs.fontSize),
            lineHeight: cs.lineHeight === 'normal' ? null : px(cs.lineHeight),
            letterSpacing:
                cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing),
            color,
            colorToken: colorToken(el, 'text', color),
            align:
                {
                    center: 'CENTER',
                    right: 'RIGHT',
                    end: 'RIGHT',
                    justify: 'JUSTIFIED',
                }[cs.textAlign] || 'LEFT',
            decoration: deco.includes('underline')
                ? 'UNDERLINE'
                : deco.includes('line-through')
                  ? 'STRIKETHROUGH'
                  : 'NONE',
            textCase:
                { uppercase: 'UPPER', lowercase: 'LOWER', capitalize: 'TITLE' }[
                    cs.textTransform
                ] || 'ORIGINAL',
        };
    }

    function collapseWhitespace(text, cs) {
        if (/^pre/.test(cs.whiteSpace) || cs.whiteSpace === 'break-spaces')
            return text;
        if (cs.whiteSpace === 'pre-line') return text.replace(/[ \t]+/g, ' ');
        return text.replace(/\s+/g, ' ');
    }

    // `from`/`to` limit it to part of the text node (see the split below).
    // Consecutive text nodes read as one string. React renders `ALARM {code}`
    // as three nodes; one layer keeps the space and the spacing between them.
    // Offsets into the joined string map back to a node for each Range.
    function textRun(nodes) {
        const starts = [];
        let length = 0;
        for (const n of nodes) {
            starts.push(length);
            length += n.nodeValue.length;
        }
        return {
            nodes,
            text: nodes.map((n) => n.nodeValue).join(''),
            doc: nodes[0].ownerDocument,
            at(i) {
                for (let k = 0; k < nodes.length; k++) {
                    if (i <= starts[k] + nodes[k].nodeValue.length)
                        return [nodes[k], i - starts[k]];
                }
                const last = nodes[nodes.length - 1];
                return [last, last.nodeValue.length];
            },
        };
    }

    function setRange(range, run, start, end) {
        range.setStart(...run.at(start));
        range.setEnd(...run.at(end));
    }

    function textNodeFor(run, parentEl, cs, ctx, from = 0, to = null) {
        const raw = run.text;
        const part = raw.slice(from, to === null ? raw.length : to);
        const lead = part.search(/\S/);
        if (lead < 0) return null;
        const start = from + lead;
        const end =
            from + part.length - part.split('').reverse().join('').search(/\S/);
        const range = run.doc.createRange();
        setRange(range, run, start, end);
        const r = range.getBoundingClientRect();
        const rect = {
            left: r.left + ctx.dx,
            top: r.top + ctx.dy,
            right: r.right + ctx.dx,
            bottom: r.bottom + ctx.dy,
            width: r.width,
            height: r.height,
        };
        if (
            rect.width < 0.5 ||
            rect.height < 0.5 ||
            !intersects(rect, ctx.clip)
        )
            return null;
        const lineRects = [...range.getClientRects()].filter(
            (r) => r.width > 0,
        );
        const lines = new Set(lineRects.map((r) => Math.round(r.top))).size;
        // Text that follows inline content (a <b> run, a link) starts partway
        // along its first line. One box can't describe that, so the first
        // line becomes its own layer and the rest wraps underneath.
        if (lines > 1 && lineRects[0].left > r.left + 1) {
            const split = secondLineStart(run, start, end);
            if (split > start && split < end) {
                return [
                    textNodeFor(run, parentEl, cs, ctx, start, split),
                    textNodeFor(run, parentEl, cs, ctx, split, end),
                ]
                    .flat()
                    .filter(Boolean);
            }
        }
        const color = parseColor(
            cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color
                ? cs.webkitTextFillColor
                : cs.color,
        );
        if (!visible(color)) return null;
        let w = rect.width;
        let truncate = false;
        if (cs.textOverflow === 'ellipsis' && cs.overflowX !== 'visible') {
            const pr = parentEl.getBoundingClientRect();
            const maxW =
                pr.right +
                ctx.dx -
                px(cs.paddingRight) -
                px(cs.borderRightWidth) -
                rect.left;
            if (maxW < w) {
                w = maxW;
                truncate = true;
            }
        }
        const node = {
            type: 'TEXT',
            id: newId(),
            x: rect.left,
            y: rect.top,
            w,
            h: rect.height,
            characters: collapseWhitespace(raw.slice(start, end), cs),
            multiline: lines > 1,
            truncate,
            style: textStyle(parentEl, cs, color),
        };
        if (lines > 1) node.lines = browserLines(run, start, end, cs);
        else node.anchor = textAnchor(r, parentEl, run.nodes);
        return node;
    }

    // Where a one-line text sits in the nearest box wider than it, so it can
    // stay put if it renders at a different width. Flexbox centring leaves
    // text-align at its default, so this can't come from the style. Text
    // that shares its box (an icon, other text) only counts as right-aligned
    // when the row itself pushes it there.
    function textAnchor(r, el, own) {
        let inner = new Set(own);
        for (let i = 0; el && i < 4; i++) {
            const cs = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            const left =
                box.left + px(cs.borderLeftWidth) + px(cs.paddingLeft);
            const right =
                box.right - px(cs.borderRightWidth) - px(cs.paddingRight);
            const gapLeft = r.left - left;
            const gapRight = right - r.right;
            if (gapLeft + gapRight > 1) {
                const others = [...el.childNodes].filter(
                    (n) => !inner.has(n) && hasContent(n),
                );
                if (!others.length) {
                    if (Math.abs(gapLeft - gapRight) <= 1) return 'CENTER';
                    return gapRight <= 1 ? 'RIGHT' : 'LEFT';
                }
                return rowAnchor(el, cs, inner);
            }
            inner = new Set([el]);
            el = el.parentElement;
        }
        return 'LEFT';
    }

    function hasContent(n) {
        if (n.nodeType === Node.TEXT_NODE) return /\S/.test(n.nodeValue);
        if (n.nodeType !== Node.ELEMENT_NODE) return false;
        const cs = getComputedStyle(n);
        if (cs.position === 'absolute' || cs.position === 'fixed') return false;
        const b = n.getBoundingClientRect();
        return b.width > 0 && b.height > 0;
    }

    function rowAnchor(el, cs, inner) {
        if (!/flex/.test(cs.display) || !/^row/.test(cs.flexDirection))
            return { center: 'CENTER', right: 'RIGHT', end: 'RIGHT' }[
                cs.textAlign
            ] || 'LEFT';
        const reverse = cs.flexDirection === 'row-reverse';
        const justify = cs.justifyContent;
        if (/^(flex-)?end$|^right$/.test(justify))
            return reverse ? 'LEFT' : 'RIGHT';
        if (justify === 'space-between') {
            const items = [...el.childNodes].filter(hasContent);
            const last = reverse ? items[0] : items[items.length - 1];
            if (inner.has(last) && items.length > 1) return 'RIGHT';
        }
        return 'LEFT';
    }

    // Index of the first character on the text's second line.
    function secondLineStart(run, start, end) {
        const range = run.doc.createRange();
        let firstTop = null;
        for (let i = start; i < end; i++) {
            setRange(range, run, i, i + 1);
            const r = range.getClientRects()[0];
            if (!r || r.width <= 0) continue;
            if (firstTop === null) firstTop = r.top;
            else if (r.top > firstTop + 2) return i;
        }
        return end;
    }

    // Where the browser wrapped the text. Figma's font metrics never match
    // the browser's exactly, so the importer breaks lines here rather than
    // letting Figma re-wrap at a slightly different width.
    function browserLines(run, start, end, cs) {
        if (end - start > 4000) return undefined;
        const raw = run.text;
        const range = run.doc.createRange();
        const lines = [];
        let cur = '';
        let lastTop = null;
        for (let i = start; i < end; i++) {
            setRange(range, run, i, i + 1);
            const r = range.getClientRects()[0];
            // Collapsed whitespace has no box; it stays with the current line.
            if (r && r.width > 0) {
                const top = r.top;
                if (lastTop !== null && top > lastTop + 2) {
                    lines.push(cur);
                    cur = '';
                }
                lastTop = top;
            }
            cur += raw[i];
        }
        lines.push(cur);
        return lines
            .map((l) => collapseWhitespace(l, cs).trim())
            .filter(Boolean);
    }

    // Text that lives in a form control's value rather than in the DOM.
    function controlText(el, cs, rect) {
        let text = '';
        let color = parseColor(cs.color);
        const tag = el.tagName;
        if (tag === 'SELECT') {
            const opt = el.options[el.selectedIndex];
            text = opt ? opt.text : '';
        } else if (
            tag === 'TEXTAREA' ||
            TEXT_INPUT_TYPES.has(el.type) ||
            BUTTON_INPUT_TYPES.has(el.type)
        ) {
            text = el.value;
            if (el.type === 'password') text = '•'.repeat(text.length);
            if (!text && el.placeholder) {
                text = el.placeholder;
                color =
                    parseColor(getComputedStyle(el, '::placeholder').color) ||
                    color;
            }
        }
        if (!text || !visible(color)) return null;
        const bl = px(cs.borderLeftWidth) + px(cs.paddingLeft);
        const br = px(cs.borderRightWidth) + px(cs.paddingRight);
        const bt = px(cs.borderTopWidth) + px(cs.paddingTop);
        const bb = px(cs.borderBottomWidth) + px(cs.paddingBottom);
        const style = textStyle(el, cs, color);
        if (BUTTON_INPUT_TYPES.has(el.type)) style.align = 'CENTER';
        return {
            type: 'TEXT',
            id: newId(),
            name: text.slice(0, 40),
            x: rect.left + bl,
            y: rect.top + bt,
            w: Math.max(1, rect.width - bl - br),
            h: Math.max(1, rect.height - bt - bb),
            characters: tag === 'TEXTAREA' ? text : text.replace(/\s+/g, ' '),
            multiline: tag === 'TEXTAREA',
            fixedBox: true,
            verticalAlign: tag === 'TEXTAREA' ? 'TOP' : 'CENTER',
            truncate: tag !== 'TEXTAREA',
            style,
        };
    }

    /* ------------------------------------------------------------------ */
    /* Layout                                                             */
    /* ------------------------------------------------------------------ */

    function intersects(r, clip) {
        return (
            r.right > clip.left &&
            r.left < clip.right &&
            r.bottom > clip.top &&
            r.top < clip.bottom
        );
    }

    function autoLayoutHint(cs) {
        if (cs.display !== 'flex' && cs.display !== 'inline-flex')
            return undefined;
        if (cs.flexDirection.endsWith('reverse') || cs.flexWrap !== 'nowrap')
            return undefined;
        const justify = {
            normal: 'MIN',
            'flex-start': 'MIN',
            start: 'MIN',
            left: 'MIN',
            center: 'CENTER',
            'flex-end': 'MAX',
            end: 'MAX',
            right: 'MAX',
            'space-between': 'SPACE_BETWEEN',
        }[cs.justifyContent];
        const align = {
            normal: 'MIN',
            stretch: 'MIN',
            'flex-start': 'MIN',
            start: 'MIN',
            'self-start': 'MIN',
            baseline: 'MIN',
            center: 'CENTER',
            'flex-end': 'MAX',
            end: 'MAX',
            'self-end': 'MAX',
        }[cs.alignItems];
        if (!justify || !align) return undefined;
        const row = cs.flexDirection === 'row';
        return {
            mode: row ? 'HORIZONTAL' : 'VERTICAL',
            gap: px(row ? cs.columnGap : cs.rowGap),
            padding: [
                px(cs.paddingTop) + px(cs.borderTopWidth),
                px(cs.paddingRight) + px(cs.borderRightWidth),
                px(cs.paddingBottom) + px(cs.borderBottomWidth),
                px(cs.paddingLeft) + px(cs.borderLeftWidth),
            ],
            justify,
            align,
        };
    }

    // clip-path → a shape in the element's own pixel space, which the
    // importer turns into a vector mask.
    function parseClipPath(value, w, h) {
        if (!value || value === 'none') return undefined;
        const m = value.match(/^(polygon|inset|circle|ellipse|path)\((.*)\)/s);
        if (!m) return undefined;
        const len = (v, total) =>
            v.endsWith('%') ? (parseFloat(v) / 100) * total : px(v);
        const [, kind, body] = m;
        if (kind === 'polygon') {
            const pairs = splitTopLevel(
                body.replace(/^\s*(nonzero|evenodd)\s*,/, ''),
            );
            const points = pairs.map((p) => {
                const [x, y] = p.trim().split(/\s+/);
                return [len(x, w), len(y, h)];
            });
            return points.length >= 3 ? { type: 'polygon', points } : undefined;
        }
        if (kind === 'inset') {
            const parts = body
                .split(/\s+round\s+/)[0]
                .trim()
                .split(/\s+/);
            const [t, r = t, b = t, l = r] = parts;
            const x0 = len(l, w);
            const y0 = len(t, h);
            const x1 = w - len(r, w);
            const y1 = h - len(b, h);
            return {
                type: 'polygon',
                points: [
                    [x0, y0],
                    [x1, y0],
                    [x1, y1],
                    [x0, y1],
                ],
            };
        }
        if (kind === 'circle' || kind === 'ellipse') {
            const [radii, at] = body.split(/\s+at\s+/);
            const pos = (at || '50% 50%').trim().split(/\s+/);
            const cx = len(pos[0] || '50%', w);
            const cy = len(pos[1] || '50%', h);
            const rs = (radii || '').trim().split(/\s+/).filter(Boolean);
            const near = Math.min(cx, w - cx, cy, h - cy);
            const rx =
                rs[0] && /\d/.test(rs[0])
                    ? len(
                          rs[0],
                          kind === 'circle' ? Math.hypot(w, h) / Math.SQRT2 : w,
                      )
                    : near;
            const ry =
                kind === 'circle'
                    ? rx
                    : rs[1] && /\d/.test(rs[1])
                      ? len(rs[1], h)
                      : near;
            return { type: 'ellipse', cx, cy, rx, ry };
        }
        const d = body.match(/["'](.*)["']/);
        return d ? { type: 'path', d: d[1] } : undefined;
    }

    function needsRaster(cs) {
        if (cs.transformStyle === 'preserve-3d') return true;
        const t = cs.transform;
        if (!t || t === 'none') return false;
        if (t.startsWith('matrix3d')) return true;
        const m = t.match(/^matrix\(([^)]*)\)$/);
        if (!m) return false;
        const [a, b, c, d] = m[1].split(',').map(Number);
        // Pure translations are fine: the measured box already includes them.
        return (
            Math.abs(a - 1) > 1e-3 ||
            Math.abs(b) > 1e-3 ||
            Math.abs(c) > 1e-3 ||
            Math.abs(d - 1) > 1e-3
        );
    }

    function paintOrderKey(cs) {
        if (cs.position === 'static') return 0;
        const z = parseInt(cs.zIndex, 10);
        if (isNaN(z) || z === 0) return 1;
        return z < 0 ? z : 1 + z;
    }

    /* ------------------------------------------------------------------ */
    /* Walk                                                               */
    /* ------------------------------------------------------------------ */

    async function walk(el, ctx) {
        if (SKIP_TAGS.has(el.tagName) || el === probeHost) return null;
        if (el.hasAttribute && el.hasAttribute('data-figma-ignore'))
            return null;
        const win = el.ownerDocument.defaultView;
        const cs = win.getComputedStyle(el);
        if (cs.display === 'none') return null;
        if (parseFloat(cs.opacity) === 0) return null;

        const contents = cs.display === 'contents';
        const r = el.getBoundingClientRect();
        const rect = {
            left: r.left + ctx.dx,
            top: r.top + ctx.dy,
            right: r.right + ctx.dx,
            bottom: r.bottom + ctx.dy,
            width: r.width,
            height: r.height,
        };
        const fixed = cs.position === 'fixed';
        const clip = fixed ? ctx.root : ctx.clip;
        // Outside the visible area: drop it unless it is a non-clipping box
        // whose children overflow back into view.
        const offscreen = !contents && !intersects(rect, clip);
        if (
            offscreen &&
            (cs.overflowX !== 'visible' || cs.overflowY !== 'visible')
        )
            return null;

        const hidden = cs.visibility === 'hidden';
        const tag = el.tagName;
        const w = rect.width;
        const h = rect.height;

        const node = {
            type: 'FRAME',
            id: newId(),
            name: layerName(el),
            x: rect.left,
            y: rect.top,
            w,
            h,
            classes:
                typeof el.className === 'string'
                    ? el.className.trim() || undefined
                    : undefined,
            order: paintOrderKey(cs),
            children: [],
        };

        if (!contents && !hidden) {
            const fills = [];
            const bg = parseColor(cs.backgroundColor);
            if (visible(bg)) {
                fills.push({
                    type: 'SOLID',
                    color: bg,
                    token: colorToken(el, 'bg', bg),
                });
            }
            const layers = await backgroundLayers(cs, w, h);
            if (layers.unsupported) node.unsupportedBackground = true;
            fills.push(...layers);
            if (fills.length) node.fills = fills;
            const stroke = borders(el, cs);
            if (stroke) node.stroke = stroke;
            const radius = radii(cs, w, h);
            if (radius) node.radius = radius;
            const effects = [...shadows(cs), ...blurs(cs)];
            if (effects.length) node.effects = effects;
            const opacity = parseFloat(cs.opacity);
            if (opacity < 1) node.opacity = opacity;
        }
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible')
            node.clip = true;
        const clipShape = parseClipPath(cs.clipPath, w, h);
        if (clipShape) node.clipPath = clipShape;
        if (cs.position === 'absolute' || fixed) node.absolute = true;
        const stateKey = el.getAttribute && el.getAttribute('data-l2f-state');
        if (stateKey) node.stateKey = stateKey;
        const hint = autoLayoutHint(cs);
        if (hint) node.layout = hint;

        // Things only a screenshot can reproduce: 3D/rotated/scaled boxes and
        // backgrounds Figma has no paint for (repeating/conic gradients).
        const unsupportedBg = node.unsupportedBackground && !el.children.length;
        delete node.unsupportedBackground;
        if (
            ctx.raster &&
            !offscreen &&
            !hidden &&
            w >= 0.5 &&
            h >= 0.5 &&
            (needsRaster(cs) || unsupportedBg)
        ) {
            markRaster(node, el, ctx);
            return finish(node, el, fixed, ctx);
        }

        // Leaf element types -------------------------------------------------
        const leaf =
            tag === 'svg' ||
            tag === 'IMG' ||
            tag === 'IFRAME' ||
            RASTER_TAGS.has(tag) ||
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT';
        if (offscreen && leaf) return null;
        if (tag === 'svg' || el instanceof win.SVGSVGElement) {
            if (hidden || w < 0.5 || h < 0.5) return null;
            node.type = 'SVG';
            node.svg = serializeSvg(el, w, h);
            delete node.children;
            return finish(node, el, fixed, ctx);
        }
        if (tag === 'IMG') {
            if (hidden || w < 0.5 || h < 0.5) return null;
            const src = el.currentSrc || el.src;
            let img = null;
            try {
                img = isSvgUrl(src)
                    ? await loadImageSrc(src)
                    : { src: rasterizeImage(el) };
            } catch (e) {
                img = null;
            }
            if (img && img.svg) {
                node.type = 'SVG';
                const doc = new DOMParser().parseFromString(
                    img.svg,
                    'image/svg+xml',
                ).documentElement;
                if (!doc.getAttribute('viewBox') && doc.getAttribute('width')) {
                    doc.setAttribute(
                        'viewBox',
                        `0 0 ${px(doc.getAttribute('width'))} ${px(doc.getAttribute('height'))}`,
                    );
                }
                doc.setAttribute('width', w);
                doc.setAttribute('height', h);
                node.svg = new XMLSerializer().serializeToString(doc);
            } else if (img && img.src) {
                node.type = 'IMAGE';
                node.image = {
                    src: img.src,
                    fit:
                        { contain: 'FIT', cover: 'FILL', none: 'CROP' }[
                            cs.objectFit
                        ] || 'FILL',
                };
            } else {
                markRaster(node, el, ctx);
            }
            delete node.children;
            return finish(node, el, fixed, ctx);
        }
        if (tag === 'IFRAME') {
            let doc = null;
            try {
                doc = el.contentDocument;
            } catch (e) {
                doc = null;
            }
            if (doc && doc.documentElement) {
                const inner = {
                    ...ctx,
                    dx: rect.left + px(cs.borderLeftWidth) + px(cs.paddingLeft),
                    dy: rect.top + px(cs.borderTopWidth) + px(cs.paddingTop),
                    clip: rect,
                };
                const child = await walk(
                    doc.body || doc.documentElement,
                    inner,
                );
                if (child) node.children.push(child);
                const bodyBg = parseColor(
                    doc.defaultView.getComputedStyle(
                        doc.body || doc.documentElement,
                    ).backgroundColor,
                );
                if (!node.fills && visible(bodyBg))
                    node.fills = [{ type: 'SOLID', color: bodyBg }];
                node.clip = true;
                return finish(node, el, fixed, ctx);
            }
            markRaster(node, el, ctx);
            return finish(node, el, fixed, ctx);
        }
        if (
            RASTER_TAGS.has(tag) ||
            (tag === 'INPUT' &&
                !TEXT_INPUT_TYPES.has(el.type) &&
                !BUTTON_INPUT_TYPES.has(el.type))
        ) {
            if (hidden || el.type === 'hidden' || w < 0.5 || h < 0.5)
                return null;
            markRaster(node, el, ctx);
            if (tag === 'CANVAS') {
                try {
                    node.image = {
                        src: el.toDataURL('image/png'),
                        fit: 'FILL',
                    };
                } catch (e) {
                    /* tainted or WebGL without preserveDrawingBuffer: CLI screenshots it */
                }
            }
            delete node.children;
            return finish(node, el, fixed, ctx);
        }
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            const t = !hidden && controlText(el, cs, rect);
            if (t) node.children.push(t);
            return finish(node, el, fixed, ctx);
        }
        // Icon fonts (`<i class="fa fa-x">`) render through ::before.
        if (!el.firstChild && !hidden) {
            const before = win.getComputedStyle(el, '::before').content;
            if (
                before &&
                before !== 'none' &&
                before !== 'normal' &&
                before !== '""'
            ) {
                markRaster(node, el, ctx);
                return finish(node, el, fixed, ctx);
            }
        }

        // Children -----------------------------------------------------------
        const childCtx = node.clip
            ? {
                  ...ctx,
                  clip: {
                      left: Math.max(clip.left, rect.left),
                      top: Math.max(clip.top, rect.top),
                      right: Math.min(clip.right, rect.right),
                      bottom: Math.min(clip.bottom, rect.bottom),
                  },
              }
            : { ...ctx, clip };
        const children = [];
        const nodes = [...el.childNodes].filter(
            (n) => n.nodeType !== Node.COMMENT_NODE,
        );
        for (let i = 0; i < nodes.length; i++) {
            const child = nodes[i];
            if (child.nodeType === Node.TEXT_NODE) {
                const runNodes = [child];
                while (nodes[i + 1] && nodes[i + 1].nodeType === Node.TEXT_NODE)
                    runNodes.push(nodes[++i]);
                if (hidden) continue;
                const t = textNodeFor(textRun(runNodes), el, cs, childCtx);
                for (const n of t ? [t].flat() : []) {
                    n.order = 0;
                    children.push(n);
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const c = await walk(child, childCtx);
                if (c) children.push(...(Array.isArray(c) ? c : [c]));
            }
        }
        if (el.shadowRoot) {
            for (const child of el.shadowRoot.children) {
                const c = await walk(child, childCtx);
                if (c) children.push(...(Array.isArray(c) ? c : [c]));
            }
        }
        children.sort((a, b) => a.order - b.order); // stable
        node.children = children;

        if (contents) return children; // no box of its own
        if (offscreen && !children.length) return null;
        return finish(node, el, fixed, ctx);
    }

    function markRaster(node, el, ctx) {
        node.type = 'IMAGE';
        node.raster = true;
        el.setAttribute('data-l2f-raster', node.id);
        ctx.rasters.push(node.id);
        delete node.children;
    }

    // position:fixed escapes every ancestor's clipping, so lift it to the root.
    function finish(node, el, fixed, ctx) {
        if (fixed && el !== ctx.rootEl) {
            ctx.hoisted.push(node);
            return null;
        }
        return node;
    }

    /* ------------------------------------------------------------------ */
    /* Entry point                                                        */
    /* ------------------------------------------------------------------ */

    function resetCapture() {
        tokenCache.clear();
        for (const k of Object.keys(tokens)) delete tokens[k];
    }

    async function capture(options = {}) {
        nextId = 1;
        idPrefix = 'n';
        resetCapture();
        document
            .querySelectorAll('[data-l2f-raster]')
            .forEach((e) => e.removeAttribute('data-l2f-raster'));
        const vw = document.documentElement.clientWidth;
        const vh = options.fullPage
            ? Math.max(
                  document.documentElement.scrollHeight,
                  window.innerHeight,
              )
            : window.innerHeight;
        const rootRect = {
            left: 0,
            top: 0,
            right: vw,
            bottom: vh,
            width: vw,
            height: vh,
        };
        const ctx = {
            dx: 0,
            dy: 0,
            clip: rootRect,
            root: rootRect,
            rasters: [],
            hoisted: [],
            // Only the CLI can screenshot; pasted into a console, transformed
            // boxes are better drawn flat than left as grey placeholders.
            raster: !!options.raster,
        };
        if (options.fullPage) {
            ctx.dy = window.scrollY;
            ctx.dx = window.scrollX;
        }

        const htmlCs = getComputedStyle(document.documentElement);
        const bodyCs = getComputedStyle(document.body);
        const canvasBg = [htmlCs.backgroundColor, bodyCs.backgroundColor]
            .map(parseColor)
            .find(visible) || { r: 1, g: 1, b: 1, a: 1 };

        const body = await walk(document.body, ctx);
        const children = [].concat(body || []);
        ctx.hoisted.sort((a, b) => a.order - b.order);
        children.push(...ctx.hoisted);

        const theme = document.documentElement.classList.contains('dark')
            ? 'Dark'
            : 'Light';
        const root = {
            type: 'FRAME',
            id: 'root',
            name:
                (document.title || location.pathname) +
                (location.hash ? ' ' + location.hash : ''),
            x: 0,
            y: 0,
            w: vw,
            h: vh,
            clip: true,
            fills: [{ type: 'SOLID', color: canvasBg }],
            children,
        };

        if (probeHost) {
            probeHost.remove();
            probeHost = null;
        }
        return {
            format: 'layout-to-figma',
            version: VERSION,
            source: {
                url: location.href,
                title: document.title,
                capturedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
            },
            viewport: {
                width: vw,
                height: vh,
                devicePixelRatio: window.devicePixelRatio,
            },
            theme,
            tokens: { colors: tokens },
            rasters: ctx.rasters,
            root,
        };
    }

    function download(doc) {
        const blob = new Blob([JSON.stringify(doc)], {
            type: 'application/json',
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const base = (document.title || 'layout').replace(/[^\w.-]+/g, '-');
        a.download = `${base}.figma-layout.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    }

    /* ------------------------------------------------------------------ */
    /* Interactive states: tabs and popovers                              */
    /* ------------------------------------------------------------------ */
    // The CLI drives these one state at a time so it can screenshot rasters
    // while each state is on screen.

    const POPUP_TRIGGERS =
        '[aria-haspopup]:not([aria-haspopup="false"]), [role="combobox"]';
    const CLICKABLE =
        'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="tab"], [onclick]';
    const POPUP_CONTENT =
        '[role="menu"], [role="listbox"], [role="dialog"], [role="tooltip"], [data-radix-popper-content-wrapper]';

    function isShown(el) {
        if (!el || !el.isConnected) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        if (
            r.right < 0 ||
            r.bottom < 0 ||
            r.left > innerWidth ||
            r.top > innerHeight
        )
            return false;
        const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
    }

    function labelOf(el) {
        return (
            el.getAttribute('aria-label') ||
            (el.innerText || el.textContent || '')
                .trim()
                .replace(/\s+/g, ' ')
                .slice(0, 40) ||
            el.getAttribute('title') ||
            reactComponentName(el) ||
            el.tagName.toLowerCase()
        );
    }

    function commonAncestor(a, b) {
        if (!b) return a;
        for (let e = a; e; e = e.parentElement) if (e.contains(b)) return e;
        return a;
    }

    // Tabs that don't point at their panel (no aria-controls, as in the
    // pendant): the panel is whatever else shows in the nearest box around
    // the tab strip.
    function tabsWithContent(list) {
        for (let e = list; e.parentElement; e = e.parentElement) {
            const box = e.parentElement;
            if (box === document.body || box === document.documentElement)
                break;
            if ([...box.children].some((c) => c !== e && isShown(c)))
                return box;
        }
        return list;
    }

    // Marks tab groups and popup triggers with data attributes and returns
    // what the CLI should cycle through. `within` / `skip` are CSS selectors
    // that limit this to part of the page (e.g. only `main`, or not `header`).
    function findStates({ within, skip } = {}) {
        const inScope = (el) =>
            !el.closest('[data-figma-ignore]') &&
            (!within || !!el.closest(within)) &&
            (!skip || !el.closest(skip));
        for (const attr of [
            'data-l2f-state',
            'data-l2f-tab',
            'data-l2f-trigger',
            'data-l2f-popover',
        ]) {
            document
                .querySelectorAll(`[${attr}]`)
                .forEach((e) => e.removeAttribute(attr));
        }
        const states = [];
        let k = 0;
        for (const list of document.querySelectorAll('[role="tablist"]')) {
            if (!isShown(list) || !inScope(list)) continue;
            // Tabs scrolled out of the strip still count.
            const tabs = [...list.querySelectorAll('[role="tab"]')].filter(
                (t) =>
                    t.getClientRects().length &&
                    getComputedStyle(t).visibility !== 'hidden',
            );
            if (tabs.length < 2) continue;
            const selected =
                tabs.find(
                    (t) =>
                        t.getAttribute('aria-selected') === 'true' ||
                        t.getAttribute('data-state') === 'active',
                ) || tabs[0];
            const panelId = selected.getAttribute('aria-controls');
            const panel = panelId && document.getElementById(panelId);
            const group =
                panel && isShown(panel)
                    ? commonAncestor(list, panel)
                    : tabsWithContent(list);
            const key = 't' + k++;
            group.setAttribute('data-l2f-state', key);
            tabs.forEach((t, i) =>
                t.setAttribute('data-l2f-tab', `${key}:${i}`),
            );
            states.push({
                key,
                kind: 'tabs',
                name:
                    list.getAttribute('aria-label') ||
                    reactComponentName(group) ||
                    'Tabs',
                tabs: tabs.map((t) => ({
                    label: labelOf(t),
                    selected: t === selected,
                })),
            });
        }
        const triggers = [...document.querySelectorAll(POPUP_TRIGGERS)].filter(
            (t) =>
                isShown(t) &&
                !t.disabled &&
                t.getAttribute('aria-expanded') !== 'true' &&
                !t.closest('[role="tablist"]') &&
                inScope(t),
        );
        let j = 0;
        for (const trigger of triggers) {
            // A trigger wrapping another opens the same popup: click the
            // inner one, but name it after the outer if that has a label.
            if (triggers.some((t) => t !== trigger && trigger.contains(t)))
                continue;
            const outer = triggers.find(
                (t) => t !== trigger && t.contains(trigger),
            );
            const key = 'p' + j++;
            trigger.setAttribute('data-l2f-trigger', key);
            const r = trigger.getBoundingClientRect();
            states.push({
                key,
                kind: 'popover',
                name:
                    (outer && outer.getAttribute('aria-label')) ||
                    labelOf(trigger),
                trigger: { x: r.left, y: r.top, w: r.width, h: r.height },
            });
        }
        return states;
    }

    function clickTab(key, index) {
        const tab = document.querySelector(`[data-l2f-tab="${key}:${index}"]`);
        if (!tab) return false;
        tab.click();
        return true;
    }

    // Snapshots what's on the page, then returns the trigger's centre so the
    // CLI can click it with real input (Radix menus open on pointerdown,
    // which a synthetic click() doesn't send).
    let beforePopup = null;
    function preparePopover(key) {
        const trigger = document.querySelector(`[data-l2f-trigger="${key}"]`);
        if (!trigger || !isShown(trigger)) return null;
        beforePopup = new Set([
            ...document.body.children,
            ...document.querySelectorAll(POPUP_CONTENT),
        ]);
        const r = trigger.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        // Something else on top (an overlay) would get the click instead.
        const hit = document.elementFromPoint(x, y);
        if (!hit || !(trigger === hit || trigger.contains(hit))) return null;
        // So would a control nested in the trigger, like the invisible
        // Disconnect button covering gSender's connection button once
        // connected. Never click something other than the trigger.
        const control = hit.closest(CLICKABLE);
        if (control && control !== trigger && trigger.contains(control))
            return null;
        return { x, y };
    }

    function isExpanded(key) {
        const trigger = document.querySelector(`[data-l2f-trigger="${key}"]`);
        return !!trigger && trigger.getAttribute('aria-expanded') === 'true';
    }

    // Finds what the last openPopover() revealed and marks it for capture.
    function markPopover(key) {
        const trigger = document.querySelector(`[data-l2f-trigger="${key}"]`);
        const controls = trigger && trigger.getAttribute('aria-controls');
        let found = controls && document.getElementById(controls);
        if (!isShown(found)) {
            const fresh = [
                ...document.body.children,
                ...document.querySelectorAll(POPUP_CONTENT),
            ].filter(
                (e) =>
                    !beforePopup.has(e) &&
                    isShown(e) &&
                    !e.hasAttribute('data-figma-ignore') &&
                    !SKIP_TAGS.has(e.tagName),
            );
            // Prefer the outermost new element.
            found = fresh.find(
                (e) => !fresh.some((o) => o !== e && o.contains(e)),
            );
        }
        if (!isShown(found)) return false;
        found.setAttribute('data-l2f-popover', key);
        return true;
    }

    function unmarkPopover() {
        document
            .querySelectorAll('[data-l2f-popover]')
            .forEach((e) => e.removeAttribute('data-l2f-popover'));
    }

    // Serializes one element (and anything fixed inside it) with ids that
    // can't collide with the main capture.
    // The colour showing behind a subtree that has no background of its own
    // (a tab panel on its card), so its component can carry it. Translucent
    // backgrounds are blended over whatever is further back.
    function backdropOf(el) {
        const layers = [];
        for (let e = el; e; e = e.parentElement) {
            const c = parseColor(getComputedStyle(e).backgroundColor);
            if (!visible(c)) continue;
            layers.push({ el: e, color: c });
            if (c.a > 0.999) break;
        }
        if (!layers.length || layers[0].el === el) return null;
        let color = { r: 1, g: 1, b: 1, a: 1 };
        for (const { color: c } of layers.reverse()) {
            color = {
                r: c.r * c.a + color.r * (1 - c.a),
                g: c.g * c.a + color.g * (1 - c.a),
                b: c.b * c.a + color.b * (1 - c.a),
                a: 1,
            };
        }
        const top = layers[layers.length - 1];
        return {
            color,
            token:
                top.color.a > 0.999 && layers.length === 1
                    ? colorToken(top.el, 'bg', top.color)
                    : undefined,
        };
    }

    // Absolutely positioned parts (a tab strip above its panel) can sit
    // outside the root's box. Grow the root over them, within `limit` (the
    // viewport), so the component's frame and background cover everything;
    // `grown` says how far the top-left moved, so the importer can line its
    // instance up again. Only boxes that draw something count: empty
    // wrappers (a button's ripple layer) can be far larger than what shows.
    function growToContent(root, limit) {
        if (root.fills || root.stroke || root.effects) return;
        let left = root.x;
        let top = root.y;
        let right = root.x + root.w;
        let bottom = root.y + root.h;
        // Content a clipping box hides (a scrolled tab strip, a button's
        // spinning border layer) doesn't count.
        (function visit(n, clip) {
            for (const c of n.children || []) {
                const l = Math.max(c.x, clip.left);
                const t = Math.max(c.y, clip.top);
                const r = Math.min(c.x + c.w, clip.right);
                const b = Math.min(c.y + c.h, clip.bottom);
                const draws =
                    c.type !== 'FRAME' ||
                    c.fills ||
                    c.stroke ||
                    c.effects ||
                    c.image;
                if (draws && r - l > 0 && b - t > 0) {
                    left = Math.min(left, l);
                    top = Math.min(top, t);
                    right = Math.max(right, r);
                    bottom = Math.max(bottom, b);
                }
                visit(
                    c,
                    c.clip ? { left: l, top: t, right: r, bottom: b } : clip,
                );
            }
        })(root, limit);
        if (
            left === root.x &&
            top === root.y &&
            right === root.x + root.w &&
            bottom === root.y + root.h
        )
            return;
        root.grown = { x: root.x - left, y: root.y - top };
        root.x = left;
        root.y = top;
        root.w = right - left;
        root.h = bottom - top;
    }

    // Scroll areas inside a state (a long tab panel, an iframe widget's page)
    // are opened to their full height so the component shows everything, not
    // just what fits. Innermost first, so outer boxes are measured after
    // what's inside them has grown. restoreExpanded() puts the styles back.
    let expandedStyles = [];
    function expandScrollAreas(root) {
        let count = 0;
        const open = (e, height) => {
            expandedStyles.push([e, e.style.cssText]);
            for (const [prop, value] of [
                ['overflow', 'visible'],
                ['max-height', 'none'],
                ['height', `${height}px`],
                ['min-height', `${height}px`],
                ['flex-shrink', '0'],
            ])
                e.style.setProperty(prop, value, 'important');
            count++;
        };
        for (const frame of root.querySelectorAll('iframe')) {
            let doc = null;
            try {
                doc = frame.contentDocument;
            } catch (e) {
                /* cross-origin */
            }
            if (!doc || !doc.body) continue;
            count += expandScrollAreas(doc.body);
            const page = doc.documentElement;
            const extra = page.scrollHeight - page.clientHeight;
            if (extra > 1) open(frame, frame.offsetHeight + extra);
        }
        const areas = [root, ...root.querySelectorAll('*')].filter((e) =>
            /auto|scroll/.test(getComputedStyle(e).overflowY),
        );
        for (const e of areas.reverse()) {
            const extra = e.scrollHeight - e.clientHeight;
            if (extra > 1) open(e, e.offsetHeight + extra);
        }
        return count;
    }

    function restoreExpanded() {
        for (const [e, css] of expandedStyles.reverse()) e.style.cssText = css;
        expandedStyles = [];
    }

    // With `expand`, scroll areas stay open until restoreExpanded() so the
    // caller can screenshot rasters in the same layout; call it afterwards.
    async function captureSubtree(selector, prefix, options = {}) {
        const el = document.querySelector(selector);
        if (!el) return null;
        idPrefix = prefix;
        nextId = 1;
        document
            .querySelectorAll('[data-l2f-raster]')
            .forEach((e) => e.removeAttribute('data-l2f-raster'));
        const shownHeight = el.getBoundingClientRect().height;
        // The page around it may grow too; a scrollbar appearing would
        // narrow it and change how text wraps.
        if (options.expand) {
            const page = document.documentElement;
            expandedStyles.push([page, page.style.cssText]);
            page.style.setProperty('overflow', 'hidden', 'important');
        }
        const expanded = options.expand && expandScrollAreas(el) > 0;
        const top = el.getBoundingClientRect().top;
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        // Opened content can run below the window.
        const rootRect = {
            left: 0,
            top: 0,
            right: vw,
            bottom: expanded ? Infinity : vh,
            width: vw,
            height: expanded ? Infinity : vh,
        };
        const ctx = {
            dx: 0,
            dy: 0,
            clip: rootRect,
            root: rootRect,
            rasters: [],
            hoisted: [],
            raster: !!options.raster,
            rootEl: el,
        };
        const result = await walk(el, ctx);
        let node = Array.isArray(result) ? result[0] : result;
        if (!node) return null;
        if (ctx.hoisted.length && node.children)
            node.children.push(...ctx.hoisted);
        delete node.stateKey;
        node.absolute = false;
        const backdrop = backdropOf(el);
        if (backdrop) node.backdrop = backdrop;
        growToContent(node, rootRect);
        // How much of it the app showed, for the instance in the screen.
        const shown = top - node.y + shownHeight;
        if (expanded && node.h > shown + 0.5) node.shownHeight = shown;
        if (probeHost) {
            probeHost.remove();
            probeHost = null;
        }
        return { node, rasters: ctx.rasters, tokens: { ...tokens } };
    }

    window.__layoutToFigma = {
        capture,
        download,
        findStates,
        clickTab,
        preparePopover,
        isExpanded,
        markPopover,
        unmarkPopover,
        captureSubtree,
        restoreExpanded,
        version: VERSION,
    };

    if (!window.__L2F_NO_AUTORUN) {
        capture().then((doc) => {
            download(doc);
            console.log(
                `[layout-to-figma] captured ${doc.viewport.width}×${doc.viewport.height}. ` +
                    (doc.rasters.length
                        ? `${doc.rasters.length} canvas/native element(s) could not be read from the page; use the CLI to screenshot them.`
                        : ''),
            );
        });
    }
})();
