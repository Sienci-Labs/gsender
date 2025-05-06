import { useState, useEffect, useCallback } from 'react';
import isEqual from 'lodash/isEqual';

import store from 'app/store';
import { State } from 'app/store/definitions';

type WidgetKey = keyof State['widgets'];

// Create a singleton subscription manager for widgets
const widgetSubscription = {
    currentWidget: store.get('widgets', {}),
    listeners: new Map<WidgetKey, Set<(widget: any) => void>>(),
    initialized: false,

    init() {
        if (this.initialized) return;

        // Set up a single store listener
        store.on('change', (data: State) => {
            if (!data.widgets) {
                return;
            }

            // Deep compare the current and new widget state
            const isEqualResult = isEqual(this.currentWidget, data.widgets);

            if (isEqualResult) {
                return;
            }

            // Only update if there's an actual change
            this.currentWidget = data.widgets;

            // Notify all subscribers for each key that changed
            Object.entries(data.widgets).forEach(([key, value]) => {
                const widgetKey = key as WidgetKey;
                const keyListeners = this.listeners.get(widgetKey);
                if (keyListeners) {
                    keyListeners.forEach((listener) => {
                        listener(value);
                    });
                }
            });
        });

        this.initialized = true;
    },

    subscribe(key: WidgetKey, callback: (widget: any) => void) {
        this.init();

        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }

        const keyListeners = this.listeners.get(key);
        keyListeners?.add(callback);

        // Return unsubscribe function
        return () => {
            keyListeners?.delete(callback);
            if (keyListeners?.size === 0) {
                this.listeners.delete(key);
            }
        };
    },
};

export const useWidgetState = <K extends WidgetKey>(key: K) => {
    const initialValue = widgetSubscription.currentWidget[key];
    const [widget, setWidget] = useState<State['widgets'][K]>(initialValue);

    // Create a stable callback function that won't change on re-renders
    const updateWidget = useCallback(
        (newWidget: State['widgets'][K]) => {
            // Only update if there's an actual change
            if (!isEqual(widget, newWidget)) {
                setWidget(newWidget);
            }
        },
        [widget],
    );

    useEffect(() => {
        // Subscribe to widget changes for the specific key
        const unsubscribe = widgetSubscription.subscribe(key, updateWidget);

        // Clean up subscription when component unmounts
        return unsubscribe;
    }, [key, updateWidget]);

    return widget;
};
