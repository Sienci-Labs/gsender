const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = path.join(appOutDir, `${appName}.app`);

    console.log('============ Notarization Info ============');
    console.log('App Out Dir:', appOutDir);
    console.log('App Name:', appName);
    console.log('App Path:', appPath);
    console.log('App Path Exists:', fs.existsSync(appPath));

    if (fs.existsSync(appOutDir)) {
        console.log('Contents of appOutDir:');
        console.log(fs.readdirSync(appOutDir));
    }
    console.log('==========================================');

    if (!fs.existsSync(appPath)) {
        console.error(`App bundle not found at: ${appPath}`);
        console.error('Skipping notarization');
        return;
    }

    if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
        console.log('Skipping notarization: Apple credentials not provided');
        return;
    }

    console.log('Starting notarization...');
    try {
        await notarize({
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
