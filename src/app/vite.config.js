import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    root: path.resolve(__dirname, './'), // Set root to the directory containing index.html
    base: './',
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
        tailwindcss()
    ],
    resolve: {
        alias: {
            'app': path.resolve(__dirname, './src'),
        }
    }
});
