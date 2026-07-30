#!/bin/bash
mkdir -p output
rm -rf output/*
pushd src
cp -af package.json ../output/
cross-env NODE_ENV=development babel "electron-app/**/*.js" \
    --config-file ../babel.config.js \
    --out-dir ../output/electron-app
popd
mkdir -p output/app output/app-server
cp -af src/app/{favicon.ico,images,assets} output/app/ 2>/dev/null || true
