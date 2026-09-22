import { useEffect, useSyncExternalStore } from 'react';
import { getMessages, subscribe } from './consoleStore';
import { startConsoleIngest } from './consoleIngest';
import type { ConsoleMessage } from './definitions';

/**
 * Subscribes a view to the shared console stream. Mounting a second view (the
 * pop-out) attaches no additional controller listeners and creates no second
 * message history.
 */
export function useConsoleMessages(): ConsoleMessage[] {
    useEffect(() => startConsoleIngest(), []);

    return useSyncExternalStore(subscribe, getMessages, getMessages);
}
