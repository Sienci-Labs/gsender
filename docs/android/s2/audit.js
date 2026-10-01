// Spike S2: core boundary audit.
// Bundles the protocol-path entry points and records every Node builtin,
// npm package and electron import reached, plus which first-party file pulled it in.
const path = require('path');
const fs = require('fs');
const { builtinModules } = require('module');

const REPO = path.resolve(__dirname, '../../..');
const esbuild = require(path.join(REPO, 'node_modules/esbuild'));
const SRC = path.join(REPO, 'src');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const ENTRIES = {
    GrblHalController: 'server/controllers/Grblhal/GrblHalController.js',
    GrblController: 'server/controllers/Grbl/GrblController.js',
    Connection: 'server/lib/Connection.js',
    SerialConnection: 'server/lib/SerialConnection.js',
    Sender: 'server/lib/Sender.js',
    Feeder: 'server/lib/Feeder.js',
    JogStreamer: 'server/lib/JogStreamer.js',
    YModemUSB: 'server/lib/YModemUSB.js',
    GrblHALFTP: 'server/lib/GrblHALFTP.js',
    DFUFlasher: 'server/lib/Firmware/Flashing/DFUFlasher.js',
    firmwareflashing: 'server/lib/Firmware/Flashing/firmwareflashing.js',
    CNCEngine: 'server/services/cncengine/CNCEngine.js',
};

const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));

function resolveFromSrc(p) {
    const base = path.resolve(SRC, p);
    for (const c of [base, base + '.js', base + '.ts', base + '.tsx', path.join(base, 'index.js'), path.join(base, 'index.ts')]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return base;
}

const rel = (f) => path.relative(REPO, f).replace(/\\/g, '/');
const pkgName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

function auditPlugin(rec) {
    return {
        name: 'audit',
        setup(build) {
            build.onResolve({ filter: /^(server|app|electron-app)\// }, (a) => ({ path: resolveFromSrc(a.path) }));
            build.onResolve({ filter: /^!/ }, (a) => {
                rec.assets.add(`${a.path}  <- ${rel(a.importer)}`);
                return { path: a.path, external: true };
            });
            build.onResolve({ filter: /^[^./]/ }, (a) => {
                if (/^[A-Za-z]:[\\/]/.test(a.path)) return undefined;
                const imp = rel(a.importer);
                if (builtins.has(a.path)) {
                    const name = a.path.replace(/^node:/, '').split('/')[0];
                    (rec.builtins[name] ||= new Set()).add(imp);
                } else {
                    const name = pkgName(a.path);
                    (rec.packages[name] ||= new Set()).add(imp);
                }
                return { path: a.path, external: true };
            });
        },
    };
}

async function bundle(entries) {
    const rec = { builtins: {}, packages: {}, assets: new Set() };
    const result = await esbuild.build({
        entryPoints: entries.map((e) => resolveFromSrc(e)),
        bundle: true,
        write: false,
        platform: 'neutral',
        format: 'esm',
        outdir: path.join(OUT, 'out'),
        mainFields: ['module', 'main'],
        resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        loader: { '.txt': 'text', '.hex': 'text' },
        metafile: true,
        logLevel: 'silent',
        plugins: [auditPlugin(rec)],
    });
    const files = Object.keys(result.metafile.inputs).filter((f) => !f.includes('node_modules'));
    return { rec, files: files.map((f) => rel(path.resolve(REPO, f))), warnings: result.warnings };
}

// Globals that only exist in Node (or need a polyfill elsewhere).
const GLOBAL_PATTERNS = {
    process: /\bprocess\.(env|platform|nextTick|cwd|exit|on|argv|versions|hrtime|memoryUsage|uptime|pid)\b/g,
    Buffer: /\bBuffer\.(from|alloc|allocUnsafe|concat|isBuffer|byteLength)\b/g,
    __dirname: /\b__dirname\b|\b__filename\b/g,
    setImmediate: /\bsetImmediate\b/g,
    'global.': /\bglobal\.[A-Za-z_]+/g,
    'require(dynamic)': /\brequire\(\s*[^'"\s)]/g,
};

function scanGlobals(files) {
    const out = {};
    for (const f of files) {
        const abs = path.join(REPO, f);
        if (!fs.existsSync(abs)) continue;
        const text = fs.readFileSync(abs, 'utf8');
        for (const [k, re] of Object.entries(GLOBAL_PATTERNS)) {
            const m = text.match(re);
            if (m) {
                out[k] ||= {};
                out[k][f] = [...new Set(m)].join(', ');
            }
        }
    }
    return out;
}

// Member-level usage of builtins in first-party files, e.g. fs.readFileSync.
function scanBuiltinMembers(files, names) {
    const out = {};
    for (const f of files) {
        const abs = path.join(REPO, f);
        if (!fs.existsSync(abs)) continue;
        const text = fs.readFileSync(abs, 'utf8');
        for (const n of names) {
            const re = new RegExp(`import\\s+(?:\\*\\s+as\\s+)?(\\w+)?[^;]*from\\s+['"](?:node:)?${n}['"]|(\\w+)\\s*=\\s*require\\(['"](?:node:)?${n}['"]\\)`, 'g');
            let m;
            const locals = new Set();
            const named = new Set();
            while ((m = re.exec(text))) {
                if (m[1]) locals.add(m[1]);
                if (m[2]) locals.add(m[2]);
                const braces = m[0].match(/\{([^}]*)\}/);
                if (braces) braces[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach((s) => named.add(s));
            }
            const members = new Set(named);
            for (const l of locals) {
                for (const mm of text.matchAll(new RegExp(`\\b${l}\\.(\\w+)`, 'g'))) members.add(mm[1]);
            }
            if (locals.size || named.size) {
                out[n] ||= {};
                out[n][f] = [...members].join(', ') || '(default import, no member access)';
            }
        }
    }
    return out;
}

(async () => {
    const report = { perEntry: {}, combined: null };
    for (const [name, entry] of Object.entries(ENTRIES)) {
        const { rec, files } = await bundle([entry]);
        report.perEntry[name] = {
            firstPartyFiles: files.length,
            builtins: Object.keys(rec.builtins).sort(),
            packages: Object.keys(rec.packages).sort(),
        };
    }
    const core = Object.keys(ENTRIES).filter((k) => k !== 'CNCEngine').map((k) => ENTRIES[k]);
    const { rec, files } = await bundle(core);
    const toObj = (m) => Object.fromEntries(Object.entries(m).sort().map(([k, v]) => [k, [...v].sort()]));
    report.combined = {
        firstPartyFiles: files.sort(),
        builtins: toObj(rec.builtins),
        packages: toObj(rec.packages),
        assets: [...rec.assets].sort(),
        globals: scanGlobals(files),
        builtinMembers: scanBuiltinMembers(files, Object.keys(rec.builtins)),
    };
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('written', path.join(OUT, 'report.json'));
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
