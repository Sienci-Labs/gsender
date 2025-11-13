#!/bin/bash

# export APPLE_ID=
# export APPLE_APP_SPECIFIC_PASSWORD=
# export APPLE_TEAM_ID=
# export CSC_LINK=
# export CSC_KEY_PASSWORD=

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


cross-env USE_HARD_LINKS=false yarn electron-builder -- "$@"


# App developer ID certificate password
# 2tTqX2gNR45G3JWw


# Your app-specific password is:
# pakl-fsmj-zzvm-ufdc


# Team ID
# YDX7QDZTP4
