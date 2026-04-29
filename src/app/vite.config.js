import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import tsconfigPaths from 'vite-tsconfig-paths';
import { patchCssModules } from 'vite-css-modules';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { sentryVitePlugin } from '@sentry/vite-plugin';

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
        sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
    ],
    resolve: {
        alias: {
            '@gsender/controller-client/store/redux': path.resolve(__dirname, '../../packages/controller-client/src/store/redux'),
            '@gsender/controller-client/store/definitions': path.resolve(__dirname, '../../packages/controller-client/src/store/definitions.ts'),
            '@gsender/controller-client/store': path.resolve(__dirname, '../../packages/controller-client/src/store'),
            '@gsender/controller-client/controller': path.resolve(__dirname, '../../packages/controller-client/src/controller.ts'),
            '@gsender/controller-client/hooks': path.resolve(__dirname, '../../packages/controller-client/src/hooks'),
            '@gsender/controller-client': path.resolve(__dirname, '../../packages/controller-client/src/index.ts'),
            '@gsender/ui/shadcn': path.resolve(__dirname, '../../packages/ui/src/shadcn'),
            '@gsender/ui/primitives': path.resolve(__dirname, '../../packages/ui/src/primitives'),
            '@gsender/ui/form': path.resolve(__dirname, '../../packages/ui/src/form'),
            '@gsender/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
            '@gsender/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
            app: path.resolve(__dirname, './src'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {},
    server: {
        hmr: {
            overlay: false,
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                ws: true,
            },
        },
    },
    optimizeDeps: {
        include: ['**/*.styl'],
    },
    build: {
        sourcemap: true,
        /*rollupOptions: {
            rollupOptions: {
                external: ['unenv/node/process']
            }
        }*/
    },
});
