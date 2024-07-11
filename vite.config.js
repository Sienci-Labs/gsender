import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, './src/app-new'), // Set root to the directory containing index.html
    base: './',
    build: {
        outDir: path.resolve(__dirname, './dist/gsender/app'), // Output directly to /output/app
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, './src/app-new/index.html'), // Main entry point
            },
            // output: {
            //     entryFileNames: 'assets/[name].[hash].js', // Adjusted output path for JS files
            //     chunkFileNames: 'assets/[name].[hash].js', // Adjusted output path for chunks
            //     assetFileNames: 'assets/[name].[hash].[ext]', // Adjusted output path for assets
            // },
        },
    },
    plugins: [react()],
});
