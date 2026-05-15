const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const pkg = require('./package.json');


function loadEnv(target) {
    const envFile = target === 'production'
        ? '.env.prod'
        : '.env.dev';

    dotenv.config({ path: path.resolve(__dirname, envFile) });
}

const srcResolverPlugin = {
    name: 'src-resolver',
    setup(build) {
        const resolveFromSrc = (importPath) => {
            const basePath = path.resolve(__dirname, 'src', importPath);

            if (fs.existsSync(basePath)) {
                return basePath;
            }

            if (fs.existsSync(basePath + '.js')) {
                return basePath + '.js';
            }

            if (fs.existsSync(basePath + '.ts')) {
                return basePath + '.ts';
            }

            if (fs.existsSync(path.join(basePath, 'index.js'))) {
                return path.join(basePath, 'index.js');
            }

            if (fs.existsSync(path.join(basePath, 'index.ts'))) {
                return path.join(basePath, 'index.ts');
            }

            return basePath;
        };

        // Resolve imports like 'server/...' from 'src/' directory
        build.onResolve({ filter: /^server\// }, (args) => {
            const resolved = resolveFromSrc(args.path);
            return { path: resolved };
        });

        build.onResolve({ filter: /^app\// }, (args) => {
            // app/ alias → apps/desktop/ (matches Vite alias in apps/desktop/vite.config.js)
            const relativePath = args.path.replace(/^app\//, '');
            const basePath = path.resolve(__dirname, 'apps/desktop', relativePath);
            const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
            for (const ext of ['.js', '.ts', '/index.js', '/index.ts']) {
                if (isFile(basePath + ext)) return { path: basePath + ext };
            }
            if (isFile(basePath)) return { path: basePath };
            return { path: basePath };
        });

        build.onResolve({ filter: /^electron-app\// }, (args) => {
            const resolved = resolveFromSrc(args.path);
            return { path: resolved };
        });
    },
};

function createHexFilePlugin(target) {
    const isDev = target === 'development';
    const baseOutDir = isDev ? 'output' : 'dist/gsender';

    return {
        name: 'hex-file-loader',
        setup(build) {
            build.onLoad({ filter: /\.js$/ }, async (args) => {
                const source = await fs.promises.readFile(args.path, 'utf8');

                if (!source.includes('!file-loader!')) {
                    return null;
                }

                const transformed = source.replace(
                    /(['"])!file-loader!([^'"]+\.hex)\1/g,
                    (match, quote, hexPath) => `${quote}${hexPath}${quote}`
                );

                return {
                    contents: transformed,
                    loader: 'js',
                };
            });

            build.onLoad({ filter: /\.hex$/ }, async (args) => {
                const contents = await fs.promises.readFile(args.path, 'utf8');

                const serverDir = path.join(__dirname, 'src/server');
                const relativePath = path.relative(serverDir, args.path);
                const outputPath = path.join(__dirname, baseOutDir, 'server', relativePath);

                // Ensure output directory exists
                await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.promises.writeFile(outputPath, contents);

                const relativeToOutput = path.relative(
                    path.join(__dirname, baseOutDir, 'server'),
                    outputPath
                );

                return {
                    contents: `module.exports = ${JSON.stringify('./' + relativeToOutput.replace(/\\/g, '/'))}`,
                    loader: 'js',
                };
            });
        },
    };
}

function copyStaticFiles(target) {
    const serverDirs = ['i18n', 'views'];
    const isDev = target === 'development';

    const baseDir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');

    const serverOutputDir = isDev
        ? path.join(__dirname, 'output/server')
        : path.join(__dirname, 'dist/gsender/server');

    for (const dir of serverDirs) {
        const srcDir = path.join(__dirname, 'src/server', dir);

        if (fs.existsSync(srcDir)) {
            // Copy to server directory
            const serverDestDir = path.join(serverOutputDir, dir);
            fs.promises.mkdir(serverDestDir, { recursive: true });
            copyDir(srcDir, serverDestDir);

            // Also copy to base directory (for __dirname resolution in bundled code)
            const baseDestDir = path.join(baseDir, dir);
            fs.promises.mkdir(baseDestDir, { recursive: true });
            copyDir(srcDir, baseDestDir);
        }
    }
}

async function copyDir(src, dest) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.promises.copyFile(srcPath, destPath);
        }
    }
}

function copyPreloadFile(target) {
    const isDev = target === 'development';
    const destDir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');
    const src = path.join(__dirname, 'src/electron-app/preload.js');
    const dest = path.join(destDir, 'preload.js');
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
}

function copyPendantPreloadFile(target) {
    const isDev = target === 'development';
    const destDir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender-pendant');
    const src = path.join(__dirname, 'src/electron-app/preload-pendant.js');
    const dest = path.join(destDir, 'preload-pendant.js');
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
}

function copyStaticFilesPendant() {
    const serverDirs = ['i18n', 'views'];
    const baseDir = path.join(__dirname, 'dist/gsender-pendant');
    const serverOutputDir = path.join(__dirname, 'dist/gsender-pendant/server');

    for (const dir of serverDirs) {
        const srcDir = path.join(__dirname, 'src/server', dir);
        if (fs.existsSync(srcDir)) {
            const serverDestDir = path.join(serverOutputDir, dir);
            fs.promises.mkdir(serverDestDir, { recursive: true });
            copyDir(srcDir, serverDestDir);

            const baseDestDir = path.join(baseDir, dir);
            fs.promises.mkdir(baseDestDir, { recursive: true });
            copyDir(srcDir, baseDestDir);
        }
    }
}

function prebuild(target) {
    const isDev = target === 'development';
    const baseDir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');

    // Clean
    fs.rmSync(isDev ? path.join(__dirname, 'output') : path.join(__dirname, 'dist'),
              { recursive: true, force: true });

    // Create output dirs
    fs.mkdirSync(baseDir, { recursive: true });

    // Copy package.json
    fs.copyFileSync(
        path.join(__dirname, 'src/package.json'),
        path.join(baseDir, 'package.json')
    );

    // Dev: copy app assets (favicon, images, assets)
    if (isDev) {
        fs.mkdirSync(path.join(baseDir, 'app'), { recursive: true });
        fs.mkdirSync(path.join(baseDir, 'app-server'), { recursive: true });
        for (const asset of ['favicon.ico', 'images', 'assets']) {
            const src = path.join(__dirname, 'apps/desktop', asset);
            if (fs.existsSync(src)) {
                fs.cpSync(src, path.join(baseDir, 'app', asset), { recursive: true });
            }
        }
    }

    // Prod: copy yarn.lock
    if (!isDev) {
        const yarnLockCandidates = [
            path.join(__dirname, 'src/yarn.lock'),
            path.join(__dirname, 'yarn.lock'),
        ];
        const targetYarnLock = yarnLockCandidates.find((candidate) => fs.existsSync(candidate));
        if (targetYarnLock) {
            fs.copyFileSync(targetYarnLock, path.join(baseDir, 'yarn.lock'));
        }
    }
}

function prebuildPendant() {
    // Production-only: pendant dev artifacts share the `output/` dir with desktop
    // (different filenames) and are covered by the desktop prebuild step.
    const baseDir = path.join(__dirname, 'dist/gsender-pendant');

    fs.rmSync(baseDir, { recursive: true, force: true });
    fs.mkdirSync(baseDir, { recursive: true });

    fs.copyFileSync(
        path.join(__dirname, 'src/pendant-package.json'),
        path.join(baseDir, 'package.json')
    );

    const yarnLockCandidates = [
        path.join(__dirname, 'src/yarn.lock'),
        path.join(__dirname, 'yarn.lock'),
    ];
    const targetYarnLock = yarnLockCandidates.find((candidate) => fs.existsSync(candidate));
    if (targetYarnLock) {
        fs.copyFileSync(targetYarnLock, path.join(baseDir, 'yarn.lock'));
    }
}

const payload = pkg.version;
const algorithm = 'sha1';
const buf = String(payload);
const hash = crypto.createHash(algorithm).update(buf).digest('hex');
const publicPath = '/' + hash.substr(0, 8) + '/';
const buildVersion = pkg.version;

// Sentry plugin for esbuild (optional - only in production)
function getSentryPlugin() {
    if (process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
        try {
            const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');
            return sentryEsbuildPlugin({
                authToken: process.env.SENTRY_AUTH_TOKEN,
                org: process.env.SENTRY_ORG,
                project: process.env.SENTRY_PROJECT,
            });
        } catch (error) {
            console.warn('⚠️  Sentry plugin not available, skipping source map upload');
            return null;
        }
    }
    return null;
}

// Shared configuration
const createConfig = (target, entry, outdir, additionalOptions = {}) => {
    const isProd = target === 'production';

    const plugins = additionalOptions.plugins || [];
    if (isProd) {
        const sentryPlugin = getSentryPlugin();
        if (sentryPlugin) {
            plugins.push(sentryPlugin);
        }
    }

    return {
        entryPoints: [entry],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outdir,
        sourcemap: isProd ? true : 'inline',
        minify: isProd && process.env.USE_TERSER_PLUGIN === 'true',
        define: {
            'global.NODE_ENV': JSON.stringify(target),
            'global.PUBLIC_PATH': JSON.stringify(publicPath),
            'global.BUILD_VERSION': JSON.stringify(buildVersion),
            'global.METRICS_ENDPOINT': JSON.stringify(process.env.METRICS_ENDPOINT || ''),
        },
        loader: {
            '.txt': 'copy',
        },
        logLevel: 'info',
        ...additionalOptions,
        plugins,
    };
};

// Build server
async function buildServer(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output/server')
        : path.join(__dirname, 'dist/gsender/server');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/server/index.js'),
        outdir,
        {
            packages: 'external', // Don't bundle any node_modules
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        copyStaticFiles(target);
        console.log('✅ Server build complete');
    } catch (error) {
        console.error('❌ Server build failed:', error);
        process.exit(1);
    }
}

// Build electron main process
async function buildElectron(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/main.js'),
        outdir,
        {
            packages: 'external', // Don't bundle any node_modules
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        copyPreloadFile(target);
        console.log('✅ Electron main build complete');
    } catch (error) {
        console.error('❌ Electron main build failed:', error);
        process.exit(1);
    }
}

// Build server-cli
async function buildServerCli(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/server-cli.js'),
        outdir,
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        console.log('✅ Server CLI build complete');
    } catch (error) {
        console.error('❌ Server CLI build failed:', error);
        process.exit(1);
    }
}

// Pendant: bundle pendant-main.js into output dir (shared with desktop in dev,
// separate dist/gsender-pendant in prod).
async function buildPendantElectron(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender-pendant');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/pendant-main.js'),
        outdir,
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        copyPendantPreloadFile(target);
        console.log('✅ Pendant electron main build complete');
    } catch (error) {
        console.error('❌ Pendant electron main build failed:', error);
        process.exit(1);
    }
}

// Pendant: bundle the gSender server into dist/gsender-pendant/server/ for
// the standalone pendant binary. Dev reuses the desktop output/server bundle.
async function buildPendantServer(target) {
    loadEnv(target);

    const outdir = path.join(__dirname, 'dist/gsender-pendant/server');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/server/index.js'),
        outdir,
        {
            packages: 'external',
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        copyStaticFilesPendant();
        console.log('✅ Pendant server build complete');
    } catch (error) {
        console.error('❌ Pendant server build failed:', error);
        process.exit(1);
    }
}

// Pendant: bundle server-cli.js (entrypoint that launchServer pulls in) into
// dist/gsender-pendant/. Mirrors buildServerCli but with a different outdir.
async function buildPendantServerCli(target) {
    loadEnv(target);

    const outdir = path.join(__dirname, 'dist/gsender-pendant');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/server-cli.js'),
        outdir,
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        console.log('✅ Pendant server CLI build complete');
    } catch (error) {
        console.error('❌ Pendant server CLI build failed:', error);
        process.exit(1);
    }
}

// Watch mode for development - watches all targets
async function watchAll() {
    loadEnv('development');

    console.log('🔥 Hot reload mode - watching all files...\n');

    const serverConfig = createConfig(
        'development',
        path.join(__dirname, 'src/server/index.js'),
        path.join(__dirname, 'output/server'),
        {
            packages: 'external',
            plugins: [srcResolverPlugin, createHexFilePlugin('development')],
        }
    );

    const electronConfig = createConfig(
        'development',
        path.join(__dirname, 'src/main.js'),
        path.join(__dirname, 'output'),
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin('development')],
        }
    );

    const cliConfig = createConfig(
        'development',
        path.join(__dirname, 'src/server-cli.js'),
        path.join(__dirname, 'output'),
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin('development')],
        }
    );

    const pendantElectronConfig = createConfig(
        'development',
        path.join(__dirname, 'src/pendant-main.js'),
        path.join(__dirname, 'output'),
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin('development')],
        }
    );

    copyStaticFiles('development');
    copyPreloadFile('development');
    copyPendantPreloadFile('development');

    const serverCtx = await esbuild.context(serverConfig);
    const electronCtx = await esbuild.context(electronConfig);
    const cliCtx = await esbuild.context(cliConfig);
    const pendantElectronCtx = await esbuild.context(pendantElectronConfig);

    await Promise.all([
        serverCtx.watch(),
        electronCtx.watch(),
        cliCtx.watch(),
        pendantElectronCtx.watch(),
    ]);

    console.log('👀 Watching:');
    console.log('   - Server files (output/server/index.js)');
    console.log('   - Electron main (output/main.js)');
    console.log('   - Pendant electron main (output/pendant-main.js)');
    console.log('   - Server CLI (output/server-cli.js)');
    console.log('\n✨ Hot reload enabled! Edit files and see changes instantly.\n');
}

async function watchServer() {
    await watchAll();
}

// Main build function
async function build() {
    const args = process.argv.slice(2);
    const target = args.includes('--production') ? 'production' : 'development';
    const watch = args.includes('--watch');
    const buildTarget = args.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'all';

    console.log(`🔨 Building for ${target}...`);

    if (args.includes('--prebuild-only')) {
        prebuild(target);
        console.log('Prebuild complete');
        return;
    }

    if (args.includes('--prebuild-pendant-only')) {
        prebuildPendant();
        console.log('Pendant prebuild complete');
        return;
    }

    if (watch && target === 'development') {
        await watchServer();
        return;
    }

    try {
        if (buildTarget === 'all' || buildTarget === 'server') {
            await buildServer(target);
        }
        if (buildTarget === 'all' || buildTarget === 'electron') {
            await buildElectron(target);
        }
        if (buildTarget === 'all' || buildTarget === 'server-cli') {
            await buildServerCli(target);
        }
        // In dev, also produce pendant main + preload in the shared output/ dir
        // so `npm run electron:dev`-style watchers and pendant:electron:dev share artifacts.
        if (buildTarget === 'all' && target === 'development') {
            await buildPendantElectron(target);
        }
        if (buildTarget === 'pendant') {
            await buildPendantServer(target);
            await buildPendantElectron(target);
            await buildPendantServerCli(target);
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

module.exports = {
    buildServer,
    buildElectron,
    buildServerCli,
    buildPendantServer,
    buildPendantElectron,
    buildPendantServerCli,
    watchAll,
    createConfig,
};

// Run if called directly
if (require.main === module) {
    build();
}
