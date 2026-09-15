const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const run = (command, args, cwd) => {
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });

    if (result.status !== 0) {
        throw new Error(`Command failed: ${command} ${args.join(' ')}`);
    }
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Directories that hold generated output or dependencies rather than sources,
// so they never count as an input when timestamping a tree.
const NON_SOURCE_DIRS = new Set(['.git', 'dist', 'node_modules', 'ui']);

/**
 * Greatest mtime (ms) across `targets`, which may be files or directories.
 * Directories are walked recursively, skipping NON_SOURCE_DIRS. Paths that
 * don't exist contribute nothing; returns 0 when none of them do.
 */
const newestMtimeMs = (targets) => {
    let newest = 0;

    const visit = (target) => {
        let stats;
        try {
            stats = fs.statSync(target);
        } catch {
            return;
        }

        if (!stats.isDirectory()) {
            newest = Math.max(newest, stats.mtimeMs);
            return;
        }

        for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
            if (entry.isDirectory() && NON_SOURCE_DIRS.has(entry.name)) {
                continue;
            }
            visit(path.join(target, entry.name));
        }
    };

    targets.forEach(visit);
    return newest;
};

/** True when `outputPath` is missing or older than the newest of `sourcePaths`. */
const isStale = (outputPath, sourcePaths) => {
    let outputStats;
    try {
        outputStats = fs.statSync(outputPath);
    } catch {
        return true;
    }
    return newestMtimeMs(sourcePaths) > outputStats.mtimeMs;
};

module.exports = { run, readJson, newestMtimeMs, isStale };
