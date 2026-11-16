/*
 * Runs in the gSender page before capture (via `--setup`) so the UI shows a
 * connected machine: DROs, firmware-specific controls, EEPROM settings, etc.
 *
 * Uses the app's own controller through Vite's dev server, so it shares the
 * page's socket. If the backend is already connected to a machine (from this
 * or any other window), it leaves that connection alone.
 *
 * `appSrc` is where the app's src/ is served from: `/src/` on the main app's
 * dev server. The pendant's dev server reaches it through its `app` alias,
 * outside its root, so there it's `/@fs/<repo>/src/app/src/`. It must be the
 * URL the page itself uses, or this gets a second controller of its own.
 */
// biome-ignore lint/correctness/noUnusedVariables: called from the --setup string
async function l2fConnectMachine(
    host,
    ethernetPort,
    appSrc = '/src/',
    viaWidget = false,
) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let controller;
    let store;
    try {
        // Outside Vite these paths don't exist; don't wait long to find out.
        const load = (p) =>
            Promise.race([
                import(p),
                sleep(5000).then(() => {
                    throw new Error(`timed out importing ${p}`);
                }),
            ]);
        controller = (await load(`${appSrc}lib/controller.ts`)).default;
        store = (await load(`${appSrc}store/index.ts`)).default;
    } catch (e) {
        console.warn(
            '[layout-to-figma] not a Vite dev build; skipping machine connection',
        );
        return;
    }

    // A fresh page learns about an existing connection over the socket.
    for (let i = 0; i < 10 && !controller.port; i++) await sleep(200);

    // The pendant's connection widget keeps its own state: it only shows
    // "connected" for a connection it opened. Ask it to connect, the way
    // the app's own reconnect requests do, and fall through to connecting
    // directly if it isn't there to answer.
    if (!controller.port && viaWidget) {
        const entry = performance
            .getEntriesByType('resource')
            .find((e) => /\/pubsub-js\.js/.test(e.name));
        if (entry) {
            try {
                // The same URL the app loaded, so it is the same instance.
                const pubsub = (await import(entry.name)).default;
                store.set('widgets.connection.port', host);
                store.set('widgets.connection.ethernetPort', ethernetPort);
                pubsub.publish('reconnect');
                for (let i = 0; i < 40 && !controller.port; i++)
                    await sleep(200);
            } catch (e) {
                console.warn('[layout-to-figma] widget connect failed', e);
            }
        }
    }

    if (!controller.port) {
        // No reply means the page has no working socket (a broken build).
        const err = await new Promise((resolve) => {
            setTimeout(() => resolve(new Error('no reply in 20s')), 20000);
            controller.openPort(
                host,
                {
                    baudrate: Number(
                        store.get('widgets.connection.baudrate', 115200),
                    ),
                    network: true,
                    ethernetPort,
                    defaultFirmware: store.get(
                        'workspace.defaultFirmware',
                        'grblHAL',
                    ),
                },
                resolve,
            );
        });
        if (err)
            throw new Error(
                `Could not connect to ${host}:${ethernetPort}: ${err.message || err}`,
            );
    }

    // Wait for the first status report and the firmware settings dump.
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        const status = controller.state && controller.state.status;
        const settings = controller.settings && controller.settings.settings;
        if (
            status &&
            status.activeState &&
            settings &&
            Object.keys(settings).length
        ) {
            return;
        }
        await sleep(250);
    }
    console.warn(
        '[layout-to-figma] connected, but status/settings did not arrive within 15s',
    );
}
