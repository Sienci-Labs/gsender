#!/bin/bash

mkdir -p output
rm -rf output/*

pushd src
cp -af package.json ../output/

# Only compile electron-app files with Babel (main.js and server-cli.js are built by esbuild)
cross-env NODE_ENV=development babel "electron-app/**/*.js" \
    --config-file ../babel.config.js \
    --out-dir ../output/electron-app
popd
