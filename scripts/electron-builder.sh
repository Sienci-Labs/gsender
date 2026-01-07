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

pushd "$__dirname/../dist/gsender"
echo "Cleaning up \"`pwd`/node_modules\""
rm -rf node_modules
echo "Installing packages..."
yarn install --production --ignore-engines
popd

echo "Rebuild native modules using electron ${electron_version}"
yarn electron-rebuild -- \
    --version=${electron_version:1} \
    --module-dir=dist/gsender \
    --which-module=serialport


# Check if building for macOS
if [[ "$*" == *"--macos"* ]] || [[ "$*" == *"--mac"* ]] || [[ "$*" == *"-m"* ]]; then
    echo "Building for macOS with code signing and notarization..."
    echo "Building for macOS with code signing and notarization..."
    # Export variables so they're available to child processes
    export CSC_LINK="${CSC_LINK}"
    export CSC_KEY_PASSWORD="${CSC_KEY_PASSWORD}"
    export APPLE_ID="${APPLE_ID}"
    export APPLE_APP_SPECIFIC_PASSWORD="${APPLE_APP_SPECIFIC_PASSWORD}"
    export APPLE_TEAM_ID="${APPLE_TEAM_ID}"
    export USE_HARD_LINKS=false
    yarn electron-builder -- "$@"
else
    cross-env USE_HARD_LINKS=false yarn electron-builder -- "$@"
fi
