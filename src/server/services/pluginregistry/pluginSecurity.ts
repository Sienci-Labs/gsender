import fs from 'node:fs';
import { type Identifier, parse } from 'acorn';
import { ancestor as walkAncestor } from 'acorn-walk';

export interface ScanResult {
    /** Names/sentinels representing SDK capabilities this plugin appears to use. */
    capabilities: string[];
    /** True if the plugin uses a dynamic import() we couldn't fully resolve statically. */
    hasDynamicImport: boolean;
    /** True if the plugin uses CJS require() to reach the SDK. */
    hasRequireCall: boolean;
}

/**
 * Scans a built plugin bundle (ESM output) and extracts every named import
 * pulled from your SDK package. Assumes the SDK was marked `external` in the
 * plugin author's Vite/Rollup config, so `import ... from '@yoursdk/plugin-api'`
 * survives in the output instead of being inlined/bundled away.
 *
 * @param filePath - path to the built plugin .js file
 * @param sdkPackageNames - the SDK's package specifier, e.g. '@yoursdk/plugin-api'
 */
export function scanPluginForSdkUsage(
    filePath: string,
    sdkPackageNames: string[]
): ScanResult | unknown {
    let indexFile: string;
    try {
        indexFile = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        return { err };
    }

    const ast = parse(indexFile, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowReturnOutsideFunction: true, // some Rollup output wraps oddly; be lenient
    });

    const capabilities = new Set<string>();
    let hasDynamicImport = false;
    let hasRequireCall = false;

    walkAncestor(ast, {
        // Static ESM imports: import { readFirmware } from '@yoursdk/plugin-api'
        ImportDeclaration(node) {
            const importNode = node;
            if (!sdkPackageNames.includes(importNode.source.value as string)) return;

            for (const spec of importNode.specifiers) {
                if (spec.type === 'ImportSpecifier') {
                    // `imported` is the actual exported name from the SDK, `local` is
                    // whatever the minifier renamed it to locally — we want `imported`.
                    capabilities.add((spec.imported as Identifier).name);
                } else if (spec.type === 'ImportDefaultSpecifier') {
                    capabilities.add('default');
                } else if (spec.type === 'ImportNamespaceSpecifier') {
                    // import * as sdk from '@yoursdk/plugin-api' — can't tell which
                    // members are used statically without further call-site analysis.
                    capabilities.add('*namespace-import*');
                }
            }
        },

        // CJS interop some Rollup/Vite outputs still produce:
        // const { readFirmware } = require('@yoursdk/plugin-api')
        CallExpression(node, _state, ancestors) {
            const callNode = node;

            if (
                callNode.callee.type === 'Identifier' &&
                callNode.callee.name === 'require' &&
                callNode.arguments.length === 1 &&
                callNode.arguments[0].type === 'Literal'
            ) {
                const arg = callNode.arguments[0] as { value: string };
                if (sdkPackageNames.includes(arg.value)) {
                    hasRequireCall = true;
                    // Walk up to find an enclosing VariableDeclarator so we can check
                    // for `const { readFirmware } = require(...)` style destructuring.
                    const declarator = (ancestors)
                        .slice()
                        .reverse()
                        .find((a) => a.type === 'VariableDeclarator') as
                        | { id?: { type: string; properties?: Array<{ key?: { name?: string } }> } }
                        | undefined;

                    if (declarator?.id?.type === 'ObjectPattern') {
                        for (const prop of declarator.id.properties ?? []) {
                            if (prop.key?.name) capabilities.add(prop.key.name);
                        }
                    } else {
                        // e.g. `const sdk = require(...)` then `sdk.readFirmware()` —
                        // can't resolve members without also tracking member access.
                        capabilities.add('*require-whole-module*');
                    }
                }
            }

            // Dynamic import: import('@yoursdk/plugin-api') or computed specifiers
            // Acorn represents dynamic import() as callee.type === 'Import'.
            if ((callNode.callee as { type: string }).type === 'Import') {
                const arg = callNode.arguments[0] as { type: string; value: string };
                if (arg && callNode.arguments.length === 1 && arg.type === 'Literal' && sdkPackageNames.includes(arg.value)) {
                    hasDynamicImport = true;
                    capabilities.add('*require-whole-module*');
                } else if (arg && arg.type !== 'Literal') {
                    // Specifier isn't a plain string literal — can't resolve statically.
                    hasDynamicImport = true;
                }
            }
        },
    });

    return {
        capabilities: [...capabilities].sort(),
        hasDynamicImport,
        hasRequireCall,
    };
}

// // --- CLI usage: tsx scan-plugin.ts <bundle.js> <sdk-package-name> ---
// const isMainModule =
// typeof process !== 'undefined' &&
// import.meta.url === `file://${process.argv[1]}`;

// if (isMainModule) {
//     const [, , filePath, sdkPackageName] = process.argv;
//     if (!filePath || !sdkPackageName) {
//         console.error('Usage: node scan-plugin.js <bundle.js> <sdk-package-name>');
//         process.exit(1);
//     }

//     const result = scanPluginForSdkUsage(filePath, sdkPackageName);
//     console.log(JSON.stringify(result, null, 2));

//     if (result.hasDynamicImport) {
//         console.warn(
//         '\n⚠️  Dynamic import() detected. This plugin may load the SDK in a ' +
//             'way static analysis cannot fully resolve. Do not rely on this scan ' +
//             'alone for security decisions — enforce permissions at runtime too.'
//         );
//     }
// }