#!/usr/bin/env node

/* eslint max-len: 0 */
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const _uniq = require("lodash/uniq");
const findImports = require("find-imports");
const { parseLatestReadmeNotes } = require('./readme_sync');

// Copy necessary properties from 'package.json' to 'src/app/package.json'
const pkg = require("../package.json");
const pkgApp = require("../src/app/package.json");

const files = [
  "src/app/*.{js,jsx,ts,tsx}",
  "src/app/src/**/*.{js,jsx,ts,tsx}",
  "src/server/**/*.{js,jsx,ts,tsx}",
  "src/main.js",
];

const resolvedImports = findImports(files, {
  flatten: true,
});

const deps = _uniq([
  "core-js",
  "@serialport/parser-readline",
  "@sienci/avrgirl-arduino",
  "@sentry/electron",
  "electron-updater",
  "@sentry/react",
  "@sentry/node",
  "regenerator-runtime",
  "debug",
  "is-electron",
  "commander",
  ...resolvedImports.map((x) => x.split("/")[0]),
]).sort();

//pkgApp.name = pkg.name; // Exclude the name field
pkgApp.version = pkg.version;
pkgApp.homepage = pkg.homepage;
pkgApp.author = pkg.author;
pkgApp.license = pkg.license;
pkgApp.repository = pkg.repository;

// Copy only Node.js dependencies to application package.json
pkgApp.dependencies = _.pick(pkg.dependencies, deps);

const target = path.resolve(__dirname, "../src/app/package.json");
const secondTarget = path.resolve(__dirname, "../src/package.json");

const content = JSON.stringify(pkgApp, null, 2);
delete pkgApp.type;
const secondContent = JSON.stringify(pkgApp, null, 2);

fs.writeFileSync(target, content + "\n", "utf8");
fs.writeFileSync(secondTarget, secondContent + "\n", "utf8");

// Update readme notes
const readme = fs.readFileSync('README.md', 'utf8');
const notes = parseLatestReadmeNotes(readme);
fs.writeFileSync('./src/server/api/notes.json', JSON.stringify(notes, null, 2));
