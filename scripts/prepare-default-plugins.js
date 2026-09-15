const fs = require('fs');
const path = require('path');
const { run } = require('./lib/shell-utils');

const REPO_ROOT = path.resolve(__dirname, '..');
const PLUGINS_ROOT = path.join(REPO_ROOT, 'plugins');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'dist', 'gsender', 'plugins');
const PLUGIN_SDK_DIR = path.join(REPO_ROOT, 'packages', 'plugin-sdk');
const PLUGIN_SDK_ENTRY = path.join(PLUGIN_SDK_DIR, 'dist', 'index.js');
const SDK_OUTPUT_ROOT = path.join(REPO_ROOT, 'dist', 'gsender', 'plugin-sdk');
// The browser-facing SDK runtime, served by the app at /plugin-sdk (see settings.base.js)
const SDK_BROWSER_FILES = ['index.js', 'react.js', 'viewer.js'];

const DEFAULT_PLUGINS = (process.env.GSENDER_DEFAULT_PLUGINS || 'basic-cam')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

const runYarn = (packageDir, args) => {
    const relativeDir = path.relative(REPO_ROOT, packageDir);
    run('yarn', ['--cwd', relativeDir, ...args], REPO_ROOT);
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const isPluginSdkInstallStale = (packageDir) => {
    const installedPackageJsonPath = path.join(
        packageDir,
        'node_modules',
        '@sienci',
        'gsender-plugin-sdk',
        'package.json',
    );
    if (!fs.existsSync(installedPackageJsonPath)) {
        return false;
    }

    const sdkPackageJsonPath = path.join(PLUGIN_SDK_DIR, 'package.json');
    if (!fs.existsSync(sdkPackageJsonPath)) {
        return false;
    }

    const installedVersion = readJson(installedPackageJsonPath).version;
    const expectedVersion = readJson(sdkPackageJsonPath).version;
    return installedVersion !== expectedVersion;
};

const ensureDependenciesInstalled = (packageDir) => {
    const packageJsonPath = path.join(packageDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    const nodeModulesPath = path.join(packageDir, 'node_modules');
    if (
        !fs.existsSync(nodeModulesPath) ||
        isPluginSdkInstallStale(packageDir)
    ) {
        runYarn(packageDir, ['install', '--non-interactive']);
    }
};

const isPluginSdkDistComplete = () => {
    const packageJsonPath = path.join(PLUGIN_SDK_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return true;
    }

    const { exports: sdkExports } = readJson(packageJsonPath);
    if (!sdkExports) {
        return fs.existsSync(PLUGIN_SDK_ENTRY);
    }

    return Object.values(sdkExports).every((subpathExport) => {
        const importPath = subpathExport?.import;
        if (!importPath) {
            return true;
        }
        return fs.existsSync(path.join(PLUGIN_SDK_DIR, importPath));
    });
};

const ensurePluginSdkBuilt = () => {
    const packageJsonPath = path.join(PLUGIN_SDK_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    if (isPluginSdkDistComplete()) {
        return;
    }

    console.log('Building @sienci/gsender-plugin-sdk...');
    ensureDependenciesInstalled(PLUGIN_SDK_DIR);
    runYarn(PLUGIN_SDK_DIR, ['run', 'build']);
};

const ensureBuiltUi = (pluginDir) => {
    const packageJsonPath = path.join(pluginDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    const pkg = readJson(packageJsonPath);
    if (!pkg.scripts || !pkg.scripts.build) {
        return;
    }

    ensureDependenciesInstalled(pluginDir);
    runYarn(pluginDir, ['run', 'build']);
};

const copyPluginSdkDist = () => {
    fs.rmSync(SDK_OUTPUT_ROOT, { recursive: true, force: true });
    fs.mkdirSync(SDK_OUTPUT_ROOT, { recursive: true });
    SDK_BROWSER_FILES.forEach((file) => {
        const src = path.join(PLUGIN_SDK_DIR, 'dist', file);
        if (!fs.existsSync(src)) {
            throw new Error(`Plugin SDK build output missing: ${file}`);
        }
        fs.copyFileSync(src, path.join(SDK_OUTPUT_ROOT, file));
    });
};

const copyPlugin = (pluginName) => {
    const pluginDir = path.join(PLUGINS_ROOT, pluginName);
    if (!fs.existsSync(pluginDir)) {
        throw new Error(`Default plugin not found: ${pluginName}`);
    }

    const manifestPath = path.join(pluginDir, 'gsender-plugin.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(
            `Missing gsender-plugin.json for plugin: ${pluginName}`,
        );
    }

    ensureBuiltUi(pluginDir);

    const manifest = readJson(manifestPath);
    const entry = manifest?.ui?.entry;
    if (!entry) {
        throw new Error(
            `Missing ui.entry in manifest for plugin: ${pluginName}`,
        );
    }

    const entryPath = path.join(pluginDir, entry);
    if (!fs.existsSync(entryPath)) {
        throw new Error(
            `Built UI entry not found for plugin "${pluginName}": ${entry}`,
        );
    }

    const destDir = path.join(OUTPUT_ROOT, pluginName);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(manifestPath, path.join(destDir, 'gsender-plugin.json'));

    const uiDir = path.join(pluginDir, 'ui');
    if (!fs.existsSync(uiDir)) {
        throw new Error(`Missing ui directory for plugin: ${pluginName}`);
    }

    fs.cpSync(uiDir, path.join(destDir, 'ui'), { recursive: true });
};

const main = () => {
    // The SDK runtime ships even with no default plugins.
    // imported plugins resolve their SDK imports against /plugin-sdk too.
    ensurePluginSdkBuilt();
    copyPluginSdkDist();

    if (DEFAULT_PLUGINS.length === 0) {
        console.log('No default plugins configured. Skipping.');
        return;
    }

    fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
    fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

    DEFAULT_PLUGINS.forEach((pluginName) => {
        console.log(`Preparing default plugin: ${pluginName}`);
        copyPlugin(pluginName);
    });

    console.log(
        `Prepared ${DEFAULT_PLUGINS.length} default plugin(s) in ${OUTPUT_ROOT}`,
    );
};

main();
