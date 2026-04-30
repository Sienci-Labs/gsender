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
