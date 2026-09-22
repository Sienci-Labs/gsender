import type { ConsoleMessage, ConsoleMessageType } from './definitions';

/**
 * Matches the old xterm scrollback, so popping the console out or switching
 * tabs shows the same depth of history users had before.
 */
export const CONSOLE_HISTORY_LIMIT = 1000;

/**
 * A streaming job can produce hundreds of lines in a few milliseconds. Writes
 * are queued and flushed on a timer so React re-renders a batch at a time
 * rather than once per line.
 *
 * A timer rather than requestAnimationFrame: rAF stops entirely while the
 * window is hidden or occluded, which would stall a backgrounded pop-out and
 * let the queue grow for as long as it stayed hidden.
 */
const FLUSH_INTERVAL_MS = 30;

type Listener = () => void;

let messages: ConsoleMessage[] = [];
let pending: ConsoleMessage[] = [];
let flushHandle: ReturnType<typeof setTimeout> | null = null;
let nextId = 0;

const listeners = new Set<Listener>();

function emit(): void {
    for (const listener of listeners) {
        listener();
    }
}

function flush(): void {
    flushHandle = null;

    if (pending.length === 0) {
        return;
    }

    const incoming = pending;
    pending = [];

    const next = messages.concat(incoming);
    messages =
        next.length > CONSOLE_HISTORY_LIMIT
            ? next.slice(next.length - CONSOLE_HISTORY_LIMIT)
            : next;

    emit();
}

function scheduleFlush(): void {
    if (flushHandle !== null) {
        return;
    }

    flushHandle = setTimeout(flush, FLUSH_INTERVAL_MS);
}

function cancelScheduledFlush(): void {
    if (flushHandle === null) {
        return;
    }

    clearTimeout(flushHandle);
    flushHandle = null;
}

export interface ConsoleWriteOptions {
    message: string;
    type?: ConsoleMessageType;
}

/**
 * Append a line to the console. Callers pass the type because they know why
 * the line is being written; the renderer never re-derives it from the text.
 *
 * Untyped writes fall back to 'response' so existing call sites keep working.
 */
export function consoleWrite(
    input: string | ConsoleWriteOptions,
    type?: ConsoleMessageType,
): void {
    const message = typeof input === 'string' ? input : input.message;

    if (!message) {
        return;
    }

    const resolvedType =
        (typeof input === 'string' ? type : (input.type ?? type)) ?? 'response';

    nextId += 1;

    pending.push({
        id: `${nextId}`,
        message,
        type: resolvedType,
    });

    // Timers are throttled to about once a second while the window is hidden,
    // so a job streaming in the background can queue a lot between flushes.
    // Anything beyond the history limit is going to be trimmed on arrival.
    if (pending.length > CONSOLE_HISTORY_LIMIT) {
        pending = pending.slice(pending.length - CONSOLE_HISTORY_LIMIT);
    }

    scheduleFlush();
}

export function clearConsole(): void {
    cancelScheduledFlush();
    pending = [];
    messages = [];
    emit();
}

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Stable reference between flushes, which is what useSyncExternalStore needs
 * to avoid re-rendering on every subscriber check.
 */
export function getMessages(): ConsoleMessage[] {
    return messages;
}

/** Test seam - flushes queued writes synchronously. */
export function flushConsoleWrites(): void {
    cancelScheduledFlush();
    flush();
}
