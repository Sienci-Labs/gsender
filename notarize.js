const { notarize } = require('@electron/notarize');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function isAppSigned(appPath) {
    try {
        execFileSync('codesign', ['--verify', appPath], { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

exports.default = async function notarizing(context) {
    const {
        electronPlatformName,
        appOutDir,
        arch
    } = context;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = path.join(appOutDir, `${appName}.app`);

    console.log('============ Notarization Info ============');
    console.log('App Out Dir:', appOutDir);
    console.log('App Name:', appName);
    console.log('App Path:', appPath);
    console.log('Architecture:', arch);
    console.log('==========================================');

    if (!fs.existsSync(appPath)) {
        console.error(`App bundle not found at: ${appPath}`);
        console.error('Skipping notarization');
        return;
    }

    // electron-builder skips signing on pull requests unless CSC_FOR_PULL_REQUEST=true
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        console.log('Skipping notarization: pull request builds are unsigned');
        return;
    }

    if (!isAppSigned(appPath)) {
        console.log('Skipping notarization: app is not signed');
        return;
    }

    if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
        console.log('Skipping notarization: Apple credentials not provided');
        return;
    }

    console.log('Starting notarization...');

    try {
        await notarize({
            tool: 'notarytool',
            appBundleId: 'org.sienci.gsender',
            appPath: appPath,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
        });

        console.log('✓ Notarization successful');
    } catch (error) {
        console.error('✗ Notarization failed:', error);
        throw error;
    }
};
