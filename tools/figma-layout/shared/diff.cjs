/*
 * Duplicate masking: compares two captures and keeps only what differs.
 *
 * Plain ES2017 with no imports, because the same text runs in three places:
 * Node (capture/diff.mjs, the launcher), and the Figma plugin's UI, where
 * sync-plugin.mjs pastes it into ui.html. Edit it here, then run
 * `yarn figma:sync-plugin`.
 */
var L2FDiff = (function () {
    var sigCache = new WeakMap();
    var ownCache = new WeakMap();

    // FNV-1a, 32 bit. Long strings (embedded images) are hashed in full so
    // a redrawn canvas counts as a change.
    function hash(str, seed) {
        var h = seed === undefined ? 0x811c9dc5 : seed;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
        }
        return h;
    }

    function r(v) {
        return Math.round((Number(v) || 0) * 2) / 2;
    }
    function color(c) {
        if (!c) return '';
        return [c.r, c.g, c.b, c.a === undefined ? 1 : c.a]
            .map(function (v) {
                return Math.round(v * 255);
            })
            .join('.');
    }
    function paint(f) {
        if (!f) return '';
        if (f.type === 'SOLID') return 'S' + color(f.color);
        if (f.type === 'IMAGE') return 'I' + hash(f.src || '') + (f.fit || '');
        return (
            f.type +
            r(f.angle) +
            (f.stops || [])
                .map(function (s) {
                    return r(s.position * 100) + color(s.color);
                })
                .join(',')
        );
    }

    // Everything the node paints itself: not where it sits, and not its
    // children. Names and class lists are left out on purpose, so a renamed
    // component that looks the same is not a difference.
    function ownSignature(n) {
        var cached = ownCache.get(n);
        if (cached !== undefined) return cached;
        var parts = [n.type, r(n.w), r(n.h)];
        if (n.fills) parts.push('f' + n.fills.map(paint).join('|'));
        if (n.stroke)
            parts.push(
                's' +
                    color(n.stroke.color) +
                    (n.stroke.weights || []).map(r).join(',') +
                    (n.stroke.dash || []).join(','),
            );
        if (n.radius) parts.push('r' + n.radius.map(r).join(','));
        if (n.effects)
            parts.push(
                'e' +
                    n.effects
                        .map(function (e) {
                            return [
                                e.type,
                                color(e.color),
                                r(e.x),
                                r(e.y),
                                r(e.blur),
                                r(e.spread),
                                r(e.radius),
                            ].join(',');
                        })
                        .join('|'),
            );
        if (n.opacity !== undefined) parts.push('o' + Math.round(n.opacity * 100));
        if (n.clip) parts.push('c');
        if (n.clipPath) parts.push('p' + hash(JSON.stringify(n.clipPath)));
        if (n.image) parts.push('i' + hash(n.image.src || ''));
        if (n.type === 'SVG') parts.push('v' + hash(n.svg || ''));
        if (n.type === 'TEXT') {
            var s = n.style || {};
            parts.push(
                't' +
                    hash(n.characters || '') +
                    [
                        (s.families || [])[0],
                        r(s.size),
                        s.weight,
                        s.italic ? 'i' : '',
                        r(s.lineHeight),
                        r(s.letterSpacing),
                        s.decoration,
                        s.textCase,
                        s.align,
                        color(s.color),
                    ].join(','),
            );
        }
        var out = parts.join(';');
        ownCache.set(n, out);
        return out;
    }

    // The node and everything under it, with children placed relative to it,
    // so a subtree that only moved keeps its signature.
    function signature(n) {
        var cached = sigCache.get(n);
        if (cached !== undefined) return cached;
        var h = hash(ownSignature(n));
        var kids = n.children || [];
        for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            h = hash(r(c.x - n.x) + ',' + r(c.y - n.y) + ':' + signature(c), h);
        }
        var out = h.toString(36) + '.' + kids.length;
        sigCache.set(n, out);
        return out;
    }

    function count(n) {
        var c = 1;
        var kids = n.children || [];
        for (var i = 0; i < kids.length; i++) c += count(kids[i]);
        return c;
    }

    function shell(n, children, keepPaint) {
        var out = {};
        for (var k in n) if (k !== 'children') out[k] = n[k];
        out.children = children;
        if (!keepPaint) {
            delete out.fills;
            delete out.stroke;
            delete out.effects;
            delete out.clipPath;
            delete out.image;
            delete out.raster;
            // Changed pieces must stay visible past an unpainted wrapper.
            out.clip = false;
        }
        return out;
    }

    // Returns a copy of `next` holding only what differs from `base`, or
    // null when they look the same. `ctx.rootArea` decides when a changed
    // box is big enough to be a container rather than a component: a
    // container whose own background or size changed keeps its paint but
    // still only the children that changed, while a component (a button
    // whose colour changed) comes through whole.
    function maskNode(base, next, ctx, isRoot) {
        if (!base) {
            ctx.stats.added += count(next);
            return next;
        }
        if (signature(base) === signature(next)) return null;
        var kids = next.children || [];
        var ownChanged = ownSignature(base) !== ownSignature(next);
        var container =
            isRoot || (next.w || 0) * (next.h || 0) > ctx.rootArea * 0.5;
        if (next.type !== 'FRAME' || !kids.length || (ownChanged && !container)) {
            ctx.stats.changed += count(next);
            return next;
        }

        // Children that are identical somewhere in the old list are
        // unchanged even if they moved or were reordered.
        var pool = (base.children || []).slice();
        var pending = [];
        for (var i = 0; i < kids.length; i++) {
            var sig = signature(kids[i]);
            var at = -1;
            for (var j = 0; j < pool.length; j++) {
                if (pool[j] && signature(pool[j]) === sig) {
                    at = j;
                    break;
                }
            }
            if (at >= 0) pool[at] = null;
            else pending.push(kids[i]);
        }
        // Pair what is left by layer name and type, in order.
        var out = [];
        for (var p = 0; p < pending.length; p++) {
            var child = pending[p];
            var match = null;
            for (var q = 0; q < pool.length; q++) {
                var cand = pool[q];
                if (cand && cand.type === child.type && cand.name === child.name) {
                    match = cand;
                    pool[q] = null;
                    break;
                }
            }
            var masked = maskNode(match, child, ctx, false);
            if (masked) out.push(masked);
        }
        for (var m = 0; m < pool.length; m++)
            if (pool[m]) ctx.stats.removed += count(pool[m]);
        if (ownChanged) ctx.stats.changed += 1;
        if (!out.length && !ownChanged) return null;
        return shell(next, out, ownChanged);
    }

    function newCtx(root) {
        return {
            rootArea: Math.max(1, (root.w || 0) * (root.h || 0)),
            stats: { changed: 0, added: 0, removed: 0 },
        };
    }

    function byKey(list, key) {
        var map = {};
        (list || []).forEach(function (item) {
            var k = key(item);
            if (!(k in map)) map[k] = item;
        });
        return map;
    }

    function copyDoc(doc, extra) {
        var out = {};
        for (var k in doc) out[k] = doc[k];
        for (var e in extra) out[e] = extra[e];
        return out;
    }

    function baselineInfo(base) {
        return {
            capturedAt: base.source && base.source.capturedAt,
            name: base.kind === 'storybook' ? 'Storybook' : base.root && base.root.name,
        };
    }

    function maskScreen(base, next) {
        var ctx = newCtx(next.root);
        var root = maskNode(base.root, next.root, ctx, true);
        var states = [];
        var unchangedStates = 0;
        var tabKey = function (st) {
            return st.kind + ':' + st.name;
        };
        var baseStates = byKey(base.states, tabKey);
        (next.states || []).forEach(function (st) {
            var old = baseStates[tabKey(st)];
            if (st.kind === 'tabs') {
                var oldOptions = byKey(old && old.options, function (o) {
                    return o.value;
                });
                var options = st.options.filter(function (o) {
                    var b = oldOptions[o.value];
                    return !b || signature(b.node) !== signature(o.node);
                });
                unchangedStates += st.options.length - options.length;
                if (options.length) {
                    var copy = copyDoc(st, { options: options });
                    states.push(copy);
                }
            } else if (!old || signature(old.node) !== signature(st.node)) {
                states.push(st);
            } else {
                unchangedStates++;
            }
        });
        if (!root && !states.length) return null;
        var stats = ctx.stats;
        stats.states = states.length;
        stats.unchangedStates = unchangedStates;
        var emptyRoot = !root;
        if (!root) root = shell(next.root, [], false);
        // maskNode hands back the capture's own node when all of it
        // changed; don't edit that one.
        else root = shell(root, root.children || [], true);
        delete root.fills;
        root.clip = false;
        root.name = next.root.name + ' (changes)';
        return copyDoc(next, {
            root: root,
            states: states,
            mask: {
                baseline: baselineInfo(base),
                stats: stats,
                emptyRoot: emptyRoot,
            },
        });
    }

    function maskStorybook(base, next) {
        var stats = { changed: 0, added: 0, removed: 0, unchanged: 0 };
        var baseComponents = byKey(base.components, function (c) {
            return c.title;
        });
        var components = [];
        (next.components || []).forEach(function (comp) {
            var old = baseComponents[comp.title];
            var oldVariants = byKey(old && old.variants, function (v) {
                return v.name;
            });
            var variants = comp.variants.filter(function (v) {
                var b = oldVariants[v.name];
                if (!b) {
                    stats.added++;
                    return true;
                }
                if (signature(b.node) !== signature(v.node)) {
                    stats.changed++;
                    return true;
                }
                stats.unchanged++;
                return false;
            });
            var seen = byKey(comp.variants, function (v) {
                return v.name;
            });
            ((old && old.variants) || []).forEach(function (v) {
                if (!(v.name in seen)) stats.removed++;
            });
            if (variants.length)
                components.push(copyDoc(comp, { variants: variants }));
        });
        var nextTitles = byKey(next.components, function (c) {
            return c.title;
        });
        (base.components || []).forEach(function (c) {
            if (!(c.title in nextTitles)) stats.removed += c.variants.length;
        });
        if (!components.length) return null;
        return copyDoc(next, {
            components: components,
            mask: { baseline: baselineInfo(base), stats: stats },
        });
    }

    // Returns a capture holding only what differs from `base`, or null when
    // nothing does. The two must be the same kind (two screens, or two
    // Storybook captures).
    function maskDoc(base, next) {
        var kind = function (d) {
            return d.kind === 'storybook' ? 'storybook' : 'screen';
        };
        if (kind(base) !== kind(next))
            throw new Error(
                "Can't compare a " + kind(next) + ' capture with a ' + kind(base) + ' capture.',
            );
        return kind(next) === 'storybook'
            ? maskStorybook(base, next)
            : maskScreen(base, next);
    }

    function pagePath(doc) {
        var url = (doc.source && doc.source.url) || '';
        var m = url.match(/^[a-z]+:\/\/[^/]+(.*)$/i);
        return (m ? m[1] : url).replace(/\/+$/, '');
    }

    // The baseline to compare `doc` with: the one for the same screen,
    // layout, theme and size if there is one, else the closest.
    function pickBaseline(baselines, doc) {
        var best = null;
        var bestScore = -1;
        (baselines || []).forEach(function (b) {
            if ((b.kind === 'storybook') !== (doc.kind === 'storybook')) return;
            var score = 0;
            if ((b.layout || 'desktop') === (doc.layout || 'desktop')) score += 4;
            if (pagePath(b) === pagePath(doc)) score += 8;
            if (b.theme === doc.theme) score += 2;
            if (
                b.viewport &&
                doc.viewport &&
                b.viewport.width === doc.viewport.width &&
                b.viewport.height === doc.viewport.height
            )
                score += 1;
            if (score > bestScore) {
                best = b;
                bestScore = score;
            }
        });
        return best;
    }

    function describe(mask) {
        if (!mask) return 'No differences.';
        var s = mask.stats;
        var parts = [];
        if (s.changed) parts.push(s.changed + ' changed');
        if (s.added) parts.push(s.added + ' added');
        if (s.removed) parts.push(s.removed + ' removed (not shown)');
        if (s.states) parts.push(s.states + ' tab/menu component(s)');
        if (s.unchanged) parts.push(s.unchanged + ' unchanged skipped');
        return parts.join(', ') || 'Differences found.';
    }

    return {
        signature: signature,
        ownSignature: ownSignature,
        maskNode: maskNode,
        maskDoc: maskDoc,
        pickBaseline: pickBaseline,
        describe: describe,
    };
})();
if (typeof module !== 'undefined') module.exports = L2FDiff;
