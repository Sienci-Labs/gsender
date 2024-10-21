#!/usr/bin/env node

/* eslint max-len: 0 */
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const _uniq = require("lodash/uniq");
const findImports = require("find-imports");

// Copy necessary properties from 'package.json' to 'src/package.json'
const pkg = require("../package.json");
const pkgApp = require("../src/app/package.json");

const files = ["src/app/*.{js,ts,tsx,jsx}", "src/server/**/*.{js,jsx}"];

const resolvedImports = findImports(files, {
  flatten: true,
});

const deps = _uniq([
  "core-js",
  "@serialport/parser-readline",
  "@sienci/avrgirl-arduino",
  "@sentry/electron",
  "@sentry/react",
  "@sentry/node",
  "regenerator-runtime",
  "debug",
  ...resolvedImports.map((x) => x.split("/")[0]),
]).sort();

//pkgApp.name = pkg.name; // Exclude the name field
pkgApp.version = pkg.version;
pkgApp.homepage = pkg.homepage;
pkgApp.author =  pkg.author;
pkgApp.license = pkg.license;
pkgApp.repository = pkg.repository;

// Copy only Node.js dependencies to application package.json
pkgApp.dependencies = _.pick(pkg.dependencies, deps);

const target = path.resolve(__dirname, "../src/app/package.json");
const content = JSON.stringify(pkgApp, null, 2);
fs.writeFileSync(target, content + "\n", "utf8");

//Save app versions to releases.json
/*try {
  const releaseTarget = path.resolve(
    __dirname,
    "../src/app/containers/Preferences/About/releases.json",
  );

  const getLatestPatchNotes = (data, notesStart) => {
    const patchNotes = data.split(notesStart)[1];
    let headerCount = 0;

    return patchNotes
      .split("\n")
      .filter((line) => {
        if (line.includes("###")) {
          headerCount++;
        }
        if (line.length < 2) {
          return false;
        }
        return headerCount < 4;
      })
      .map((line) => line.trim());
  };
  let readme = fs.readFileSync(path.resolve("README.md"), "utf8");
  const releases = getLatestPatchNotes(readme, "## 🕣 Development History");
  fs.writeFileSync(releaseTarget, JSON.stringify(releases));
} catch (error) {
  console.log(error.message);
}
*/
