import fs from 'fs';

export const viteServer = async (app) => {
    // Constants
    const isProduction = process.env.NODE_ENV === 'production';
    const base = process.env.BASE || '/';

    // Cached production assets
    const templateHtml = isProduction
        ? await fs.promises.readFile('../../dist/gsender/app/index.html', 'utf-8')
        : '';
    const ssrManifest = isProduction
        ? await fs.promises.readFile('../../dist/gsender/app/.vite/ssr-manifest.json', 'utf-8')
        : undefined;

    // Add Vite or respective production middlewares
    let vite;
    if (!isProduction) {
        const { createServer } = await import('vite');
        vite = await createServer({
            server: { middlewareMode: true },
            appType: 'custom',
            base,
            configFile: '../../vite.config.js'
        });
        app.use(vite.middlewares);
    } else {
        const compression = (await import('compression')).default;
        const sirv = (await import('sirv')).default;
        app.use(compression());
        app.use(base, sirv('../../dist/gsender/app', { extensions: [] }));
    }

    // Serve HTML
    app.use('*', async (req, res) => {
        try {
            const url = req.originalUrl.replace(base, '');

            let template;
            let render;
            if (!isProduction) {
                // Always read fresh template in development
                template = await fs.promises.readFile('../../src/app-new/index.html', 'utf-8');
                template = await vite.transformIndexHtml(url, template);
                render = (await vite.ssrLoadModule('../../src/app-new/src/entry-server.tsx')).render;
            } else {
                template = templateHtml;
                render = (await import('../../dist/gsender/app-server/entry-server')).render;
            }

            const rendered = await render(url, ssrManifest);

            const html = template
                .replace('<!--app-head-->', rendered.head ?? '')
                .replace('<!--app-html-->', rendered.html ?? '');

            res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        } catch (e) {
            // eslint-disable-next-line no-unused-expressions
            vite?.ssrFixStacktrace(e);
            console.log(e.stack);
            res.status(500).end(e.stack);
        }
    });
};
