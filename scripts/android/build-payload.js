#!/usr/bin/env node
/*
 * Builds the JavaScript payload of the Android pendant app: the pendant UI and
 * a single-file server bundle that the app's bundled Node runtime runs.
 *
 *   node scripts/android/build-payload.js [--skip-pendant]
 *   (yarn android:payload)
 *
 * Output (android/app/build.gradle.kts packages dist/android/assets):
 *   dist/android/assets/payload/
 *     server/server.js        stock server (src/server-cli.js) + all npm deps,
 *                             with Electron/native modules aliased to
 *                             src/android/stubs.js
 *     server/public/          files deps read relative to __dirname
 *     server/pendant/         pendant UI (vite build of src/pendant)
 *     app/index.html          placeholder; the prod vite-server scans ../app
 *     payload.json            version + commit, shown on the app's error screen
 *   dist/android/meta.json    esbuild metafile (inspect bundle contents)
 *   dist/android/server.js.map  source map for symbolicating device stack traces
 *
 * Layout mirrors dist/gsender so the server's own path logic works unchanged.
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist/android');
const PAYLOAD = path.join(OUT, 'assets/payload');
const SERVER = path.join(PAYLOAD, 'server');
const STUBS = path.join(SRC, 'android/stubs.js');
const esbuild = require(path.join(ROOT, 'node_modules/esbuild'));

// Module name → export of src/android/stubs.js
const STUBBED = {
    electron: 'electron',
    'electron-log': 'electronLog',
    serialport: 'serialport',
    usb: 'usb',
    '@sienci/avrgirl-arduino': 'avrgirl',
    vite: 'vite',
};

// Files that deps read relative to their own __dirname at load time. Once
// bundled, __dirname is server/, so they're mirrored there.
// [source relative to repo, destination relative to server/]
const RUNTIME_ASSETS = [['node_modules/errorhandler/public', 'public']];

// consolidate require()s ~50 template engines lazily, inside each render
// function. The server never renders with them, so they stay out of the bundle.
// These are its top-level requires, which must be bundled.
const CONSOLIDATE_EAGER = new Set(['bluebird', 'fs', 'path']);

// Allowed to stay unresolved: optional native accelerators `ws` loads inside a
// try/catch. Anything else unresolved fails the build: a dependency left
// external would only fail at runtime on the device.
const OPTIONAL_UNRESOLVED = new Set(['bufferutil', 'utf-8-validate']);

const pkgName = (p) => p.split('/').slice(0, p.startsWith('@') ? 2 : 1).join('/');

function resolveFromSrc(p) {
    const base = path.resolve(SRC, p);
    for (const c of [base, `${base}.js`, `${base}.ts`, path.join(base, 'index.js'), path.join(base, 'index.ts')]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return base;
}

function androidPlugin(unresolved) {
    return {
        name: 'gsender-android',
        setup(build) {
            build.onResolve({ filter: /^server-cli-entry$/ }, () => ({ path: path.join(SRC, 'server-cli.js') }));
            build.onResolve({ filter: /^(server|app|electron-app)\// }, (a) => ({ path: resolveFromSrc(a.path) }));

            const names = Object.keys(STUBBED).map((n) => n.replace(/[/@.-]/g, '\\$&')).join('|');
            build.onResolve({ filter: new RegExp(`^(${names})(/.*)?$`) }, (a) => ({
                path: a.path,
                namespace: 'android-stub',
                pluginData: STUBBED[pkgName(a.path)],
            }));
            build.onLoad({ filter: /.*/, namespace: 'android-stub' }, (a) => ({
                contents: `module.exports = require(${JSON.stringify(STUBS)})[${JSON.stringify(a.pluginData)}];`,
                resolveDir: path.dirname(STUBS),
                loader: 'js',
            }));

            // Firmware images: flashing isn't supported on Android yet.
            build.onResolve({ filter: /^!file-loader!/ }, (a) => ({ path: a.path, namespace: 'android-empty' }));
            build.onLoad({ filter: /.*/, namespace: 'android-empty' }, () => ({ contents: 'module.exports = "";', loader: 'js' }));

            // Any other native addon: fail at call time, not load time.
            build.onLoad({ filter: /\.node$/ }, () => ({ contents: 'module.exports = {};', loader: 'js' }));

            // Resolve packages the way the stock CJS server loads them at
            // runtime, via require() conditions (socket.io's ESM wrapper has no
            // default export).
            build.onResolve({ filter: /^[^./]/ }, async (a) => {
                if (a.pluginData === 'android-probe' || /^[A-Za-z]:[\\/]/.test(a.path)) return undefined;
                if (/[\\/]consolidate[\\/]/.test(a.importer) && !CONSOLIDATE_EAGER.has(a.path)) {
                    return { path: a.path, external: true };
                }
                const r = await build.resolve(a.path, {
                    kind: 'require-call',
                    importer: a.importer,
                    resolveDir: a.resolveDir,
                    pluginData: 'android-probe',
                });
                if (r.errors.length === 0) return { path: r.path, external: r.external, sideEffects: r.sideEffects };
                const name = pkgName(a.path);
                if (!unresolved.has(name)) unresolved.set(name, path.relative(ROOT, a.importer));
                return { path: a.path, external: true };
            });
        },
    };
}

async function buildServer(version) {
    const unresolved = new Map();
    const result = await esbuild.build({
        entryPoints: { server: path.join(SRC, 'android/server-entry.js') },
        bundle: true,
        platform: 'node',
        target: 'node22',
        format: 'cjs',
        outdir: SERVER,
        // External: written next to the bundle without a sourceMappingURL
        // comment, then moved out of the payload (it doesn't ship in the APK).
        sourcemap: 'external',
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
            'global.BUILD_VERSION': JSON.stringify(version),
            'global.METRICS_ENDPOINT': '""',
        },
        logLevel: 'warning',
        plugins: [androidPlugin(unresolved)],
    });
    const unexpected = [...unresolved].filter(([name]) => !OPTIONAL_UNRESOLVED.has(name));
    if (unexpected.length) {
        for (const [name, importer] of unexpected) console.error(`  unresolved: ${name}  <- ${importer}`);
        throw new Error(`${unexpected.length} required package(s) could not be resolved; is node_modules complete?`);
    }
    fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(result.metafile));
    fs.renameSync(path.join(SERVER, 'server.js.map'), path.join(OUT, 'server.js.map'));
    for (const [from, to] of RUNTIME_ASSETS) {
        fs.cpSync(path.join(ROOT, from), path.join(SERVER, to), { recursive: true });
    }
}

function buildPendant() {
    const vite = path.join(ROOT, 'node_modules/vite/bin/vite.js');
    execFileSync(
        process.execPath,
        [vite, 'build', '--config', 'src/pendant/vite.config.ts', '--outDir', path.join(SERVER, 'pendant'), '--emptyOutDir', '--logLevel', 'warn'],
        { cwd: ROOT, stdio: 'inherit' },
    );
}

function gitCommit() {
    try {
        return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim();
    } catch {
        return 'unknown';
    }
}

function dirStats(dir) {
    let files = 0;
    let bytes = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
        if (e.isFile()) {
            files++;
            bytes += fs.statSync(path.join(e.parentPath ?? e.path, e.name)).size;
        }
    }
    return { files, bytes };
}

(async () => {
    const skipPendant = process.argv.includes('--skip-pendant');
    const { version } = require(path.join(SRC, 'package.json'));
    const t0 = Date.now();

    const keepPendant = skipPendant && fs.existsSync(path.join(SERVER, 'pendant'));
    if (keepPendant) {
        fs.renameSync(path.join(SERVER, 'pendant'), path.join(OUT, 'pendant.keep'));
    }
    fs.rmSync(PAYLOAD, { recursive: true, force: true });
    fs.mkdirSync(SERVER, { recursive: true });
    if (keepPendant) fs.renameSync(path.join(OUT, 'pendant.keep'), path.join(SERVER, 'pendant'));

    await buildServer(version);
    if (!skipPendant) buildPendant();
    if (!fs.existsSync(path.join(SERVER, 'pendant/index.html'))) {
        throw new Error('pendant UI missing (run without --skip-pendant first)');
    }

    fs.mkdirSync(path.join(PAYLOAD, 'app'), { recursive: true });
    fs.writeFileSync(
        path.join(PAYLOAD, 'app/index.html'),
        '<!doctype html><meta charset="utf-8"><title>gSender Pendant</title><a href="/pendant/">gSender Pendant</a>\n',
    );
    fs.writeFileSync(
        path.join(PAYLOAD, 'payload.json'),
        `${JSON.stringify({ version, commit: gitCommit(), builtAt: new Date().toISOString() }, null, 2)}\n`,
    );

    const bundle = fs.statSync(path.join(SERVER, 'server.js')).size;
    const total = dirStats(PAYLOAD);
    console.log(
        `Android payload ${version}: server.js ${(bundle / 1048576).toFixed(2)} MB, ${total.files} files, ${(total.bytes / 1048576).toFixed(1)} MB total, ${Date.now() - t0} ms → ${path.relative(ROOT, PAYLOAD)}`,
    );
})().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
});
