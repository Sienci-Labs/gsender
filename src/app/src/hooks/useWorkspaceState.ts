import { useState, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';

import store from 'app/store';
import { State } from 'app/store/definitions';

export const useWorkspaceState = () => {
    const [workspace, setWorkspace] = useState<State['workspace']>(
        store.get('workspace', {}),
    );

    // Use a ref to track the latest workspace value without triggering effect reruns
    const workspaceRef = useRef(workspace);

    useEffect(() => {
        workspaceRef.current = workspace;
    }, [workspace]);

    useEffect(() => {
        const callback = (data: State) => {
            if (isEqual(workspaceRef.current, data.workspace)) {
                return;
            }

            setWorkspace(data.workspace);
        };

        store.on('change', callback);

        return () => {
            store.off('change', callback);
        };
    }, []);

    return workspace;
};
