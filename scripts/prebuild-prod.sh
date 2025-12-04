#!/bin/bash

mkdir -p dist
rm -rf dist/*

pushd src
mkdir -p ../dist/gsender/
cp -af package.json ../dist/gsender/

# Only compile electron-app files with Babel (main.js and server-cli.js are built by esbuild)
cross-env NODE_ENV=production babel "electron-app/**/*.js" \
    --config-file ../babel.config.js \
    --out-dir ../dist/gsender/electron-app
popd
