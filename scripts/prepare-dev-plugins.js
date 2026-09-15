const fs = require('fs');
const path = require('path');
const { run, readJson, isStale } = require('./lib/shell-utils');

const REPO_ROOT = path.resolve(__dirname, '..');
const PLUGINS_ROOT = path.join(REPO_ROOT, 'plugins');
const PLUGIN_SDK_DIR = path.join(REPO_ROOT, 'packages', 'plugin-sdk');
const PLUGIN_SDK_ENTRY = path.join(PLUGIN_SDK_DIR, 'dist', 'index.js');
const PLUGIN_SDK_PACKAGE = '@sienci/gsender-plugin-sdk';

// Inputs that invalidate the SDK's dist/ and a plugin's ui/ respectively.
// Missing paths are ignored, so listing every vite config variant is safe.
const PLUGIN_SDK_SOURCES = ['src', 'package.json', 'tsup.config.ts'].map(
    (entry) => path.join(PLUGIN_SDK_DIR, entry),
);
const PLUGIN_SOURCES = [
    'src',
    'index.html',
    'package.json',
    'gsender-plugin.json',
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
];

const FORCE = process.env.GSENDER_FORCE_PLUGIN_BUILD === '1';
const STRICT = process.env.GSENDER_STRICT_DEV_PLUGINS === '1';

const detectPackageManager = (dir) =>
    fs.existsSync(path.join(dir, 'yarn.lock')) ? 'yarn' : 'npm';

const install = (dir) => {
    if (detectPackageManager(dir) === 'yarn') {
        run(
            'yarn',
            [
                '--cwd',
                path.relative(REPO_ROOT, dir),
                'install',
                '--non-interactive',
            ],
            REPO_ROOT,
        );
    } else {
        run('npm', ['install'], dir);
    }
};

const ensureDependenciesInstalled = (dir) => {
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
        return;
    }
    if (!FORCE && fs.existsSync(path.join(dir, 'node_modules'))) {
        return;
    }
    install(dir);
};

const ensurePluginSdkBuilt = () => {
    const packageJsonPath = path.join(PLUGIN_SDK_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    if (!FORCE && !isStale(PLUGIN_SDK_ENTRY, PLUGIN_SDK_SOURCES)) {
        console.log(
            'Plugin SDK is up to date, skipping (set GSENDER_FORCE_PLUGIN_BUILD=1 to force).',
        );
        return;
    }

    console.log('Building @sienci/gsender-plugin-sdk...');
    ensureDependenciesInstalled(PLUGIN_SDK_DIR);
    run(detectPackageManager(PLUGIN_SDK_DIR), ['run', 'build'], PLUGIN_SDK_DIR);
};

// npm links the SDK's `file:` dependency, so those plugins always see the build
// we just made. yarn (and npm in some setups) copies it instead, which freezes
// whatever dist/ existed at install time — the copy then stays on a stale
// bundle and the plugin fails to build against SDK exports added since.
// Re-running the package manager doesn't help: the SDK version is unchanged, so
// yarn just serves the same copy back out of its cache. Refresh it in place.
const refreshCopiedPluginSdk = (pluginDir, name) => {
    const installed = path.join(
        pluginDir,
        'node_modules',
        ...PLUGIN_SDK_PACKAGE.split('/'),
    );

    let stats;
    try {
        stats = fs.lstatSync(installed);
    } catch {
        return; // SDK isn't installed here
    }
    if (stats.isSymbolicLink()) {
        return; // live link — already sees the current build
    }

    if (
        !isStale(path.join(installed, 'dist', 'index.js'), [PLUGIN_SDK_ENTRY])
    ) {
        return;
    }

    console.log(`${name}: refreshing copied plugin SDK.`);
    fs.cpSync(path.join(PLUGIN_SDK_DIR, 'dist'), path.join(installed, 'dist'), {
        recursive: true,
    });
    fs.copyFileSync(
        path.join(PLUGIN_SDK_DIR, 'package.json'),
        path.join(installed, 'package.json'),
    );
};

const discoverPluginDirs = () => {
    if (!fs.existsSync(PLUGINS_ROOT)) {
        return [];
    }

    return fs
        .readdirSync(PLUGINS_ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) =>
            fs.existsSync(path.join(PLUGINS_ROOT, name, 'gsender-plugin.json')),
        );
};

const buildPlugin = (name) => {
    const pluginDir = path.join(PLUGINS_ROOT, name);
    const packageJsonPath = path.join(pluginDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    const pkg = readJson(packageJsonPath);
    if (!pkg.scripts || !pkg.scripts.build) {
        return;
    }

    ensureDependenciesInstalled(pluginDir);
    refreshCopiedPluginSdk(pluginDir, name);

    const manifest = readJson(path.join(pluginDir, 'gsender-plugin.json'));
    const entry = manifest?.ui?.entry;
    const entryPath = entry ? path.join(pluginDir, entry) : null;
    // The SDK's own output is an input here: a plugin that inlines the SDK
    // carries a copy of it, so a fresh SDK means a stale plugin bundle.
    const sources = [
        ...PLUGIN_SOURCES.map((source) => path.join(pluginDir, source)),
        PLUGIN_SDK_ENTRY,
    ];

    if (!FORCE && entryPath && !isStale(entryPath, sources)) {
        console.log(`${name}: up to date, skipping.`);
        return;
    }

    console.log(`Building plugin: ${name}`);
    run(detectPackageManager(pluginDir), ['run', 'build'], pluginDir);
};

const main = () => {
    ensurePluginSdkBuilt();

    const names = discoverPluginDirs();
    if (names.length === 0) {
        console.log('No plugins found under plugins/. Skipping.');
        return;
    }

    const failed = [];
    names.forEach((name) => {
        try {
            buildPlugin(name);
        } catch (err) {
            console.error(`Failed to build plugin "${name}": ${err.message}`);
            failed.push(name);
        }
    });

    if (failed.length > 0) {
        console.warn(
            `${failed.length} plugin(s) failed to build: ${failed.join(', ')}`,
        );
        if (STRICT) {
            process.exit(1);
        }
    }
};

main();
