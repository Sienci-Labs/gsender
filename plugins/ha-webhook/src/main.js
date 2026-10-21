import { storage, subscribeSelector } from '@sienci/gsender-plugin-sdk';

import './style.css';

// Sample plugin: forwards gSender machine/job events to a Home Assistant
// webhook trigger. It only *reads* state (redux:read + storage), so it can
// never move the machine.
//
// This runs inside a Tools-panel tab. gSender keeps inactive tabs mounted, so
// it keeps reporting while you're on another tab or page — but only while the
// gSender UI is open. Every open gSender window runs its own copy.

const DEFAULTS = { url: '', format: 'form', interval: 30, enabled: false };

let settings = { ...DEFAULTS };
let status = {
    connected: false,
    machineState: 'Unknown',
    alarmCode: '',
    workflowState: 'idle',
    file: null,
    received: 0,
    total: 0,
    elapsedTime: 0,
    remainingTime: 0,
};
let progressTimer = null;

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

const progressPercent = () =>
    status.total > 0 ? Math.round((status.received / status.total) * 100) : 0;

// Flat on purpose: form-encoded bodies can't nest, and flat keys are easy to
// use in HA templates ({{ trigger.data.machine_state }} / trigger.json...).
const buildPayload = (event) => ({
    event,
    timestamp: new Date().toISOString(),
    connected: String(status.connected),
    machine_state: status.machineState,
    alarm_code: status.alarmCode || '',
    job_state: status.workflowState,
    file: status.file || '',
    progress: String(progressPercent()),
    lines_received: String(status.received),
    lines_total: String(status.total),
    elapsed_s: String(Math.round(status.elapsedTime / 1000)),
    remaining_s: String(Math.round(status.remainingTime / 1000)),
});

const send = async (event, { force = false } = {}) => {
    if (!settings.url || (!settings.enabled && !force)) {
        return;
    }

    const payload = buildPayload(event);

    try {
        if (settings.format === 'json') {
            // Normal CORS request: HA must list gSender's origin in
            // http: cors_allowed_origins, otherwise the browser blocks it.
            const res = await fetch(settings.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            log(event, `HTTP ${res.status}`, !res.ok);
        } else {
            // Form-encoded is a CORS "simple" request, so no-cors mode can
            // deliver it without any HA config. The trade-off: the response
            // is opaque, so we can't tell whether HA accepted it.
            await fetch(settings.url, {
                method: 'POST',
                mode: 'no-cors',
                body: new URLSearchParams(payload),
            });
            log(event, 'sent (no-cors, response not visible)');
        }
    } catch (err) {
        log(event, err instanceof Error ? err.message : String(err), true);
    }
};

// ---------------------------------------------------------------------------
// Watching gSender state
// ---------------------------------------------------------------------------

const onWorkflowChange = (prev, next) => {
    if (prev === next) {
        return;
    }
    if (prev === 'idle' && next === 'running') {
        send('job_started');
    } else if (prev === 'running' && next === 'paused') {
        send('job_paused');
    } else if (prev === 'paused' && next === 'running') {
        send('job_resumed');
    } else if (next === 'idle') {
        const finished = status.total > 0 && status.received >= status.total;
        send(finished ? 'job_finished' : 'job_stopped');
    }
    updateProgressTimer();
};

const updateProgressTimer = () => {
    clearInterval(progressTimer);
    progressTimer = null;
    if (status.workflowState === 'running' && settings.interval > 0) {
        progressTimer = setInterval(
            () => send('job_progress'),
            settings.interval * 1000,
        );
    }
};

// The first callback for each selector is the current value, not a change, so
// `initial` lets handlers record it without sending — otherwise opening
// gSender would fire "connected"/"machine_state" events at HA.
const watch = (selector, onChange) => {
    let initial = true;
    subscribeSelector(selector, (value) => {
        onChange(value, initial);
        initial = false;
        renderStatus();
    });
};

const startWatching = () => {
    watch(
        (s) => s.connection?.isConnected ?? false,
        (connected, initial) => {
            status.connected = connected;
            if (!initial) send(connected ? 'connected' : 'disconnected');
        },
    );

    watch(
        (s) => s.controller?.state?.status?.activeState || 'Unknown',
        (machineState, initial) => {
            const prev = status.machineState;
            status.machineState = machineState;
            if (initial || prev === machineState) return;
            send(machineState === 'Alarm' ? 'alarm' : 'machine_state');
        },
    );

    watch(
        (s) => s.controller?.state?.status?.alarmCode || '',
        (alarmCode) => {
            status.alarmCode = alarmCode;
        },
    );

    watch(
        (s) => s.file?.name ?? null,
        (file) => {
            status.file = file;
        },
    );

    // Sender status changes many times a second while running — just keep the
    // latest numbers; they're sent with events and on the progress timer.
    watch(
        (s) => s.controller?.sender?.status,
        (sender) => {
            status.received = sender?.received ?? 0;
            status.total = sender?.total ?? 0;
            status.elapsedTime = sender?.elapsedTime ?? 0;
            status.remainingTime = sender?.remainingTime ?? 0;
        },
    );

    // Registered last so job_finished sees up-to-date line counts.
    watch(
        (s) => s.controller?.workflow?.state || 'idle',
        (workflowState, initial) => {
            const prev = status.workflowState;
            status.workflowState = workflowState;
            if (initial) {
                // Opened mid-job: start progress updates without a job_started
                updateProgressTimer();
            } else {
                onWorkflowChange(prev, workflowState);
            }
        },
    );
};

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

const renderStatus = () => {
    $('s-connected').textContent = status.connected ? 'Yes' : 'No';
    $('s-state').textContent = status.alarmCode
        ? `${status.machineState} (${status.alarmCode})`
        : status.machineState;
    $('s-job').textContent = status.file
        ? `${status.workflowState} — ${status.file}`
        : status.workflowState;
    $('s-progress').textContent =
        status.total > 0 ? `${progressPercent()}%` : '—';
};

const log = (event, detail, isError = false) => {
    const list = $('log');
    list.querySelector('.muted')?.remove();
    const item = document.createElement('li');
    item.className = isError ? 'error' : '';
    item.textContent = `${new Date().toLocaleTimeString()}  ${event}  ${detail}`;
    list.prepend(item);
    while (list.children.length > 20) {
        list.lastChild.remove();
    }
};

const loadSettings = async () => {
    settings = { ...DEFAULTS, ...(await storage.get('settings', DEFAULTS)) };
    $('url').value = settings.url;
    $('format').value = settings.format;
    $('interval').value = String(settings.interval);
    $('enabled').checked = settings.enabled;
};

$('save').addEventListener('click', async () => {
    settings = {
        url: $('url').value.trim(),
        format: $('format').value,
        interval: Math.max(0, Number($('interval').value) || 0),
        enabled: $('enabled').checked,
    };
    await storage.set('settings', settings);
    updateProgressTimer();
    log('settings', 'saved');
});

$('test').addEventListener('click', () => send('test', { force: true }));

const init = async () => {
    await loadSettings();
    startWatching();
    renderStatus();
};

init();
