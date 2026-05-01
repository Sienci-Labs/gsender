#!/usr/bin/env node
'use strict';
// Builds the gSender server as a Tauri sidecar binary for the current platform.
// Requires: rustc (for target-triple detection), pkg (npx pkg or local install).
// Run via: npm run build:server-sidecar

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Detect current Rust target triple (same triple Tauri uses for sidecar lookup)
let triple;
try {
    const out = execSync('rustc -vV', { encoding: 'utf8' });
    const m = out.match(/host: (\S+)/);
    if (!m) throw new Error('no host line in rustc -vV output');
    triple = m[1];
} catch (e) {
    console.error('Could not detect target triple via rustc:', e.message);
    console.error('Make sure Rust is installed: https://rustup.rs');
    process.exit(1);
}

const isWindows = triple.includes('windows');
const ext = isWindows ? '.exe' : '';
const outDir = path.join(root, 'apps', 'pendant', 'src-tauri', 'binaries');
const outPath = path.join(outDir, `gsender-server-${triple}${ext}`);

fs.mkdirSync(outDir, { recursive: true });

// Generate a flat file manifest so the sidecar can extract pendant files
// without needing fs.readdirSync (which doesn't work inside pkg snapshots).
const pendantDir = path.join(root, 'dist', 'gsender', 'pendant');
function listFiles(dir, base) {
    const result = [];
    for (const name of fs.readdirSync(dir)) {
        if (name.startsWith('_')) continue; // skip build-time helper files
        const full = path.join(dir, name);
        const rel = base ? `${base}/${name}` : name;
        if (fs.statSync(full).isDirectory()) {
            result.push(...listFiles(full, rel));
        } else {
            result.push(rel);
        }
    }
    return result;
}
const manifest = listFiles(pendantDir, '');
// Write as a JS module so pkg bundles it via static require() — more reliable than --assets
fs.writeFileSync(
    path.join(root, 'pendant-manifest.js'),
    `'use strict';\nmodule.exports = ${JSON.stringify(manifest)};\n`
);
console.log(`Pendant manifest: ${manifest.length} files`);

console.log(`Platform : ${triple}`);
console.log(`Output   : ${outPath}`);
console.log('Building sidecar binary (this may take a minute)...\n');

const result = spawnSync(
    'npx', [
        'pkg',
        'sidecar-main.js',
        '--target', 'node18',
        '--assets', 'dist/gsender/pendant/**/*',
        '--output', outPath,
    ],
    { stdio: 'inherit', cwd: root, shell: isWindows }
);

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
console.log(`\nDone. Sidecar binary: ${outPath}`);
