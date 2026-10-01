// Spike S2 pass 3: which server endpoints / socket events can the pendant bundle reach?
const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '../../..');
const esbuild = require(path.join(REPO, 'node_modules/esbuild'));
const APP = path.join(REPO, 'src/app/src');

function resolveAlias(p) {
    const base = p.startsWith('app-root/') ? path.join(REPO, p.slice(9)) : path.join(APP, p.replace(/^(app|@)\//, ''));
    for (const c of [base, ...['.ts', '.tsx', '.js', '.jsx'].map((e) => base + e), ...['index.ts', 'index.tsx', 'index.js'].map((e) => path.join(base, e))]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
}

(async () => {
    const r = await esbuild.build({
        entryPoints: [path.join(REPO, 'src/pendant/src/entry-pendant.tsx')],
        bundle: true, write: false, metafile: true, platform: 'browser', format: 'esm',
        outdir: path.join(__dirname, 'out', 'pendant'), logLevel: 'silent', jsx: 'automatic',
        loader: { '.svg': 'empty', '.png': 'empty', '.jpg': 'empty', '.css': 'empty', '.styl': 'empty', '.scss': 'empty', '.less': 'empty', '.json': 'json', '.woff': 'empty', '.woff2': 'empty', '.ttf': 'empty', '.mp3': 'empty', '.wav': 'empty', '.gif': 'empty' },
        plugins: [{
            name: 'alias',
            setup(b) {
                b.onResolve({ filter: /^(app|@|app-root)\// }, (a) => {
                    const p = resolveAlias(a.path);
                    return p ? { path: p } : { path: a.path, external: true };
                });
                b.onResolve({ filter: /\?worker|\?url|\?raw/ }, (a) => ({ path: a.path, external: true }));
                b.onResolve({ filter: /^[^./]/ }, (a) => (/^[A-Za-z]:/.test(a.path) ? undefined : { path: a.path, external: true }));
            },
        }],
    });
    const files = Object.keys(r.metafile.inputs).map((f) => path.resolve(REPO, f)).filter((f) => !f.includes('node_modules'));
    const apiCalls = {};
    const restPaths = {};
    const emits = {};
    for (const f of files) {
        const t = fs.readFileSync(f, 'utf8');
        for (const m of t.matchAll(/\bapi\.([a-zA-Z]+)(?:\.([a-zA-Z]+))?\(/g)) (apiCalls[m[1] + (m[2] ? '.' + m[2] : '')] ||= new Set()).add(path.relative(REPO, f));
        for (const m of t.matchAll(/['"`](\/?api\/[a-zA-Z0-9/_:-]+)/g)) (restPaths[m[1]] ||= new Set()).add(path.relative(REPO, f));
        for (const m of t.matchAll(/controller\.command\(\s*['"`]([a-zA-Z:._-]+)/g)) (emits[m[1]] ||= new Set()).add(path.relative(REPO, f));
    }
    const fmt = (o) => Object.entries(o).sort().map(([k, v]) => `  ${k.padEnd(34)} ${v.size}`).join('\n');
    console.log('pendant first-party files reached:', files.length, ' (from src/app/src:', files.filter((f) => f.includes(path.normalize('src/app/src'))).length + ')');
    console.log('\napi.* calls:\n' + fmt(apiCalls));
    console.log('\nliteral /api paths:\n' + fmt(restPaths));
    console.log('\ncontroller.command names:\n' + fmt(emits));
    if (r.warnings.length) console.log('warnings', r.warnings.length);
})().catch((e) => { console.error((e.errors || []).slice(0, 5).map((x) => x.text + ' @ ' + (x.location && x.location.file)).join('\n') || e); process.exit(1); });
