#!/bin/bash

__dirname="$(CDPATH= cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
electron_version=$(electron --version)

display_usage() {
    ./node_modules/.bin/electron-builder -- --help
}

if [ $# -le 1 ]; then
    display_usage
    exit 1
fi

if [[ ( $# == "--help") ||  $# == "-h" ]]; then
    display_usage
    exit 0
fi

# Pendant-specific dirs (kept separate from desktop to avoid hash/install collisions)
DIST_DIR="$__dirname/../dist/gsender-pendant"
NODE_MODULES_DIR="$DIST_DIR/node_modules"
PACKAGE_JSON="$DIST_DIR/package.json"
ROOT_PACKAGE_LOCK="$__dirname/../package-lock.json"
MAIN_JS="$DIST_DIR/pendant-main.js"
DEPS_HASH_FILE="$DIST_DIR/.deps-hash"
CONFIG_FILE="$__dirname/../electron-builder.pendant.json"

compute_deps_hash() {
    node -e '
        const fs = require("fs");
        const crypto = require("crypto");
        const hash = crypto.createHash("sha256");
        const files = process.argv.slice(1);
        for (const file of files) {
            if (fs.existsSync(file)) {
                hash.update(file);
                hash.update(fs.readFileSync(file));
            }
        }
        process.stdout.write(hash.digest("hex"));
    ' "$@"
}

if [ ! -f "$MAIN_JS" ]; then
    echo "pendant-main.js missing; run npm run pendant:build first"
    exit 1
fi

pushd "$DIST_DIR"

NEEDS_INSTALL=false

if [ ! -d "$NODE_MODULES_DIR" ]; then
    echo "No pendant node_modules found, fresh install needed"
    NEEDS_INSTALL=true
elif [ "$PACKAGE_JSON" -nt "$NODE_MODULES_DIR" ]; then
    echo "pendant package.json is newer than node_modules, reinstall needed"
    NEEDS_INSTALL=true
fi

CURRENT_DEPS_HASH=$(compute_deps_hash "$PACKAGE_JSON" "$ROOT_PACKAGE_LOCK")
PREVIOUS_DEPS_HASH=""
if [ -f "$DEPS_HASH_FILE" ]; then
    PREVIOUS_DEPS_HASH=$(cat "$DEPS_HASH_FILE")
fi

if [ "$CURRENT_DEPS_HASH" != "$PREVIOUS_DEPS_HASH" ]; then
    echo "Pendant dependency hash changed, reinstall needed"
    NEEDS_INSTALL=true
fi

if [ "$NEEDS_INSTALL" = true ]; then
    echo "Installing pendant packages..."
    npm install --production --legacy-peer-deps
    printf '%s' "$CURRENT_DEPS_HASH" > "$DEPS_HASH_FILE"
else
    echo "✓ Pendant dependencies already installed, skipping..."
fi

popd

REBUILD_MARKER="$DIST_DIR/.rebuild-${electron_version}"

if [ ! -f "$REBUILD_MARKER" ]; then
    echo "Rebuilding pendant native modules for electron ${electron_version}"
    ./node_modules/.bin/electron-rebuild \
        --version=${electron_version:1} \
        --module-dir=dist/gsender-pendant \
        --which-module=serialport

    touch "$REBUILD_MARKER"
else
    echo "✓ Pendant native modules already rebuilt for electron ${electron_version}, skipping..."
fi

echo "Building pendant with electron-builder..."
CSC_IDENTITY_AUTO_DISCOVERY_VALUE=false
if [ -n "$CSC_LINK" ] || [ -n "$CSC_NAME" ]; then
    CSC_IDENTITY_AUTO_DISCOVERY_VALUE=true
fi
./node_modules/.bin/cross-env USE_HARD_LINKS=false \
    CSC_IDENTITY_AUTO_DISCOVERY=$CSC_IDENTITY_AUTO_DISCOVERY_VALUE \
    ./node_modules/.bin/electron-builder --config "$CONFIG_FILE" -- "$@"
