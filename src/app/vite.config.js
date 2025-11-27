import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import tsconfigPaths from 'vite-tsconfig-paths';
import { patchCssModules } from 'vite-css-modules';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import pkg from './package.json';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in project root
// Vite's loadEnv looks for .env files relative to the root option
const rootDir = path.resolve(__dirname, '../..');
const env = loadEnv(process.env.NODE_ENV || 'production', rootDir, '');

// Debug: Log if Sentry env vars are loaded (only in development)
if (process.env.NODE_ENV === 'development') {
    const hasSentryVars =
        !!(env.SENTRY_ORG || process.env.SENTRY_ORG) &&
        !!(env.SENTRY_PROJECT || process.env.SENTRY_PROJECT) &&
        !!(env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN);
    console.log('🔍 Sentry environment variables loaded:', hasSentryVars);
    if (hasSentryVars) {
        console.log('   - Org:', env.SENTRY_ORG || process.env.SENTRY_ORG);
        console.log(
            '   - Project:',
            env.SENTRY_PROJECT || process.env.SENTRY_PROJECT,
        );
        console.log(
            '   - Auth Token:',
            env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN
                ? '✓ Set'
                : '✗ Missing',
        );
    }
}

export default defineConfig({
    root: path.resolve(__dirname, './'), // Set root to the directory containing index.html
    base: './',
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
        preprocessorOptions: { stylus: { modules: true } },
        modules: {
            // Enable CSS Modules for all .scss files
            localsConvention: 'camelCaseOnly',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
        devSourcemap: true,
    },
    plugins: [
        tsconfigPaths(),
        react(),
        patchCssModules(),
        tailwindcss(),
        nodePolyfills({
            // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
            include: ['process'],
            globals: { global: true, process: true },
        }),
        // Only enable Sentry plugin if environment variables are set
        // Use env object from loadEnv, fallback to process.env for compatibility
        ...((env.SENTRY_ORG || process.env.SENTRY_ORG) &&
        (env.SENTRY_PROJECT || process.env.SENTRY_PROJECT) &&
        (env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN)
            ? [
                  sentryVitePlugin({
                      org: env.SENTRY_ORG || process.env.SENTRY_ORG,
                      project: env.SENTRY_PROJECT || process.env.SENTRY_PROJECT,
                      authToken:
                          env.SENTRY_AUTH_TOKEN ||
                          process.env.SENTRY_AUTH_TOKEN,
                      release: {
                          name: pkg.version,
                      },
                      sourcemaps: {
                          // Automatically detect source maps in the build output
                          // The plugin will find them based on Vite's build.outDir
                          filesToDeleteAfterUpload:
                              '../../dist/gsender/app/**/*.map',
                          // URL prefix to match how files are served
                          // '~/' means root of the web server
                          urlPrefix: '~/',
                      },
                      telemetry: false,
                      debug: process.env.NODE_ENV === 'development',
                  }),
              ]
            : []),
    ],
    resolve: {
        alias: {
            app: path.resolve(__dirname, './src'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {},
    server: {
        hmr: {
            overlay: false,
        },
    },
    optimizeDeps: {
        include: ['**/*.styl'],
    },
    build: {
        // Use 'hidden' source maps in production - they're uploaded to Sentry but not exposed to users
        sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
        // Set outDir so Sentry plugin can find the build output
        // This matches the --outDir flag in build:client script
        outDir: '../../dist/gsender/app',
        /*rollupOptions: {
            rollupOptions: {
                external: ['unenv/node/process']
            }
        }*/
    },
});
