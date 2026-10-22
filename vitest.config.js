import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        // Crawl every story up front, on every run, so Vite never discovers a
        // dependency mid-run and reloads the browser (that fails whole files with
        // "Invalid hook call"). Without force, a warm cache skips the crawl.
        optimizeDeps: {
          entries: ['.storybook/preview.jsx', 'src/**/*.stories.@(js|jsx|ts|tsx)'],
          force: true,
        },
        test: {
          name: 'storybook',
          // Runs before any story file imports app/store
          setupFiles: ['.storybook/isolate-storage.js'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
