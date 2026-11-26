import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    WORKFLOW_STATE_IDLE,
} from 'app/constants';
import controller from 'app/lib/controller';
import { store as reduxStore } from 'app/store/redux';
import { useSyncExternalStore } from 'react';

/**
 * Start from line runs a preamble (raise Z, restore spindle/coolant/modals,
 * move to the start position, spindle delay) through the feeder before the
 * server starts the workflow. This tracks that window so the pendant can show
 * the job layout straight away instead of sitting in Setup.
 *
 * Module-level so every consumer sees the same value, and the job:start event
 * is caught whatever happens to be mounted.
 */

/** Line the job will resume at while the setup moves run; null otherwise.
 * 0 means start from line is running but the server didn't say which line. */
let startLine: number | null = null;
const subscribers = new Set<() => void>();

// The preamble ends on %_GCODE_START, which starts the workflow. If the queue
// drains with the machine idle and no workflow, it was cut short (reset, or
// an error dropped the queue); allow for the status lag before giving up.
const DRAINED_GRACE_MS = 2000;
let drainedTimer: ReturnType<typeof setTimeout> | null = null;

function set(next: number | null) {
    if (drainedTimer) {
        clearTimeout(drainedTimer);
        drainedTimer = null;
    }
    if (next === startLine) return;
    startLine = next;
    subscribers.forEach((notify) => notify());
}

function checkStillStarting() {
    if (startLine === null) return;
    const state = reduxStore.getState();
    const workflowState = state.controller.workflow?.state;
    const activeState = state.controller.state?.status?.activeState;
    const feeder = state.controller.feeder?.status;

    if (
        !state.connection.isConnected ||
        !state.file.fileLoaded ||
        workflowState !== WORKFLOW_STATE_IDLE ||
        activeState === GRBL_ACTIVE_STATE_ALARM
    ) {
        // Workflow running means the job proper has begun
        set(null);
        return;
    }

    const drained =
        activeState === GRBL_ACTIVE_STATE_IDLE &&
        !feeder?.pending &&
        !(Number(feeder?.queue) > 0);
    if (drained && !drainedTimer) {
        drainedTimer = setTimeout(() => {
            drainedTimer = null;
            checkDrained();
        }, DRAINED_GRACE_MS);
    } else if (!drained && drainedTimer) {
        clearTimeout(drainedTimer);
        drainedTimer = null;
    }
}

function checkDrained() {
    if (startLine === null) return;
    const state = reduxStore.getState();
    const feeder = state.controller.feeder?.status;
    if (
        state.controller.workflow?.state === WORKFLOW_STATE_IDLE &&
        state.controller.state?.status?.activeState ===
            GRBL_ACTIVE_STATE_IDLE &&
        !feeder?.pending &&
        !(Number(feeder?.queue) > 0)
    ) {
        set(null);
    }
}

let installed = false;
function install() {
    if (installed) return;
    installed = true;

    controller.addListener(
        'job:start',
        (isStartFromLine: boolean, line?: number) => {
            set(isStartFromLine ? Number(line) || 0 : null);
            checkStillStarting();
        },
    );
    controller.addListener('job:stop', () => set(null));
    reduxStore.subscribe(checkStillStarting);
}

function subscribe(notify: () => void) {
    install();
    subscribers.add(notify);
    return () => {
        subscribers.delete(notify);
    };
}

const getSnapshot = () => startLine;

/** The start-from-line target while its setup moves run, else null. */
export function useStartingFromLine(): number | null {
    return useSyncExternalStore(subscribe, getSnapshot);
}
