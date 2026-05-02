#!/usr/bin/env node

/* eslint max-len: 0 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { parseLatestReadmeNotes } = require('./readme_sync');

// Copy necessary properties from 'package.json' to 'src/app/package.json'
const pkg = require('../package.json');
const pkgApp = require('../src/app/package.json');

const RUNTIME_ENTRY_PATHS = [
    'src/main.js',
    'src/server-cli.js',
    'src/server',
    'src/electron-app',
    'src/app/src/entry-server.tsx',
    'src/app/src/AppServer.tsx',
    'src/app/src/sentry-config.ts',
];

const SCANNABLE_EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.cjs',
]);

const INTERNAL_PREFIXES = [
    'server/',
    'app/',
    'electron-app/',
];

const MANUAL_RUNTIME_DEPS = [
    '@electron/remote',
    '@sentry/electron',
    '@sentry/react',
    '@serialport/parser-byte-length',
    '@serialport/parser-readline',
    '@sienci/avrgirl-arduino',
    'electron-updater',
    'jsonfile',
    'react',
    'react-dom',
    'sirv',
];

const EXCLUDED_RUNTIME_DEPS = new Set([
    'electron',
    'electron-reloader',
    'vite',
]);

const IMPORT_PATTERNS = [
    /import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function collectSourceFiles(entryPath, acc) {
    const absolutePath = path.resolve(__dirname, '..', entryPath);
    if (!fs.existsSync(absolutePath)) {
        return;
    }

    const stat = fs.statSync(absolutePath);
    if (stat.isFile()) {
        if (SCANNABLE_EXTENSIONS.has(path.extname(absolutePath))) {
            acc.push(absolutePath);
        }
        return;
    }

    const queue = [absolutePath];
    while (queue.length > 0) {
        const currentDir = queue.pop();
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                queue.push(fullPath);
            } else if (SCANNABLE_EXTENSIONS.has(path.extname(entry.name))) {
                acc.push(fullPath);
            }
        }
    }
}

function normalizeModuleName(specifier) {
    if (!specifier) {
        return null;
    }
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) {
        return null;
    }
    if (INTERNAL_PREFIXES.some((prefix) => specifier.startsWith(prefix))) {
        return null;
    }

    if (specifier.startsWith('@')) {
        const parts = specifier.split('/');
        if (parts.length >= 2) {
            return `${parts[0]}/${parts[1]}`;
        }
    }
    return specifier.split('/')[0];
}

function extractModuleSpecifiers(source) {
    const sourceWithoutComments = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');

    const matches = new Set();
    for (const pattern of IMPORT_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(sourceWithoutComments)) !== null) {
            matches.add(match[1]);
        }
    }
    return Array.from(matches);
}

function getRuntimeDependencyNames() {
    const files = [];
    for (const entryPath of RUNTIME_ENTRY_PATHS) {
        collectSourceFiles(entryPath, files);
    }

    const builtinModules = new Set(
        Module.builtinModules.map((moduleName) => moduleName.replace(/^node:/, ''))
    );

    const runtimeDeps = new Set(MANUAL_RUNTIME_DEPS);
    const uniqueFiles = Array.from(new Set(files));
    for (const file of uniqueFiles) {
        const source = fs.readFileSync(file, 'utf8');
        const specifiers = extractModuleSpecifiers(source);
        for (const specifier of specifiers) {
            const moduleName = normalizeModuleName(specifier);
            if (!moduleName) {
                continue;
            }
            if (builtinModules.has(moduleName)) {
                continue;
            }
            if (EXCLUDED_RUNTIME_DEPS.has(moduleName)) {
                continue;
            }
            runtimeDeps.add(moduleName);
        }
    }

    return Array.from(runtimeDeps).sort();
}

function selectDependencies(dependencyNames, dependencySources) {
    const selected = {};
    const missing = [];
    for (const name of dependencyNames) {
        const version = dependencySources[name];
        if (!version) {
            missing.push(name);
            continue;
        }
        selected[name] = version;
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing runtime dependency versions in root package.json: ${missing.join(', ')}`
        );
    }

    return selected;
}

const runtimeDependencyNames = getRuntimeDependencyNames();
const dependencySources = pkg.dependencies || {};

//pkgApp.name = pkg.name; // Exclude the name field
pkgApp.version = pkg.version;
pkgApp.homepage = pkg.homepage;
pkgApp.author = pkg.author;
pkgApp.license = pkg.license;
pkgApp.repository = pkg.repository;

// Copy only Node.js dependencies to application package.json
pkgApp.dependencies = selectDependencies(runtimeDependencyNames, dependencySources);

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
