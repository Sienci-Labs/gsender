// Spike S1: bundle the stock gSender server into ONE self-contained file that
// plain Node can run on Android: all npm deps inlined, Electron and native
// modules aliased to stubs (stubs.js), no node_modules shipped alongside.
//
//   node docs/android/s1/build-server-bundle.js [--out DIR] [--pendant DIR]
//
// Output mirrors dist/gsender so the stock path logic works unchanged:
//   DIR/server/server.js(.map)  the bundle (__dirname = DIR/server)
//   DIR/server/public/          files deps read relative to __dirname
//   DIR/server/pendant/         pendant UI, if --pendant is given
//   DIR/app/index.html          placeholder; the prod vite-server scans ../app
//   DIR/meta.json               esbuild metafile (not needed at runtime)
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO, 'src');
const esbuild = require(path.join(REPO, 'node_modules/esbuild'));
const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : undefined;
};
const outDir = path.resolve(arg('--out') || path.join(__dirname, 'out'));
const serverDir = path.join(outDir, 'server');
const pendantSrc = arg('--pendant') && path.resolve(arg('--pendant'));
const stubs = path.join(__dirname, 'stubs.js');

// Module name → named export of stubs.js
const STUBBED = {
    electron: 'electron',
    serialport: 'serialport',
    usb: 'usb',
    '@sienci/avrgirl-arduino': 'avrgirl',
    'electron-log': 'electronLog',
    // Only imported by src/server/vite-server.js when NODE_ENV !== 'production'.
    vite: 'vite',
};

function resolveFromSrc(p) {
    const base = path.resolve(SRC, p);
    for (const c of [base, base + '.js', base + '.ts', path.join(base, 'index.js'), path.join(base, 'index.ts')]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return base;
}

// [source relative to repo, destination relative to serverDir]
const RUNTIME_ASSETS = [
    ['node_modules/errorhandler/public', 'public'],
];

const unresolved = new Set();
const lazy = new Set();

const plugin = {
    name: 's1-android',
    setup(build) {
        build.onResolve({ filter: /^server-cli-entry$/ }, () => ({ path: path.join(SRC, 'server-cli.js') }));
        build.onResolve({ filter: /^(server|app|electron-app)\// }, (a) => ({ path: resolveFromSrc(a.path) }));

        const names = Object.keys(STUBBED).map((n) => n.replace(/[/@.-]/g, '\\$&')).join('|');
        build.onResolve({ filter: new RegExp(`^(${names})(/.*)?$`) }, (a) => ({
            path: a.path,
            namespace: 's1-stub',
            pluginData: STUBBED[a.path.split('/').slice(0, a.path.startsWith('@') ? 2 : 1).join('/')],
        }));
        build.onLoad({ filter: /.*/, namespace: 's1-stub' }, (a) => ({
            contents: `module.exports = require(${JSON.stringify(stubs)})[${JSON.stringify(a.pluginData)}];`,
            resolveDir: __dirname,
            loader: 'js',
        }));

        // Firmware images: flashing is out of scope for S1.
        build.onResolve({ filter: /^!file-loader!/ }, (a) => ({ path: a.path, namespace: 's1-empty' }));
        build.onLoad({ filter: /.*/, namespace: 's1-empty' }, () => ({ contents: 'module.exports = "";', loader: 'js' }));

        // Any other native addon left in the graph: fail at call time, not load time.
        build.onLoad({ filter: /\.node$/ }, () => ({ contents: 'module.exports = {};', loader: 'js' }));

        // Resolve every package the way the stock CJS server bundle loads it at
        // runtime: via require() conditions (e.g. socket.io's ESM wrapper has no
        // default export). Optional deps that aren't installed (consolidate's
        // template engines) stay as runtime require()s that only throw if called.
        build.onResolve({ filter: /^[^./]/ }, async (a) => {
            if (a.pluginData === 's1-probe' || /^[A-Za-z]:[\\/]/.test(a.path)) return undefined;
            // consolidate lazily require()s ~40 optional template engines; the
            // server never renders with them, so keep them all out of the bundle.
            if (/[\\/]consolidate[\\/]/.test(a.importer)) {
                lazy.add(a.path);
                return { path: a.path, external: true };
            }
            const r = await build.resolve(a.path, { kind: 'require-call', importer: a.importer, resolveDir: a.resolveDir, pluginData: 's1-probe' });
            if (r.errors.length === 0) return { path: r.path, external: r.external, sideEffects: r.sideEffects };
            unresolved.add(a.path.split('/').slice(0, a.path.startsWith('@') ? 2 : 1).join('/'));
            return { path: a.path, external: true };
        });
    },
};

(async () => {
    const pkg = require(path.join(SRC, 'package.json'));
    const t0 = Date.now();
    const result = await esbuild.build({
        entryPoints: { server: path.join(__dirname, 'android-entry.js') },
        bundle: true,
        platform: 'node',
        target: 'node22',
        format: 'cjs',
        outdir: serverDir,
        sourcemap: true,
        minify: true,
        keepNames: true,
        metafile: true,
        legalComments: 'none',
        mainFields: ['module', 'main'],
        resolveExtensions: ['.ts', '.js', '.json'],
        loader: { '.txt': 'text', '.hex': 'text' },
        define: {
            'global.NODE_ENV': '"production"',
            'global.PUBLIC_PATH': '""',
            'global.BUILD_VERSION': JSON.stringify(pkg.version),
            'global.METRICS_ENDPOINT': '""',
        },
        logLevel: 'warning',
        plugins: [plugin],
    });
    // Packages that read files relative to their own __dirname at load time.
    // Once bundled, __dirname is serverDir, so mirror those files there.
    for (const [from, to] of RUNTIME_ASSETS) {
        fs.cpSync(path.join(REPO, from), path.join(serverDir, to), { recursive: true });
    }
    if (pendantSrc) {
        fs.rmSync(path.join(serverDir, 'pendant'), { recursive: true, force: true });
        fs.cpSync(pendantSrc, path.join(serverDir, 'pendant'), { recursive: true });
    }
    fs.mkdirSync(path.join(outDir, 'app'), { recursive: true });
    fs.writeFileSync(path.join(outDir, 'app', 'index.html'), '<!doctype html><title>gSender S1</title><a href="/pendant/">pendant</a>\n');
    fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(result.metafile));
    console.log(`S1_UNRESOLVED_OPTIONAL ${[...unresolved].sort().join(',') || '(none)'}`);
    console.log(`S1_CONSOLIDATE_LAZY ${lazy.size} engines left as runtime require()`);
    const bytes = fs.statSync(path.join(serverDir, 'server.js')).size;
    console.log(`S1_BUNDLE bytes=${bytes} mb=${(bytes / 1048576).toFixed(2)} inputs=${Object.keys(result.metafile.inputs).length} build_ms=${Date.now() - t0} pendant=${pendantSrc ? 'yes' : 'no'} out=${outDir}`);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
