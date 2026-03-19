import fs from 'fs';
import os from 'os';
import path from 'path';

const LOG_FILE = path.join(os.homedir(), 'gsender_ymodem_debug.log');

const debugLog = (msg) => {
    try {
        const line = `${new Date().toISOString()} ${msg}\n`;
        fs.appendFileSync(LOG_FILE, line);
    } catch (_) {
        // never throw
    }
};

export default debugLog;
