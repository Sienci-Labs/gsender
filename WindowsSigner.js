const { execSync } = require('child_process');


/**
 * Custom signing utility
 * Required environment variables:
 *      KEYPAIR_ALIAS - KSP keypair from Digicert
 * @param config
 * @returns {Promise<void>}
 */


// eslint-disable-next-line require-await
exports.default = async (config) => {
    const keypairAlias = 'key_612024263';
    const path = config.path ? String(config.path) : '';

    if (process.platform !== 'win32' || !keypairAlias || !path) {
        throw new Error('Either win32, no keypair or path not found');
    }

    const output = execSync(
        `smctl sign --keypair-alias=${keypairAlias} --certificate="C:/Certs/sienci.p12" --input="${path}" --verbose`,
    )
        .toString()
        .trim();

    if (!output.includes('Done Adding Additional Store')) {
        throw new Error(`Failed to sign executable: ${output}`);
    }
};
