import http from 'node:http';
import https from 'node:https';

const target = new URL(process.argv[2]);
const client = target.protocol === 'https:' ? https : http;

function waitForUrl() {
    const request = client.get(target, (response) => {
        response.resume();

        if (response.statusCode >= 200 && response.statusCode < 400) {
            process.exit(0);
        }

        setTimeout(waitForUrl, 200);
    });

    request.setTimeout(1000, () => request.destroy());
    request.on('error', () => setTimeout(waitForUrl, 200));
}

waitForUrl();
