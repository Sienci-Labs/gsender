#!/usr/bin/env node

/* eslint max-len: 0 */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const findImports = require('find-imports');

// Copy necessary properties from 'package.json' to 'src/package.json'
const pkg = require('../package.json');
const pkgApp = require('../src/package.json');

const files = ['src/*.js', 'src/server/**/*.{js,jsx}'];
const deps = [
    '@babel/runtime', // 'babel-runtime' is required for electron app
    'debug', // 'debug' is required for electron app
]
    .concat(findImports(files, { flatten: true }))
    .sort();

//pkgApp.name = pkg.name; // Exclude the name field
pkgApp.version = pkg.version;
pkgApp.homepage = pkg.homepage;
pkgApp.author = pkg.author;
pkgApp.license = pkg.license;
pkgApp.repository = pkg.repository;

// Copy only Node.js dependencies to application package.json
pkgApp.dependencies = _.pick(pkg.dependencies, deps);

const target = path.resolve(__dirname, '../src/package.json');
const content = JSON.stringify(pkgApp, null, 2);
fs.writeFileSync(target, content + '\n', 'utf8');

//Save app versions to releases.json
try {
    const releaseTarget = path.resolve(
        __dirname,
        '../src/app/containers/Preferences/About/releases.json'
    );

    const removeLines = (data, deleteTill) => {
        let tempArray = data.split('\n');
        let finalRelease = '';
        let count = 0;
        const index = tempArray.indexOf(deleteTill);
        tempArray.splice(0, index + 1);
        tempArray.forEach((element, index) => {
            if (element.includes('###')) {
                count++;
                if (count === 2) {
                    finalRelease = tempArray;
                    finalRelease.splice(index, tempArray.length);
                    return true;
                }
            }
            return false;
        });
        tempArray = finalRelease;
        return tempArray;
    };
    let readme = fs.readFileSync(path.resolve('README.md'), 'utf8');
    const releases = removeLines(readme, '## 🕣 Development History');
    fs.writeFileSync(releaseTarget, JSON.stringify(releases));
} catch (error) {
    console.log(error.message);
}
