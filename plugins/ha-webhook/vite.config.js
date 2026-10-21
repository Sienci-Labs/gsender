import gsenderPlugin from '@sienci/gsender-plugin-sdk/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [gsenderPlugin()],
    base: './',
    build: {
        outDir: 'ui',
        emptyOutDir: true,
        rollupOptions: {
            external: ['@sienci/gsender-plugin-sdk'],
        },
    },
});
