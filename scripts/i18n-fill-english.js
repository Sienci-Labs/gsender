#!/usr/bin/env node
/*
 * Fill blank ("") values in non-English locale files with the English source
 * text, so translators can see what each string says without cross-referencing
 * en/*.json. Runs automatically after `yarn i18n:extract`.
 *
 * Only blank values are touched; existing translations are never overwritten.
 * Plural forms English doesn't have (e.g. Russian _few/_many) take the
 * English _other text.
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src/app/src/i18n/locales');
const SOURCE = 'en';
const INDENT = 2;
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const englishFor = (enNode, key) => {
    if (!enNode || typeof enNode !== 'object') return undefined;
    if (typeof enNode[key] === 'string') return enNode[key];
    if (PLURAL_SUFFIX.test(key)) {
        const other = enNode[key.replace(PLURAL_SUFFIX, '_other')];
        if (typeof other === 'string') return other;
    }
    return undefined;
};

const fill = (node, enNode) => {
    let count = 0;
    for (const [key, value] of Object.entries(node)) {
        if (value && typeof value === 'object') {
            count += fill(value, enNode?.[key]);
        } else if (value === '') {
            const english = englishFor(enNode, key);
            if (english) {
                node[key] = english;
                count++;
            }
        }
    }
    return count;
};

const languages = fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== SOURCE)
    .map((d) => d.name);

let total = 0;
for (const file of fs.readdirSync(path.join(LOCALES_DIR, SOURCE))) {
    if (!file.endsWith('.json') || file.startsWith('_')) continue;
    const en = readJson(path.join(LOCALES_DIR, SOURCE, file));
    for (const lang of languages) {
        const target = path.join(LOCALES_DIR, lang, file);
        if (!fs.existsSync(target)) continue;
        const data = readJson(target);
        const filled = fill(data, en);
        if (filled > 0) {
            fs.writeFileSync(target, `${JSON.stringify(data, null, INDENT)}\n`);
            console.log(`${lang}/${file}: filled ${filled} with English`);
            total += filled;
        }
    }
}
console.log(`i18n-fill-english: ${total} value(s) filled`);
