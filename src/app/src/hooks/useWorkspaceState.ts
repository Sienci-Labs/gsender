import { useState, useEffect } from 'react';
import isEqual from 'lodash/isEqual';

import store from 'app/store';
import { State } from 'app/store/definitions';

export const useWorkspaceState = () => {
    const [workspace, setWorkspace] = useState<State['workspace']>(
        store.get('workspace'),
    );

    useEffect(() => {
        const callback = (data: State) => {
            if (isEqual(workspace, data.workspace)) {
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
