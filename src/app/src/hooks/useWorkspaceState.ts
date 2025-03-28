import { useState, useEffect, useRef, useCallback } from 'react';
import isEqual from 'lodash/isEqual';

import store from 'app/store';
import { State } from 'app/store/definitions';

// Create a singleton subscription manager
// This ensures we only have ONE listener to the store, regardless of how many components use the hook
const workspaceSubscription = {
    currentWorkspace: store.get('workspace', {}),
    listeners: new Set<(workspace: State['workspace']) => void>(),
    initialized: false,

    init() {
        if (this.initialized) return;

        // Set up a single store listener
        store.on('change', (data: State) => {
            if (
                !data.workspace ||
                isEqual(this.currentWorkspace, data.workspace)
            ) {
                return;
            }

            this.currentWorkspace = data.workspace;

            // Notify all subscribers
            this.listeners.forEach((listener) => {
                listener(this.currentWorkspace);
            });
        });

        this.initialized = true;
    },

    subscribe(callback: (workspace: State['workspace']) => void) {
        this.init();
        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    },
};

export const useWorkspaceState = () => {
    const [workspace, setWorkspace] = useState<State['workspace']>(
        workspaceSubscription.currentWorkspace,
    );

    // Create a stable callback function that won't change on re-renders
    const updateWorkspace = useCallback((newWorkspace: State['workspace']) => {
        setWorkspace(newWorkspace);
    }, []);

    useEffect(() => {
        // Subscribe to workspace changes
        const unsubscribe = workspaceSubscription.subscribe(updateWorkspace);

        // Clean up subscription when component unmounts
        return unsubscribe;
    }, [updateWorkspace]);

    return workspace;
};
