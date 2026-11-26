import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';
import { defineConfig } from 'vite';

const root = path.resolve(__dirname, '../..');

// Same pinning as src/app/vite.config.js (see there): shared app/ modules such
// as src/app/src/i18n resolve bare imports by walking up from their own path,
// so src/node_modules (the server's production install, created by CI's
// `yarn --cwd src install`) wins over the root. webappengine pulls i18next@8
// in there, which shadowed the root i18next while react-i18next still used
// the root copy, crashing released pendant builds with "hasLoadedNamespace is
// not a function". Pin these to the root copies so the two always match.
const requireFromRoot = createRequire(path.join(root, 'package.json'));
const rootPackageDir = (name: string) =>
    path.dirname(requireFromRoot.resolve(`${name}/package.json`));
const PINNED_TO_ROOT = ['i18next', 'react-i18next'];

// Tailwind v3 + PostCSS only re-runs when the CSS entry file itself is touched.
// This plugin watches all Tailwind content directories (including those outside
// the Vite root) and invalidates the CSS module whenever a source file changes,
// so new utility classes appear in the browser without a manual refresh.
function tailwindHmr(): Plugin {
    const contentDirs = [
        path.join(__dirname, 'src'),
        path.join(root, 'src/app/src'),
    ];
    const cssEntry = path.join(__dirname, 'src/index.css');

    return {
        name: 'tailwind-hmr',
        configureServer(server: ViteDevServer) {
            contentDirs.forEach((dir) => server.watcher.add(dir));

            server.watcher.on('change', (file: string) => {
                if (
                    contentDirs.some((d) => file.startsWith(d)) &&
                    /\.(tsx?|jsx?|html)$/.test(file)
                ) {
                    const mods = server.moduleGraph.getModulesByFile(cssEntry);
                    mods?.forEach((m) =>
                        server.moduleGraph.invalidateModule(m),
                    );
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
        alias: [
            // app/ → src/app/src/ so shared features can resolve their app/* utilities.
            // 'app-root' must stay before 'app', which would otherwise match it.
            { find: 'app-root', replacement: root },
            { find: 'app', replacement: path.join(root, 'src/app/src') },
            { find: '@', replacement: path.join(root, 'src/app/src') },
            ...PINNED_TO_ROOT.map((name) => ({
                // Exact match only, so e.g. `i18next-http-backend` is untouched.
                find: new RegExp(`^${name}$`),
                replacement: rootPackageDir(name),
            })),
        ],
        // src/package.json lists react too, so src/node_modules could shadow it
        // for shared app/ files the same way.
        dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
        // concaveman is imported only by Outline.worker, which the dependency
        // scan doesn't follow; see src/app/vite.config.js for why it must be
        // pre-bundled up front.
        include: ['concaveman'],
    },
    server: {
        port: 5174,
        fs: {
            // The visualize worker lives in src/app/src/workers, outside this
            // project's root (src/pendant) — allow the dev server to serve it.
            allow: [root],
        },
        proxy: {
            '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
            '/plugins': { target: 'http://127.0.0.1:8000', changeOrigin: true },
            '/socket.io': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                ws: true,
            },
        },
    },
    build: {
        outDir: path.join(root, 'dist/gsender/pendant'),
        emptyOutDir: true,
    },
});
