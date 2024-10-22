#!/usr/bin/env node

/* eslint max-len: 0 */
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const _uniq = require("lodash/uniq");
const findImports = require("find-imports");

// Copy necessary properties from 'package.json' to 'src/app/package.json'
const pkg = require("../package.json");
const pkgApp = require("../src/app/package.json");
const { urPK } = require("@mui/material/locale");

const files = [
  "src/app/*.{js,jsx,ts,tsx}",
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
