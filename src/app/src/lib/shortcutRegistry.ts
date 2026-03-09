import { useState, useEffect } from 'react';
import { ShuttleEvent, ShuttleControlEvents } from './definitions/shortcuts';

class ShortcutRegistry {
    private activeEvents: Map<string, ShuttleEvent> = new Map();
    private listeners: Set<() => void> = new Set();

    register(events: ShuttleControlEvents) {
        Object.entries(events).forEach(([name, event]) => {
            if (typeof event !== 'function') {
                this.activeEvents.set(name, event);
            }
        });
        this.notify();
    }

    unregister(events: ShuttleControlEvents) {
        Object.keys(events).forEach((name) => {
            this.activeEvents.delete(name);
        });
        this.notify();
    }

    getActiveEvents(): ShuttleEvent[] {
        return Array.from(this.activeEvents.values());
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach((l) => l());
    }
}

export const shortcutRegistry = new ShortcutRegistry();

export const useActiveShortcuts = () => {
    const [shortcuts, setShortcuts] = useState<ShuttleEvent[]>(shortcutRegistry.getActiveEvents());

    useEffect(() => {
        return shortcutRegistry.subscribe(() => {
            setShortcuts(shortcutRegistry.getActiveEvents());
        });
    }, []);

    return shortcuts;
};
