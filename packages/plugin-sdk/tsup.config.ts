import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: {
            index: 'src/index.ts',
            react: 'src/react.ts',
            viewer: 'src/viewer.ts',
        },
        format: ['esm'],
        platform: 'browser',
        dts: true,
        outDir: 'dist',
        external: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
        ],
        noExternal: ['three', '@sienci/gviewer'],
        splitting: false,
        clean: true,
    },
    {
        entry: { 'vite-plugin': 'src/vite-plugin.ts' },
        format: ['esm'],
        platform: 'node',
        dts: true,
        outDir: 'dist',
        external: ['vite', 'esbuild'],
        splitting: false,
        clean: false, // don't wipe the browser build's output above
    },
]);
