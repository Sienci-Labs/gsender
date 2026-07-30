import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import type { Plugin, ViteDevServer } from 'vite';

const root = path.resolve(__dirname, '../..');

// Tailwind v3 + PostCSS only re-runs when the CSS entry file itself is touched.
// This plugin watches all Tailwind content directories (including those outside
// the Vite root) and invalidates the CSS module whenever a source file changes,
// so new utility classes appear in the browser without a manual refresh.
function tailwindHmr(): Plugin {
    const contentDirs = [
        path.join(__dirname, 'src'),
        path.join(root, 'apps/desktop/src'),
        path.join(root, 'packages/ui/src'),
        path.join(root, 'packages/features/src'),
        path.join(root, 'packages/controller-client/src'),
    ];
    const cssEntry = path.join(__dirname, 'src/index.css');

    return {
        name: 'tailwind-hmr',
        configureServer(server: ViteDevServer) {
            contentDirs.forEach(dir => server.watcher.add(dir));

            server.watcher.on('change', (file: string) => {
                if (
                    contentDirs.some(d => file.startsWith(d)) &&
                    /\.(tsx?|jsx?|html)$/.test(file)
                ) {
                    const mods = server.moduleGraph.getModulesByFile(cssEntry);
                    mods?.forEach(m => server.moduleGraph.invalidateModule(m));
                    server.ws.send({ type: 'full-reload' });
                }
            });
        },
    };
}

export default defineConfig({
    root: path.resolve(__dirname, './'),
    base: './',
    plugins: [react(), tailwindHmr()],
    resolve: {
        alias: {
            // Shared packages
            '@gsender/features': path.join(root, 'packages/features/src'),
            '@gsender/controller-client/store/redux': path.join(root, 'packages/controller-client/src/store/redux'),
            '@gsender/controller-client/store/definitions': path.join(root, 'packages/controller-client/src/store/definitions.ts'),
            '@gsender/controller-client/store': path.join(root, 'packages/controller-client/src/store'),
            '@gsender/controller-client/controller': path.join(root, 'packages/controller-client/src/controller.ts'),
            '@gsender/controller-client/hooks': path.join(root, 'packages/controller-client/src/hooks'),
            '@gsender/controller-client': path.join(root, 'packages/controller-client/src/index.ts'),
            '@gsender/ui/shadcn': path.join(root, 'packages/ui/src/shadcn'),
            '@gsender/ui/primitives': path.join(root, 'packages/ui/src/primitives'),
            '@gsender/ui/form': path.join(root, 'packages/ui/src/form'),
            '@gsender/ui/lib': path.join(root, 'packages/ui/src/lib'),
            '@gsender/ui': path.join(root, 'packages/ui/src/index.ts'),
            // app/ → apps/desktop/src/ so features can resolve their app/* utilities
            'app-root': root,
            'app': path.join(root, 'apps/desktop/src'),
            '@': path.join(root, 'apps/desktop/src'),
        },
    },
    server: {
        port: 5174,
        proxy: {
            '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
            '/socket.io': { target: 'http://127.0.0.1:8000', changeOrigin: true, ws: true },
        },
    },
    build: {
        outDir: path.join(root, 'dist/gsender/pendant'),
        emptyOutDir: true,
    },
});
