// src/vite-plugin.ts
// ships as the "@sienci/gsender-plugin-sdk/vite" export.
//
// plugin authors add this to their vite.config and never need to know
// the SDK is externalized
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';
import type { PluginOption } from 'vite';

// these stay external so we can check which functions the plugin imports
const SDK_SPECIFIERS = [
    '@sienci/gsender-plugin-sdk',
    '@sienci/gsender-plugin-sdk/react',
    '@sienci/gsender-plugin-sdk/viewer',
];

// where gSender's host serves the SDK's built runtime (dist/{index,react,viewer}.js)
// keep in sync with `pluginSdkRoute` in the host's src/server/config/settings.base.js.
const HOST_SDK_ROUTE = '/plugin-sdk';

// since we externalized the sdk, these need externalizing to prevent
// having multiple react instances when running the plugins
const REACT_EXTERNALS: Record<string, string> = {
    react: 'react',
    'react-dom': 'react-dom',
    'react-dom/client': 'react-dom/client',
    'react/jsx-runtime': 'react/jsx-runtime',
    'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
};

const isExternalSpecifier = (source: string) =>
    SDK_SPECIFIERS.includes(source) || source in REACT_EXTERNALS;

export default function gsenderPlugin(): PluginOption {
    let outDir = 'dist';
    let root = process.cwd();
    let mode: 'development' | 'production' = 'production';

    return {
        name: 'gsender-plugin-sdk',
        config(config) {
            const existingExternal = config.build?.rollupOptions?.external;

            return {
                build: {
                    rollupOptions: {
                        external(source, importer, isResolved) {
                            if (isExternalSpecifier(source)) return true;

                            if (typeof existingExternal === 'function') {
                                return existingExternal(
                                    source,
                                    importer,
                                    isResolved,
                                );
                            }
                            if (Array.isArray(existingExternal)) {
                                return existingExternal.some((entry) =>
                                    entry instanceof RegExp
                                        ? entry.test(source)
                                        : entry === source,
                                );
                            }
                            if (existingExternal instanceof RegExp) {
                                return existingExternal.test(source);
                            }
                            if (typeof existingExternal === 'string') {
                                return existingExternal === source;
                            }
                            return false;
                        },
                    },
                },
            };
        },
        configResolved(config) {
            root = config.root;
            outDir = path.resolve(root, config.build.outDir);
            mode = config.mode === 'development' ? 'development' : 'production';
        },
        // bundle standalone ESM builds of react/react-dom/jsx-runtimes and
        // drop them into the plugin's own output, so each externalized
        // specifier has somewhere real to resolve to.
        async closeBundle() {
            const vendorDir = path.resolve(outDir, 'vendor');
            await mkdir(vendorDir, { recursive: true });

            const nodeRequire = createRequire(import.meta.url);

            // all five specifiers are built in ONE esbuild call with code
            // splitting, so react itself lands in a single shared chunk that
            // every vendor file imports RELATIVELY
            const entryDir = path.join(vendorDir, '.entries');
            await mkdir(entryDir, { recursive: true });
            const entryPoints: string[] = [];
            for (const specifier of Object.keys(REACT_EXTERNALS)) {
                const resolved = nodeRequire.resolve(specifier, {
                    paths: [root],
                });
                const names = Object.keys(nodeRequire(resolved)).filter(
                    (key) => key !== 'default',
                );
                const namedList = names.join(', ');
                const entryPath = JSON.stringify(resolved);
                const contents = [
                    names.length > 0
                        ? `import { ${namedList} } from ${entryPath}; export { ${namedList} };`
                        : '',
                    `export { default } from ${entryPath};`,
                ]
                    .filter(Boolean)
                    .join('\n');
                const entryFile = path.join(
                    entryDir,
                    `${specifier.replace(/\//g, '-')}.js`,
                );
                await writeFile(entryFile, contents);
                entryPoints.push(entryFile);
            }

            await build({
                entryPoints,
                bundle: true,
                format: 'esm',
                splitting: true,
                outdir: vendorDir,
                chunkNames: 'chunk-[hash]',
                define: {
                    'process.env.NODE_ENV': JSON.stringify(mode),
                },
            });

            await rm(entryDir, { recursive: true, force: true });
        },
        // inject the import map into the built index.html
        transformIndexHtml() {
            const imports: Record<string, string> = Object.fromEntries(
                SDK_SPECIFIERS.map((specifier) => [
                    specifier,
                    `${HOST_SDK_ROUTE}/${specifier === '@sienci/gsender-plugin-sdk' ? 'index' : specifier.split('/').pop()}.js`,
                ]),
            );
            for (const specifier of Object.keys(REACT_EXTERNALS)) {
                imports[specifier] =
                    `./vendor/${specifier.replace(/\//g, '-')}.js`;
            }
            return [
                {
                    tag: 'script',
                    attrs: { type: 'importmap' },
                    injectTo: 'head-prepend',
                    children: JSON.stringify({ imports }, null, 2),
                },
            ];
        },
    };
}
