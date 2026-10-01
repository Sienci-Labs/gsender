// Spike S1 entry: starts the stock gSender server the same way bin/gsender
// does, then prints a machine-readable ready line with startup timing.
// Bundled by build-server-bundle.js into a single file for Android.
const startedAt = Date.now();
const { performance } = require('perf_hooks');

const launchServer = require('server-cli-entry');

launchServer()
    .then((data) => {
        const address = data && data.address ? `${data.address}:${data.port}` : '';
        const readyMs = Math.round(performance.now());
        console.log(
            `S1_READY ms=${readyMs} wall=${Date.now() - startedAt} node=${process.version} arch=${process.arch} platform=${process.platform} rss=${Math.round(process.memoryUsage().rss / 1048576)}MB addr=${address}`,
        );
    })
    .catch((err) => {
        console.error('S1_FAILED', err && (err.stack || err));
        process.exit(1);
    });
