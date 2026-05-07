#!/usr/bin/env node
'use strict';

// pkg native module fix -------------------------------------------------------
// pkg's snapshot virtual filesystem does NOT support fs.readdirSync, so
// node-gyp-build can't scan the prebuilds/ directory to find .node files.
// Intercept the module and load each .node file directly — pkg DOES support
// require() on snapshot .node paths (it extracts them to a temp dir).
// If the .node file cannot be loaded (e.g. in a production app bundle where
// the snapshot fallback path is unavailable), a graceful stub is returned so
// the server still starts — serial port connections will fail with a clear
// error rather than crashing the entire process.
if (process.pkg) {
    const Module = require('module');
    const path = require('path');
    const fs = require('fs');
    const origLoad = Module._load;

    function createSerialStub() {
        const unavailable = () => new Error('Serial port support unavailable in this build (native binding missing)');
        return {
            open:        (_p, _o, cb) => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            close:       (_fd, cb)    => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            read:        (_fd, _b, _off, _len, _pos, cb) => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            write:       (_fd, _b, cb) => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            drain:       (_fd, cb)    => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            flush:       (_fd, cb)    => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            set:         (_fd, _o, cb) => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            get:         (_fd, cb)    => cb ? cb(null, {}) : Promise.resolve({}),
            getBaudRate: (_fd, cb)    => cb ? cb(unavailable()) : Promise.reject(unavailable()),
            list:        (cb)         => cb ? cb(null, []) : Promise.resolve([]),
        };
    }

    Module._load = function (request, parent, isMain) {
        if (request === 'node-gyp-build') {
            return function nodeGypBuildShim(dir) {
                const plt = process.platform;          // darwin | linux | win32
                const arc = process.arch;              // arm64 | x64
                // Darwin ships a universal fat binary; other platforms are arch-specific
                const subdir = plt === 'darwin'
                    ? `${plt}-x64+arm64`
                    : `${plt}-${arc}`;
                const prebuildsDir = path.join(dir, 'prebuilds', subdir);

                // Derive .node filename from package.json name (e.g. @serialport/bindings-cpp → @serialport+bindings-cpp.node)
                try {
                    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
                    const stem = pkg.name.replace(/\//g, '+');   // @scope/pkg → @scope+pkg
                    return require(path.join(prebuildsDir, stem + '.node'));
                } catch (_) {}

                // Fallback: try all common naming patterns
                for (const name of ['node.napi.node', 'binding.node', 'bindings.node']) {
                    try { return require(path.join(prebuildsDir, name)); } catch (_) {}
                }

                // Try real-filesystem prebuilds shipped alongside the binary
                // (path passed via GSENDER_SERIALPORT_PREBUILDS env var from Tauri lib.rs)
                if (process.env.GSENDER_SERIALPORT_PREBUILDS) {
                    const externalDir = path.join(process.env.GSENDER_SERIALPORT_PREBUILDS, subdir);
                    try {
                        const pkgMeta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
                        const externalStem = pkgMeta.name.replace(/\//g, '+');
                        return require(path.join(externalDir, externalStem + '.node'));
                    } catch (_) {}
                    for (const name of ['node.napi.node', 'binding.node', 'bindings.node']) {
                        try { return require(path.join(externalDir, name)); } catch (_) {}
                    }
                }

                // Could not load — return a stub so the server starts without serial support
                process.stderr.write('[sidecar] WARNING: serialport native binding unavailable — CNC serial connections will fail\n');
                return createSerialStub();
            };
        }
        return origLoad.apply(this, arguments);
    };
}
// -----------------------------------------------------------------------------

// Static requires so pkg includes these dynamically-resolved modules in the bundle
require('axios/dist/node/axios.cjs');

process.env.GSENDER_SIDECAR = '1';
process.env.NODE_ENV = 'production';

// When running as a pkg binary the pendant SPA is NOT served from the snapshot
// (pkg's fs.createReadStream doesn't work for snapshot assets).
// Instead, build-sidecar.js copies dist/gsender/pendant/ next to the binary as
// a real directory that express.static can serve normally.
if (process.pkg) {
    const path = require('path');
    const fs = require('fs');
    // Look for a 'pendant' folder placed next to the binary by build-sidecar.js
    const pendantPath = path.join(path.dirname(process.execPath), 'pendant');
    if (fs.existsSync(path.join(pendantPath, 'index.html'))) {
        process.env.GSENDER_PENDANT_PATH = pendantPath;
    }
}
const launchServer = require('./dist/gsender/server-cli');
launchServer().catch(function (e) {
    process.stderr.write('gSender server error: ' + e.message + '\n');
    process.exit(1);
});
