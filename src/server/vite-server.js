import fs from 'fs';
import path from 'path';

export const viteServer = async (app) => {
    // Constants
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

    // Cached production assets
    const templateHtml = isProduction
        ? await fs.promises.readFile(path.resolve(prodDir, 'index.html'), 'utf-8')
        : '';
    const ssrManifest = isProduction
        ? await fs.promises.readFile(path.resolve(prodDir, '.vite/ssr-manifest.json'), 'utf-8')
        : undefined;

    // Add Vite or respective production middlewares
    let vite;
    if (!isProduction) {
        const { createServer } = await import('vite');
        vite = await createServer({
            server: { middlewareMode: true },
            appType: 'custom',
            build: {
                ssr: true,
                ssrEmitAssets: true
            },
            base,
            configFile: path.resolve(devDir, 'vite.config.js')
        });
        app.use(vite.middlewares);
    } else {
        const compression = (await import('compression')).default;
        const sirv = (await import('sirv')).default;
        app.use(compression());
        app.use(base, sirv(path.resolve(prodDir), { extensions: [] }));
    }

    // Serve HTML
    app.use('*', async (req, res) => {
        try {
            const url = req.originalUrl.replace(base, '');

            let template;
            let render;

            if (!isProduction) {
                // Always read fresh template in development
                template = await fs.promises.readFile(path.resolve(devDir, 'index.html'), 'utf-8');
                template = await vite.transformIndexHtml(url, template);
                render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
            } else {
                template = templateHtml;
                render = (await import(path.resolve(prodDir, 'entry-server'))).render;
            }

            const rendered = await render(url, ssrManifest);
            const html = template
                .replace('<!--app-head-->', rendered.head ?? '')
                .replace('<!--app-html-->', rendered.html ?? '');

            res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        } catch (e) {
            // eslint-disable-next-line no-unused-expressions
            vite?.ssrFixStacktrace(e);
            res.status(500).end(e.stack);
        }
    });
};
