const fs = require('fs/promises');
const path = require('path');

/**
 * electron-builder afterPack hook.
 * Removes broken symlinks that point to the Electron CLI executable under
 * `@electron/remote`'s hoisted `node_modules`. These symlinks resolve to
 * files that are not present in the packaged app and cause the signing / stat
 * step to fail on macOS.
 *
 * @param {import('app-builder-lib').AfterPackContext} context
 */
exports.default = async function afterPack(context) {
  const appRoot = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    'Contents',
    'Resources',
    'node_modules',
    '@electron',
    'remote'
  );

  const nestedNodeModules = path.join(appRoot, 'node_modules');
  const binDir = path.join(nestedNodeModules, '.bin');

  // Remove the nested node_modules/.bin folder entirely; the executables it
  // contains point to dev-only files that are not packaged and cause ENOENT
  // errors during signing verification.
  try {
    await fs.rm(binDir, { recursive: true, force: true });
  } catch (error) {
    // If the folder is already gone or cannot be removed, log a warning so
    // we have some trace, but do not fail the build.
    console.warn(`[afterPack] Unable to remove ${binDir}: ${error.message}`);
  }

  // If `node_modules` is now empty, clean that up as well to avoid bundling
  // an empty directory.
  try {
    const remaining = await fs.readdir(nestedNodeModules);
    if (remaining.length === 0) {
      await fs.rmdir(nestedNodeModules);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(
        `[afterPack] Unable to clean ${nestedNodeModules}: ${error.message}`
      );
    }
  }
};

