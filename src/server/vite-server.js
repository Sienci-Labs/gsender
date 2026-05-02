import fs from 'fs';
import path from 'path';

export const viteServer = async (app) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const base = process.env.BASE || '/';
    const bundleRoot = path.resolve(__dirname, '..');
    const projectRoot = process.cwd();

    const devDir = path.resolve(projectRoot, 'src/app');
    const prodDirCandidates = [
        path.resolve(bundleRoot, 'app'),
        path.resolve(projectRoot, 'dist/gsender/app'),
    ];
    const prodDir = prodDirCandidates.find((dir) => fs.existsSync(dir)) || prodDirCandidates[0];

    if (!isProduction && !fs.existsSync(devDir)) {
        throw new Error(`Vite dev directory not found: ${devDir}`);
    }

    // Cached production index.html (optional — graceful if missing)
    let templateHtml = '';
    if (isProduction) {
        const indexPath = path.resolve(prodDir, 'index.html');
        if (fs.existsSync(indexPath)) {
            templateHtml = await fs.promises.readFile(indexPath, 'utf-8');
        }
    }

    if (!isProduction) {
        const { createServer } = await import('vite');
        const vite = await createServer({
            server: { middlewareMode: true },
            appType: 'spa', // handles SPA routing + index.html fallback automatically
            base,
            configFile: path.resolve(devDir, 'vite.config.js')
        });
        app.use(vite.middlewares);
    } else {
        const compression = (await import('compression')).default;
        const sirv = (await import('sirv')).default;
        app.use(compression());
        app.use(base, sirv(path.resolve(prodDir), { extensions: [] }));

        // SPA fallback for prod: serve index.html for all unmatched routes
        app.use('*', (req, res) => {
            if (templateHtml) {
                res.status(200).set({ 'Content-Type': 'text/html' }).send(templateHtml);
            } else {
                res.status(404).end('Not found');
            }
        });
    }
};
