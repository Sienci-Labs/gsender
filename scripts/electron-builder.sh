#!/bin/bash

__dirname="$(CDPATH= cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
electron_version=$(electron --version)

display_usage() {
    yarn electron-builder -- --help
}

if [ $# -le 1 ]; then
    display_usage
    exit 1
fi

if [[ ( $# == "--help") ||  $# == "-h" ]]; then
    display_usage
    exit 0
fi

# Performance optimizations
DIST_DIR="$__dirname/../dist/gsender"
NODE_MODULES_DIR="$DIST_DIR/node_modules"
PACKAGE_JSON="$DIST_DIR/package.json"
YARN_LOCK="$DIST_DIR/yarn.lock"
ROOT_YARN_LOCK="$__dirname/../yarn.lock"
MAIN_JS="$DIST_DIR/main.js"
DEPS_HASH_FILE="$DIST_DIR/.deps-hash"

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
    echo "main.js missing; building electron main bundle"
    node "$__dirname/../esbuild.config.js" --production --target=electron
fi

pushd "$DIST_DIR"

# Skip install if dependencies haven't changed (for faster rebuilds)
NEEDS_INSTALL=false

if [ ! -d "$NODE_MODULES_DIR" ]; then
    echo "No node_modules found, fresh install needed"
    NEEDS_INSTALL=true
elif [ ! -f "$YARN_LOCK" ]; then
    echo "No yarn.lock found, reinstall needed"
    NEEDS_INSTALL=true
elif [ "$PACKAGE_JSON" -nt "$NODE_MODULES_DIR" ]; then
    echo "package.json is newer than node_modules, reinstall needed"
    NEEDS_INSTALL=true
fi

CURRENT_DEPS_HASH=$(compute_deps_hash "$PACKAGE_JSON" "$ROOT_YARN_LOCK")
PREVIOUS_DEPS_HASH=""
if [ -f "$DEPS_HASH_FILE" ]; then
    PREVIOUS_DEPS_HASH=$(cat "$DEPS_HASH_FILE")
fi

if [ "$CURRENT_DEPS_HASH" != "$PREVIOUS_DEPS_HASH" ]; then
    echo "Dependency hash changed, reinstall needed"
    NEEDS_INSTALL=true
fi

if [ "$NEEDS_INSTALL" = true ]; then
    echo "Installing packages..."
    # Copy root yarn.lock so electron-builder's module collector can find it
    # and so --frozen-lockfile has a reference to work from
    cp "$__dirname/../yarn.lock" "$YARN_LOCK" 2>/dev/null || true
    # Use frozen lockfile for faster, deterministic installs
    yarn install --production --frozen-lockfile --prefer-offline --ignore-engines 2>/dev/null || \
    yarn install --production --ignore-engines
    printf '%s' "$CURRENT_DEPS_HASH" > "$DEPS_HASH_FILE"
else
    echo "✓ Dependencies already installed, skipping..."
fi

popd

# Check if electron-rebuild is needed
REBUILD_MARKER="$DIST_DIR/.rebuild-${electron_version}"

if [ ! -f "$REBUILD_MARKER" ]; then
    echo "Rebuilding native modules for electron ${electron_version}"
    yarn electron-rebuild -- \
        --version=${electron_version:1} \
        --module-dir=dist/gsender \
        --which-module=serialport
    
    # Mark that rebuild is done for this electron version
    touch "$REBUILD_MARKER"
else
    echo "✓ Native modules already rebuilt for electron ${electron_version}, skipping..."
fi

# Run electron-builder with optimizations
echo "Building with electron-builder..."
CSC_IDENTITY_AUTO_DISCOVERY_VALUE=false
if [ -n "$CSC_LINK" ] || [ -n "$CSC_NAME" ]; then
    CSC_IDENTITY_AUTO_DISCOVERY_VALUE=true
fi
cross-env USE_HARD_LINKS=false \
    CSC_IDENTITY_AUTO_DISCOVERY=$CSC_IDENTITY_AUTO_DISCOVERY_VALUE \
    yarn electron-builder -- "$@"
