import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(dirname, '../src/app');

/** @type { import('@storybook/tanstack-react').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "msw-storybook-addon"
  ],
  "framework": "@storybook/tanstack-react",
  "staticDirs": ["../public"],
  // The renderer app (and its vite config) lives in src/app, not the repo root.
  // Merged here rather than via builder options so addon-vitest picks it up too.
  async viteFinal(viteConfig) {
    const { loadConfigFromFile, mergeConfig } = await import('vite');
    const { nodePolyfills } = await import('vite-plugin-node-polyfills');
    const { config: appConfig } = await loadConfigFromFile(
      { command: 'serve', mode: 'development' },
      path.join(appDir, 'vite.config.js'),
    );
    const { root, base, build, server, optimizeDeps, ...appShared } = appConfig;
    return mergeConfig(viteConfig, {
      ...appShared,
      // Sentry's sourcemap upload plugin is build-only and needs auth. The app's
      // process polyfill also aliases node:process, which breaks Storybook's own
      // prebundled chunks, so swap in one that leaves node: imports alone.
      plugins: [
        ...appShared.plugins.flat().filter(
          (plugin) =>
            !plugin?.name?.startsWith('sentry') &&
            plugin?.name !== 'vite-plugin-node-polyfills',
        ),
        nodePolyfills({
          include: ['process'],
          globals: { global: true, process: true },
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
      css: {
        ...appShared.css,
        // Use src/app/postcss.config.cjs so Tailwind finds src/app/tailwind.config.ts
        postcss: appDir,
      },
    });
  },
};
export default config;
