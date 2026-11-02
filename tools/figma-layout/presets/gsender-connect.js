/*
 * Runs in the gSender page before capture (via `--setup`) so the UI shows a
 * connected machine: DROs, firmware-specific controls, EEPROM settings, etc.
 *
 * Uses the app's own controller through Vite's dev server, so it shares the
 * page's socket. If the backend is already connected to a machine (from this
 * or any other window), it leaves that connection alone.
 */
// biome-ignore lint/correctness/noUnusedVariables: called from the --setup string
async function l2fConnectMachine(host, ethernetPort) {
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
        controller = (await load('/src/lib/controller.ts')).default;
        store = (await load('/src/store/index.ts')).default;
    } catch (e) {
        console.warn(
            '[layout-to-figma] not a Vite dev build; skipping machine connection',
        );
        return;
    }

    // A fresh page learns about an existing connection over the socket.
    for (let i = 0; i < 10 && !controller.port; i++) await sleep(200);

    if (!controller.port) {
        const err = await new Promise((resolve) =>
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
            ),
        );
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
