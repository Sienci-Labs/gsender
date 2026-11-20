/*
 * Machine states for screen captures (--modes): the app is put into each
 * state through its own Redux store, the way .storybook/machine-state.js
 * does for stories, and the screen is captured once per state. The Figma
 * plugin's playground then switches the whole screen between them.
 *
 * While states are being captured, what the real machine reports (status,
 * workflow, connection, file) is held back so it doesn't overwrite them;
 * afterwards the app gets the machine's own state back.
 */

// A job 30% of the way through, as JobControl's stories show it.
const FILE = { name: 'sign-carving.nc', total: 4000 };
const SENDER = {
    sent: 1200,
    received: 1190,
    total: 4000,
    currentLineRunning: 1200,
    elapsedTime: 6 * 60 * 1000,
    remainingTime: 14 * 60,
};

// label, connection, controller activeState, workflow, job in progress,
// extra status fields
export const MODES = {
    idle: { label: 'Idle', connected: true, active: 'Idle', workflow: 'idle' },
    running: { label: 'Running', connected: true, active: 'Run', workflow: 'running', job: true },
    hold: { label: 'Hold', connected: true, active: 'Hold', workflow: 'paused', job: true, status: { subState: 0 } },
    alarm: { label: 'Alarm', connected: true, active: 'Alarm', workflow: 'idle', status: { alarmCode: 1 } },
    disconnected: { label: 'Disconnected', connected: false, active: '', workflow: 'idle' },
};

export const MODE_ORDER = ['idle', 'running', 'hold', 'alarm', 'disconnected'];

// "all" or a comma list → known mode names, in MODE_ORDER.
export function parseModes(value) {
    if (!value) return [];
    const asked = String(value)
        .split(',')
        .map((m) => m.trim().toLowerCase())
        .filter(Boolean);
    const list = asked.includes('all') ? MODE_ORDER : asked;
    const bad = list.filter((m) => !MODES[m]);
    if (bad.length)
        throw new Error(`Unknown machine state(s): ${bad.join(', ')}. Use ${MODE_ORDER.join(', ')} or all.`);
    return MODE_ORDER.filter((m) => list.includes(m));
}

// In the page: find the Redux store on the React tree and, the first time,
// hold back what the machine reports. Returns false if there is no store.
const FIND_STORE = `
    const findStore = () => {
        if (window.__l2fStore) return window.__l2fStore;
        const isRoot = (e) => Object.keys(e).some((k) => k.startsWith('__reactContainer$'));
        const root = [...document.querySelectorAll('body > *, body > * > *')].find(isRoot);
        const key = root && Object.keys(root).find((k) => k.startsWith('__reactContainer$'));
        let queue = key ? [root[key]] : [];
        for (let seen = 0; queue.length && seen < 20000; seen++) {
            const f = queue.shift();
            const p = f && f.memoizedProps;
            if (p && p.store && typeof p.store.getState === 'function' && typeof p.store.dispatch === 'function')
                return (window.__l2fStore = p.store);
            if (f && f.child) queue.push(f.child);
            if (f && f.sibling) queue.push(f.sibling);
        }
        return null;
    };`;

// Some widgets (the connection button, the status pill) listen to gSender's
// controller object rather than the store. In a Vite dev build the page can
// import the very module the app uses and fire its events.
const CONTROLLER = `
    const controllerModule = async () => {
        const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\\/src\\/lib\\/controller\\.ts(\\?|$)/.test(n));
        if (!url) return null;
        try {
            return (await import(url)).default;
        } catch (e) {
            return null;
        }
    };
    const fire = (ctl, event, ...args) => {
        const list = ctl && ctl.listeners && ctl.listeners[event];
        if (Array.isArray(list)) list.slice().forEach((fn) => { try { fn(...args); } catch (e) {} });
    };`;

const HELD = /^(controller\/(updateControllerState|updateWorkflowState|updateSenderStatus)|connection\/|fileInfo\/)/;

// JavaScript that puts the app into `mode`.
export function applyModeScript(mode) {
    const m = MODES[mode];
    return `(async () => {${FIND_STORE}${CONTROLLER}
    const store = findStore();
    if (!store) return false;
    if (!window.__l2fModes) {
        const real = store.dispatch;
        const held = ${HELD};
        const ctl = await controllerModule();
        window.__l2fModes = { real, base: store.getState(), ctl, port: ctl && ctl.port };
        store.dispatch = (a) =>
            a && typeof a === 'object' && typeof a.type === 'string' && held.test(a.type) ? a : real(a);
    }
    const { real, base } = window.__l2fModes;
    const send = (type, payload) => real({ type, payload });
    const m = ${JSON.stringify({ ...m, file: FILE, sender: SENDER })};
    const c = base.controller || {};
    const prev = (c.state && c.state.status) || {};
    send('connection/setConnectionState', { isConnected: m.connected });
    // The full shape the server reports, as .storybook/machine-state.js
    // gives it: components read pinState, positions and SD unguarded.
    const origin = { x: 0, y: 0, z: 0, a: 0, b: 0, c: 0 };
    const type = m.connected ? c.type || 'grblHAL' : '';
    send('controller/updateControllerState', {
        type,
        state: Object.assign({ parserstate: { modal: {} }, axes: { axes: ['X', 'Y', 'Z'] } }, c.state, {
            status: Object.assign(
                { mpos: origin, wpos: origin, feedrate: 0, pinState: {} },
                type === 'grblHAL' ? { SD: { name: null, percentage: 0 } } : {},
                prev,
                { activeState: m.active, alarmCode: undefined },
                m.status || {},
            ),
        }),
    });
    send('controller/updateWorkflowState', { state: m.workflow });
    const hadFile = base.fileInfo && base.fileInfo.fileLoaded;
    if (m.job && !hadFile) send('fileInfo/updateFileInfo', m.file);
    if (!m.job && !hadFile) send('fileInfo/unloadFileInfo');
    send('controller/updateSenderStatus', { status: m.job ? Object.assign({ startTime: Date.now() - m.sender.elapsedTime }, m.sender) : null });
    const ctl = window.__l2fModes.ctl;
    if (ctl) {
        const now = store.getState().controller;
        if (m.connected) {
            if (!ctl.port) ctl.port = 'COM3';
            fire(ctl, 'serialport:openController', ctl.port);
            ctl.type = now.type;
            ctl.state = Object.assign({}, now.state);
            fire(ctl, 'controller:state', now.type, ctl.state);
        } else {
            fire(ctl, 'serialport:close', { port: ctl.port });
        }
    }
    return true;
})()`;
}

// JavaScript that gives the app the machine's own state back.
export const RESTORE_SCRIPT = `(async () => {${CONTROLLER}
    const s = window.__l2fModes;
    const store = window.__l2fStore;
    if (!s || !store) return false;
    store.dispatch = s.real;
    const b = s.base;
    const send = (type, payload) => s.real({ type, payload });
    send('connection/setConnectionState', { isConnected: !!(b.connection && b.connection.isConnected) });
    if (b.controller) {
        send('controller/updateControllerState', { type: b.controller.type, state: b.controller.state });
        send('controller/updateWorkflowState', { state: (b.controller.workflow && b.controller.workflow.state) || 'idle' });
        send('controller/updateSenderStatus', { status: (b.controller.sender && b.controller.sender.status) || null });
    }
    if (!(b.fileInfo && b.fileInfo.fileLoaded)) send('fileInfo/unloadFileInfo');
    if (s.ctl) {
        s.ctl.port = s.port;
        if (b.connection && b.connection.isConnected) {
            fire(s.ctl, 'serialport:openController', s.port);
            fire(s.ctl, 'controller:state', b.controller.type, b.controller.state);
        } else fire(s.ctl, 'serialport:close', { port: s.port });
    }
    delete window.__l2fModes;
    return true;
})()`;
