// Spike S1 stubs for modules that can't load on Android (Electron, native
// serial/USB bindings). The bundle script aliases each module to the matching
// named export below. The server already guards most Electron usage with
// `&& app`, and S1 only measures startup, so serial and flashing just need to
// fail cleanly, as sidecar-main.js does for pkg builds.
const unavailable = (what) => new Error(`${what} is not available in the Android S1 build`);

class SerialPortStub {
    static list() {
        return Promise.resolve([]);
    }

    constructor() {
        throw unavailable('serialport');
    }
}

const noop = () => {};
const logFns = ['error', 'warn', 'info', 'verbose', 'debug', 'silly', 'log'];
const electronLog = Object.fromEntries(logFns.map((k) => [k, (...a) => console[k === 'silly' || k === 'verbose' ? 'debug' : k === 'log' ? 'log' : k](...a)]));
electronLog.transports = { file: { level: false, getFile: () => ({ path: '' }), resolvePath: noop }, console: { level: false } };
electronLog.catchErrors = noop;
electronLog.initialize = noop;
electronLog.scope = () => electronLog;

module.exports = {
    electron: { app: undefined, ipcMain: undefined },
    serialport: { SerialPort: SerialPortStub },
    usb: {
        findByIds: () => undefined,
        WebUSBDevice: { createInstance: () => Promise.reject(unavailable('usb')) },
    },
    avrgirl: function AvrgirlStub() {
        throw unavailable('@sienci/avrgirl-arduino');
    },
    electronLog,
    vite: {
        createServer: () => Promise.reject(unavailable('vite dev server')),
    },
};
