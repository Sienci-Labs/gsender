#!/usr/bin/env node

/* eslint max-len: 0 */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const _uniq = require('lodash/uniq');
const findImports = require('find-imports');
const { parseLatestReadmeNotes } = require('./readme_sync');

// Copy necessary properties from 'package.json' to 'src/app/package.json'
const pkg = require('../package.json');
const pkgApp = require('../src/app/package.json');

const files = [
    'src/app/*.{js,jsx}',
    'src/app/src/**/*.{js,jsx}',
    'src/server/**/*.{js,jsx}',
    'src/main.js',
];

// Only scan JavaScript files to avoid parser errors with TypeScript
// TypeScript files will be transpiled and their dependencies are
// either covered by JS files or explicitly listed below

// Suppress stderr during import scanning to hide parser warnings
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => {
    if (typeof chunk === 'string' && chunk.includes('Unexpected reserved word')) {
        return true;
    }
    return originalStderrWrite(chunk, encoding, callback);
};

const resolvedImports = findImports(files, {
    flatten: true,
});

// Restore stderr
process.stderr.write = originalStderrWrite;

const deps = _uniq([
    'core-js',
    '@serialport/parser-readline',
    '@sienci/avrgirl-arduino',
    '@sentry/electron',
    'electron-updater',
    '@sentry/react',
    '@sentry/node',
    'regenerator-runtime',
    'debug',
    'is-electron',
    'commander',
    ...resolvedImports.map((x) => x.split('/')[0]),
]).sort();

//pkgApp.name = pkg.name; // Exclude the name field
pkgApp.version = pkg.version;
pkgApp.homepage = pkg.homepage;
pkgApp.author = pkg.author;
pkgApp.license = pkg.license;
pkgApp.repository = pkg.repository;

// Copy only Node.js dependencies to application package.json
pkgApp.dependencies = _.pick(pkg.dependencies, deps);

const target = path.resolve(__dirname, '../src/app/package.json');
const secondTarget = path.resolve(__dirname, '../src/package.json');

const content = JSON.stringify(pkgApp, null, 2);
delete pkgApp.type;
const secondContent = JSON.stringify(pkgApp, null, 2);

fs.writeFileSync(target, content + '\n', 'utf8');
fs.writeFileSync(secondTarget, secondContent + '\n', 'utf8');

// Update readme notes
const readme = fs.readFileSync('README.md', 'utf8');
const notes = parseLatestReadmeNotes(readme);
fs.writeFileSync('./src/server/api/notes.json', JSON.stringify(notes, null, 2));
