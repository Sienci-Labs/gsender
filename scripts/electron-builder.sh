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

# Extra args appended to the electron-builder invocation.
EXTRA_ARGS=()

# Determine whether we're building on the upstream repo. Publishing and code
# signing both target Sienci-Labs/gsender (publish repo is taken from
# package.json "repository") and require secrets that only exist there. On forks
# and local builds those operations fail (401 on publish; signing errors with no
# certificate), so they must be disabled. GitHub Actions sets GITHUB_REPOSITORY
# to "owner/repo"; it is unset locally, which correctly resolves to "not upstream".
PUBLISH_REPO=$(node -e "const u=(require('$__dirname/../package.json').repository||{}).url||'';const m=u.match(/github\.com[/:]+([^/]+\/[^/.]+)/i);process.stdout.write(m?m[1].toLowerCase():'')")
CURRENT_REPO=$(printf '%s' "$GITHUB_REPOSITORY" | tr '[:upper:]' '[:lower:]')
ON_UPSTREAM=false
if [ -n "$CURRENT_REPO" ] && [ "$CURRENT_REPO" = "$PUBLISH_REPO" ]; then
    ON_UPSTREAM=true
fi

# Publishing: electron-builder publishes implicitly on CI detection. Only allow
# it on the upstream repo; otherwise force --publish never.
if [ "$ON_UPSTREAM" != true ]; then
    echo "ℹ Not building on the upstream repo (${PUBLISH_REPO}) — skipping electron-builder publish (--publish never)"
    EXTRA_ARGS+=("--publish" "never")
fi

# macOS code signing: only sign when on the upstream repo AND a signing
# certificate is available (CSC_LINK / CSC_NAME). Otherwise disable signing
# entirely — setting mac.identity=null skips it (electron-builder would
# otherwise attempt to sign and fail with "not a file" when no cert is present).
# Notarization is gated separately in notarize.js on the APPLE_* credentials.
CSC_IDENTITY_AUTO_DISCOVERY_VALUE=false
if [ "$ON_UPSTREAM" = true ] && { [ -n "$CSC_LINK" ] || [ -n "$CSC_NAME" ]; }; then
    CSC_IDENTITY_AUTO_DISCOVERY_VALUE=true
else
    echo "ℹ No macOS signing certificate / not on upstream repo — disabling code signing (mac.identity=null)"
    EXTRA_ARGS+=("-c.mac.identity=null")
fi

# Windows-specific handling (building a Windows target, e.g. on a dev machine).
if [[ " $* " == *" --windows "* ]] || [[ " $* " == *" --win "* ]]; then
    # Skip Windows code signing unless DigiCert KeyLocker credentials are present.
    # These are only set on release (tag) builds in CI; locally / on PR builds they
    # are absent, in which case electron-builder would otherwise try to invoke
    # signtool.exe (via wine on non-Windows hosts) and fail. signExecutable=false
    # still applies the icon/version metadata, it only skips the signature.
    # See WindowsSigner.js for the credentials contract.
    if [ -z "$SM_KEYPAIR_ALIAS" ] || [ -z "$SM_CLIENT_CERT_FILE" ]; then
        echo "ℹ Windows signing credentials (SM_KEYPAIR_ALIAS / SM_CLIENT_CERT_FILE) not set — skipping code signing for this build"
        EXTRA_ARGS+=("-c.win.signExecutable=false")
    fi

    # Building an NSIS installer on a non-Windows host requires wine to generate
    # the uninstaller stub. Fail early with a clear message instead of a cryptic
    # "spawn wine ENOENT" deep inside electron-builder. Skip the check on native
    # Windows (Git Bash / MSYS), where wine is neither present nor needed.
    case "$(uname -s)" in
        MINGW* | MSYS* | CYGWIN*) ;; # native Windows host, no wine needed
        *)
            if ! command -v wine >/dev/null 2>&1; then
                echo "✗ Building a Windows installer on $(uname -s) requires 'wine' (used by electron-builder to generate the NSIS uninstaller)." >&2
                exit 1
            fi
            ;;
    esac
fi

cross-env USE_HARD_LINKS=false \
    CSC_IDENTITY_AUTO_DISCOVERY=$CSC_IDENTITY_AUTO_DISCOVERY_VALUE \
    yarn electron-builder -- "$@" "${EXTRA_ARGS[@]}"
