const { execSync } = require('child_process');

/**
 * Custom signing utility for DigiCert KeyLocker (KSP).
 * Required environment variables (set only on release tag builds in CI):
 *   SM_KEYPAIR_ALIAS       - DigiCert KeyLocker keypair alias
 *   SM_CLIENT_CERT_FILE    - Path to client auth .p12 (written to disk by CI)
 */
// eslint-disable-next-line require-await
exports.default = async (config) => {
    if (process.platform !== 'win32') {
        return;
    }

    const keypairAlias = process.env.SM_KEYPAIR_ALIAS;
    const clientCert = process.env.SM_CLIENT_CERT_FILE;
    const filePath = config.path ? String(config.path) : '';

    // Skip silently on non-signing builds (branch builds, dev machines without SM vars)
    if (!keypairAlias || !clientCert) {
        console.log('WindowsSigner: SM_KEYPAIR_ALIAS or SM_CLIENT_CERT_FILE not set — skipping signing');
        return;
    }

    if (!filePath) {
        throw new Error('customSign: no file path provided');
    }

    try {
        execSync(
            `smctl sign --keypair-alias="${keypairAlias}" --input="${filePath}" --verbose`,
            { stdio: 'inherit' }
        );
    } catch (err) {
        throw new Error(`Failed to sign executable: ${err.message}`);
    }
};
