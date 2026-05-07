'use strict';
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

if (process.platform !== 'darwin') {
    console.log('Not darwin — skipping .node signing');
    process.exit(0);
}

const cert64 = process.env.APPLE_CERTIFICATE;
const certPass = process.env.APPLE_CERTIFICATE_PASSWORD;
if (!cert64 || !certPass) {
    console.log('APPLE_CERTIFICATE / APPLE_CERTIFICATE_PASSWORD not set — skipping .node signing');
    process.exit(0);
}

const KEYCHAIN = 'gsender-signing.keychain';
const KC_PASS  = 'temp-signing-password';
const certFile = path.join(os.tmpdir(), 'apple-cert.p12');
const prebuildsDir = path.join(__dirname, '../apps/pendant/src-tauri/binaries/prebuilds');

function run(cmd) { execSync(cmd, { stdio: 'inherit', shell: true }); }

function findNodeFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory()
            ? findNodeFiles(path.join(dir, e.name))
            : e.name.endsWith('.node') ? [path.join(dir, e.name)] : []
    );
}

fs.writeFileSync(certFile, Buffer.from(cert64, 'base64'));
try {
    run(`security create-keychain -p "${KC_PASS}" ${KEYCHAIN}`);
    run(`security set-keychain-settings -lut 21600 ${KEYCHAIN}`);
    run(`security unlock-keychain -p "${KC_PASS}" ${KEYCHAIN}`);
    run(`security import "${certFile}" -k ${KEYCHAIN} -P "${certPass}" -A`);
    run(`security list-keychains -d user -s ${KEYCHAIN} $(security list-keychains -d user | tr -d '"')`);
    run(`security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${KC_PASS}" ${KEYCHAIN}`);

    const out = execSync(`security find-identity -v -p codesigning ${KEYCHAIN}`, { encoding: 'utf8' });
    const match = out.match(/"(Developer ID Application:[^"]+)"/);
    if (!match) throw new Error('No Developer ID Application certificate found in keychain:\n' + out);
    const identity = match[1];
    console.log('Signing identity:', identity);

    const files = findNodeFiles(prebuildsDir);
    if (files.length === 0) {
        console.log('No .node files found in', prebuildsDir, '— nothing to sign');
    }
    for (const f of files) {
        console.log('Signing:', f);
        run(`codesign --force --sign "${identity}" --timestamp --options runtime "${f}"`);
    }
    console.log('All .node files signed OK');
} finally {
    fs.rmSync(certFile, { force: true });
    try { run(`security delete-keychain ${KEYCHAIN}`); } catch (_) {}
}
