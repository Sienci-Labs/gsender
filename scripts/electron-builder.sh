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
    echo "Checking environment variables:"
    echo "  CSC_LINK is set: ${CSC_LINK:+yes}"
    echo "  CSC_KEY_PASSWORD is set: ${CSC_KEY_PASSWORD:+yes}"
    echo "  APPLE_ID is set: ${APPLE_ID:+yes}"
    echo "  APPLE_APP_SPECIFIC_PASSWORD is set: ${APPLE_APP_SPECIFIC_PASSWORD:+yes}"
    echo "  APPLE_TEAM_ID is set: ${APPLE_TEAM_ID:+yes}"

    USE_HARD_LINKS=false yarn electron-builder -- "$@"
else
    USE_HARD_LINKS=false yarn electron-builder -- "$@"
fi
