#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Installs only what the CI packaging jobs need to run electron-builder against
 * an already-built dist/gsender (downloaded from the build-web job), instead of
 * a full root `yarn install`.
 *
 * Versions come from the ranges declared in the root package.json, the same
 * way the previous full `yarn install` resolved them (the repo deliberately
 * has no committed lockfile).
 *
 * The tools are installed into a scratch directory and its node_modules is then
 * moved to <root>/node_modules, so `yarn electron-builder`, `yarn github-release`,
 * notarize.js's require('@electron/notarize') and electron-builder's
 * extraResources (./node_modules/@electron/remote) all resolve normally.
 *
 * Usage: node scripts/ci/install-packaging-tools.js [rootDir]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));

const TOOLS = [
    'electron-builder', // packaging
    'electron', // version detection only (binary download skipped)
    'cross-env', // used by scripts/electron-builder.sh
    '@electron/notarize', // notarize.js (afterSign)
    '@electron/remote', // copied by build.extraResources
    'github-release-cli', // master-latest release upload
];

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const dependencies = {};
for (const name of TOOLS) {
    const range =
        (pkg.devDependencies || {})[name] || (pkg.dependencies || {})[name];
    if (!range) {
        throw new Error(`${name} is not declared in ${ROOT}/package.json`);
    }
    dependencies[name] = range;
}

const targetModules = path.join(ROOT, 'node_modules');
if (fs.existsSync(targetModules)) {
    console.log(`${targetModules} already exists (full install?), skipping`);
    process.exit(0);
}

const toolsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'packaging-tools-'));
fs.writeFileSync(
    path.join(toolsDir, 'package.json'),
    JSON.stringify({ name: 'packaging-tools', private: true, dependencies }, null, 2),
);
console.log('Installing packaging tools:', dependencies);
// --legacy-peer-deps: prerelease electron (e.g. 45.0.0-alpha.x) doesn't satisfy
// @electron/remote's `electron >= 13` peer range under npm's strict semver.
execSync('npm install --no-audit --no-fund --no-package-lock --legacy-peer-deps --loglevel=error', {
    cwd: toolsDir,
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_SKIP_BINARY_DOWNLOAD: '1' },
});

// rename can fail across volumes (tmp vs workspace, notably on Windows); fall
// back to a copy. .bin shims use relative paths, so they survive the move.
try {
    fs.renameSync(path.join(toolsDir, 'node_modules'), targetModules);
} catch {
    fs.cpSync(path.join(toolsDir, 'node_modules'), targetModules, {
        recursive: true,
        verbatimSymlinks: true,
    });
}
fs.rmSync(toolsDir, { recursive: true, force: true });
console.log(`✓ Packaging tools installed into ${targetModules}`);
