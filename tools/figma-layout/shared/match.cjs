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

    return {
        tokens: tokens,
        nameSimilarity: nameSimilarity,
        pathSimilarity: pathSimilarity,
        positionSimilarity: positionSimilarity,
        score: score,
        bestMatch: bestMatch,
        matchFrames: matchFrames,
    };
})();
if (typeof module !== 'undefined') module.exports = L2FMatch;
