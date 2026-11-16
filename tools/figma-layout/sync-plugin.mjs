#!/usr/bin/env node
/*
 * A Figma plugin is two self-contained files (code.js, ui.html) that can't
 * import anything, and this tool has no build step. The logic the plugin
 * shares with the Node side lives in shared/*.cjs; this pastes it into the
 * plugin between marker comments:
 *
 *   shared/diff.cjs  → figma-plugin/ui.html   between <shared:diff> markers
 *   shared/match.cjs → figma-plugin/code.js   between <shared:match> markers
 *
 *   yarn figma:sync-plugin           after editing shared/*.cjs
 *   yarn figma:sync-plugin --check   exit 1 if the plugin is out of date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TARGETS = [
    { name: 'diff', source: 'shared/diff.cjs', into: 'figma-plugin/ui.html' },
    { name: 'match', source: 'shared/match.cjs', into: 'figma-plugin/code.js' },
];

// Returns the files that were (or with `check`, would be) changed.
export function syncPlugin({ check = false } = {}) {
    const stale = [];
    for (const { name, source, into } of TARGETS) {
        const open = `/* <shared:${name}> */`;
        const close = `/* </shared:${name}> */`;
        const file = path.join(HERE, into);
        const text = fs.readFileSync(file, 'utf8');
        const start = text.indexOf(open);
        const end = text.indexOf(close);
        if (start < 0 || end < start)
            throw new Error(`${into} is missing its ${open} … ${close} markers.`);
        const indent = text.slice(text.lastIndexOf('\n', start) + 1, start);
        const body = fs
            .readFileSync(path.join(HERE, source), 'utf8')
            // The CommonJS export is for Node; the plugin has no `module`.
            .replace(/\nif \(typeof module !== 'undefined'\)[^\n]*\n?$/, '\n')
            .trimEnd()
            .split('\n')
            .map((line) => (line ? indent + line : line))
            .join('\n');
        const next =
            text.slice(0, start) +
            `${open}\n${indent}/* Generated from ${source} by sync-plugin.mjs. Don't edit here. */\n${body}\n${indent}` +
            text.slice(end);
        if (next === text) continue;
        stale.push(into);
        if (!check) fs.writeFileSync(file, next);
    }
    return stale;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    const check = process.argv.includes('--check');
    const stale = syncPlugin({ check });
    if (!stale.length) console.log('Plugin is up to date with shared/.');
    else if (check) {
        console.error(
            `Out of date: ${stale.join(', ')}. Run \`yarn figma:sync-plugin\`.`,
        );
        process.exit(1);
    } else console.log(`Updated ${stale.join(', ')}.`);
}
