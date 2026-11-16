#!/usr/bin/env node
/*
 * Duplicate masking from the command line: compares a capture with an
 * earlier one and writes a capture holding only what differs, ready to
 * import. (The Figma plugin can do the same at import time.)
 *
 *   yarn figma:diff <baseline.figma-layout.json> <capture.figma-layout.json> [-o out.json]
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { maskDoc, describe } = createRequire(import.meta.url)(
    '../shared/diff.cjs',
);

// Compares two capture files. Returns { file, summary } for the file it
// wrote, or { file: null, summary } when there is nothing to write.
export function diffFiles(baseFile, nextFile, outFile) {
    const read = (f) => {
        const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (doc.format !== 'layout-to-figma')
            throw new Error(`${f} is not a layout capture.`);
        return doc;
    };
    const masked = maskDoc(read(baseFile), read(nextFile));
    if (!masked) return { file: null, summary: 'No differences.' };
    masked.mask.baseline.file = path.basename(baseFile);
    const out =
        outFile ||
        nextFile.replace(/(\.figma-layout)?\.json$/, '') +
            '.changes.figma-layout.json';
    fs.writeFileSync(out, JSON.stringify(masked));
    return { file: out, summary: describe(masked.mask) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            out: { type: 'string', short: 'o' },
            help: { type: 'boolean', default: false },
        },
    });
    if (values.help || positionals.length !== 2) {
        console.log(`
Usage: node tools/figma-layout/capture/diff.mjs <baseline> <capture> [-o <file>]

Writes <capture>.changes.figma-layout.json holding only what differs from
<baseline>: the changed parts of a screen and its tabs/menus, or the changed
Storybook states. Both files must be the same kind of capture.
`);
        process.exit(values.help ? 0 : 1);
    }
    try {
        const { file, summary } = diffFiles(
            positionals[0],
            positionals[1],
            values.out,
        );
        console.log(file ? `${summary}\n→ ${file}` : summary);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
