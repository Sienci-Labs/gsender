import gsenderPlugin from '@sienci/gsender-plugin-sdk/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react(), gsenderPlugin()],
    base: './',
    build: {
        outDir: 'ui',
        emptyOutDir: true,
        rollupOptions: {
            external: [
                '@sienci/gsender-plugin-sdk',
                '@sienci/gsender-plugin-sdk/react',
            ],
        },
    },
});
