import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss'

export default defineConfig({
    root: path.resolve(__dirname, './src/app'), // Set root to the directory containing index.html
    base: './',
    build: {
        outDir: path.resolve(__dirname, './dist/gsender/app'), // Output directly to /output/app
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, './src/app/src/entry-client.tsx'), // Main entry point
            },
            output: {
                assetFileNames: 'assets/[name].[ext]'
            }
        },
    },
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
    },
    plugins: [react()],
});
