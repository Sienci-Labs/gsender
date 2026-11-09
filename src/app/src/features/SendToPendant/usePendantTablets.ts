import api from 'app/api';
import controller from 'app/lib/controller.ts';
import { useCallback, useEffect, useState } from 'react';

export type PendantTablet = {
    id: string;
    name: string;
    host?: string;
    port?: number;
    key?: string;
    paired: boolean;
    online: boolean;
};

type DiscoveryState = {
    desktopId: string;
    browsing: boolean;
    tablets: PendantTablet[];
};

// The server stops browsing after 2 minutes without a request, so ping it a
// bit more often than that while the dialog is open.
const KEEPALIVE_MS = 60 * 1000;

const EMPTY: DiscoveryState = { desktopId: '', browsing: false, tablets: [] };

export function usePendantTablets(active: boolean) {
    const [state, setState] = useState<DiscoveryState>(EMPTY);

    const refresh = useCallback(async () => {
        try {
            const res = await api.pendantPairing.discover();
            setState(res.data);
        } catch {
            // Leave the last known list in place; manual entry still works.
        }
    }, []);

    useEffect(() => {
        if (!active) return undefined;

        refresh();
        const timer = setInterval(refresh, KEEPALIVE_MS);
        const onDiscovered = (next: DiscoveryState) => setState(next);
        controller.addListener('pendant:discovered', onDiscovered);

        return () => {
            clearInterval(timer);
            controller.removeListener('pendant:discovered', onDiscovered);
        };
    }, [active, refresh]);

    const forget = useCallback(
        async (id: string) => {
            await api.pendantPairing.forgetTablet(id);
            await refresh();
        },
        [refresh],
    );

    return { ...state, refresh, forget };
}
