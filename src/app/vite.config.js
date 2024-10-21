import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { patchCssModules } from 'vite-css-modules';
import json from '@rollup/plugin-json';

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
        },
    },
    plugins: [
        TanStackRouterVite({
            routesDirectory: path.resolve(__dirname, './src/routes'),
            generatedRouteTree: path.resolve(
                __dirname,
                './src/routeTree.gen.ts',
            ),
        }),
        tsconfigPaths(),
        react(),
        patchCssModules(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            app: path.resolve(__dirname, './src'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {
        'process.env': {},
    },
    optimizeDeps: {
        include: ['**/*.styl'],
    },
});
