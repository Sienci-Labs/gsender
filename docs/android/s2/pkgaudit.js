// Spike S2 pass 2: which Node builtins does each third-party package on the
// protocol path need, transitively, when bundled for a neutral JS engine?
const path = require('path');
const fs = require('fs');
const { builtinModules } = require('module');

const REPO = path.resolve(__dirname, '../../..');
const esbuild = require(path.join(REPO, 'node_modules/esbuild'));
const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));

const PKGS = [
    'lodash', 'gcode-parser', 'gcode-interpreter', 'ensure-array', 'esprima', 'escodegen',
    'crc-full', 'buffer-chunks', '@serialport/parser-readline', '@serialport/parser-byte-length',
    'basic-ftp', 'nrf-intel-hex', 'chalk', 'winston', 'shortid', '@sienci/avrgirl-arduino', 'usb',
];

async function audit(pkg, mainFields) {
    const used = {};
    const natives = new Set();
    try {
        const r = await esbuild.build({
            stdin: { contents: `export * from ${JSON.stringify(pkg)};`, resolveDir: REPO },
            bundle: true, write: false, platform: 'neutral', format: 'esm', metafile: true,
            mainFields, conditions: mainFields.includes('browser') ? ['browser'] : [],
            logLevel: 'silent', minify: true,
            plugins: [{
                name: 'b',
                setup(b) {
                    b.onResolve({ filter: /.*/ }, (a) => {
                        if (builtins.has(a.path)) {
                            (used[a.path.replace(/^node:/, '')] ||= new Set()).add(a.importer.split('node_modules').pop().replace(/\\/g, '/'));
                            return { path: a.path, external: true };
                        }
                        return undefined;
                    });
                    b.onLoad({ filter: /\.node$/ }, (a) => { natives.add(a.path); return { contents: '' }; });
                },
            }],
        });
        const bytes = r.outputFiles[0].contents.length;
        const deps = new Set(Object.keys(r.metafile.inputs).map((f) => f.match(/node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/)?.[1]).filter(Boolean));
        return { ok: true, kb: Math.round(bytes / 1024), builtins: Object.keys(used).sort(), deps: [...deps].sort(), natives: [...natives] };
    } catch (e) {
        return { ok: false, err: (e.errors || []).slice(0, 2).map((x) => x.text).join(' | ') || String(e) };
    }
}

(async () => {
    const out = {};
    for (const p of PKGS) {
        out[p] = { node: await audit(p, ['module', 'main']), browser: await audit(p, ['browser', 'module', 'main']) };
        const n = out[p].node, b = out[p].browser;
        console.log(p.padEnd(32), n.ok ? `${String(n.kb).padStart(5)}KB node:[${n.builtins}]` : `ERR ${n.err}`, '|', b.ok ? `browser:[${b.builtins}]` : `ERR ${b.err}`, n.natives?.length ? `NATIVE ${n.natives.length}` : '');
    }
    const outDir = path.join(__dirname, 'out');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'pkgreport.json'), JSON.stringify(out, null, 2));
})();
