import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(dirname, '../src/app');

const COMMON_DOM_PROPS = new Set([
    'children',
    'className',
    'disabled',
    'placeholder',
    'title',
    'type',
    'value',
]);

/** @type { import('@storybook/tanstack-react').StorybookConfig } */
const config = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@chromatic-com/storybook',
        '@storybook/addon-vitest',
        '@storybook/addon-a11y',
        '@storybook/addon-docs',
        '@storybook/addon-mcp',
        'msw-storybook-addon',
    ],
    framework: '@storybook/tanstack-react',
    core: {
        disableTelemetry: true,
    },
    staticDirs: ['../public'],
    // Controls are generated from each story's `component`. The default
    // (react-docgen) only reads the component's own file, so props typed via
    // `extends React.HTMLAttributes<...>` or cva's `VariantProps` come out empty.
    // react-docgen-typescript runs the compiler for .ts/.tsx; .jsx stays on react-docgen.
    typescript: {
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            // Resolves the app's `app/*` paths; there is no tsconfig at the repo root
            tsconfigPath: path.join(appDir, 'tsconfig.json'),
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            // Keep props declared in the app and cva variants. Of the hundreds
            // inherited from React's DOM attribute types, keep the common few.
            propFilter: (prop) =>
                !prop.parent ||
                !/node_modules/.test(prop.parent.fileName) ||
                /class-variance-authority/.test(prop.parent.fileName) ||
                COMMON_DOM_PROPS.has(prop.name),
        },
    },
    // The renderer app (and its vite config) lives in src/app, not the repo root.
    // Merged here rather than via builder options so addon-vitest picks it up too.
    async viteFinal(viteConfig) {
        const { loadConfigFromFile, mergeConfig } = await import('vite');
        const { nodePolyfills } = await import('vite-plugin-node-polyfills');
        const { config: appConfig } = await loadConfigFromFile(
            { command: 'serve', mode: 'development' },
            path.join(appDir, 'vite.config.js'),
        );
        const { root, base, build, server, optimizeDeps, ...appShared } =
            appConfig;
        return mergeConfig(viteConfig, {
            ...appShared,
            // Sentry's sourcemap upload plugin is build-only and needs auth. The app's
            // process polyfill also aliases node:process, which breaks Storybook's own
            // prebundled chunks, so swap in one that leaves node: imports alone.
            plugins: [
                ...appShared.plugins
                    .flat()
                    .filter(
                        (plugin) =>
                            !plugin?.name?.startsWith('sentry') &&
                            plugin?.name !== 'vite-plugin-node-polyfills',
                    ),
                // Mirrors src/app/vite.config.js (@react-pdf/renderer needs Buffer)
                nodePolyfills({
                    include: ['buffer', 'process'],
                    globals: { Buffer: true, global: true, process: true },
                    protocolImports: false,
                }),
            ],
            // The polyfill injects these at transform time, after the dependency scan,
            // which otherwise makes Vite reload the page mid-run to optimize them
            optimizeDeps: {
                include: [
                    'vite-plugin-node-polyfills/shims/buffer',
                    'vite-plugin-node-polyfills/shims/global',
                    'vite-plugin-node-polyfills/shims/process',
                ],
            },
            resolve: {
                ...appShared.resolve,
                alias: {
                    ...appShared.resolve.alias,
                    // From src/app/tsconfig.json paths, which vite-tsconfig-paths only finds
                    // when Vite's root is src/app (Storybook's root is the repo root)
                    'app-root': appDir,
                },
            },
            css: {
                ...appShared.css,
                // Use src/app/postcss.config.cjs so Tailwind finds src/app/tailwind.config.ts
                postcss: appDir,
            },
        });
    },
};
export default config;
