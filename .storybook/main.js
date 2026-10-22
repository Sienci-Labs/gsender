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
    const { config: appConfig } = await loadConfigFromFile(
      { command: 'serve', mode: 'development' },
      path.join(appDir, 'vite.config.js'),
    );
    const { root, base, build, server, optimizeDeps, ...appShared } = appConfig;
    return mergeConfig(viteConfig, {
      ...appShared,
      // Sentry's sourcemap upload plugin is build-only and needs auth; the
      // node:process polyfill alias breaks Storybook's own prebundled chunks
      plugins: appShared.plugins.flat().filter(
        (plugin) =>
          !plugin?.name?.startsWith('sentry') &&
          plugin?.name !== 'vite-plugin-node-polyfills',
      ),
      css: {
        ...appShared.css,
        // Use src/app/postcss.config.cjs so Tailwind finds src/app/tailwind.config.ts
        postcss: appDir,
      },
    });
  },
};
export default config;
