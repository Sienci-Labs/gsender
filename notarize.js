const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir, arch } = context;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    // Only notarize for x64 build to avoid duplicate notarization attempts
    // The universal binary will be notarized once
    if (arch !== 3) { // 2 = x64, skip arm64 (3)
        console.log(`Skipping notarization for arch ${arch} (will notarize with x64 build)`);
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

    if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
        console.log('Skipping notarization: Apple credentials not provided');
        return;
    }

    // Add a small delay to ensure file handles are released
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Starting notarization...');
    console.log('Apple ID:', process.env.APPLE_ID);
    console.log('Team ID:', process.env.APPLE_TEAM_ID);

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
