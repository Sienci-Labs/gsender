import pubsub from 'pubsub-js';

import type { AccessoryConnectivityToastEntry } from './AccessoryConnectivityToastHost';

let toastCounter = 0;

export function showAccessoryConnectivityToast(
    accessoryName: string,
    status: 'connected' | 'disconnected',
): void {
    const entry: AccessoryConnectivityToastEntry = {
        id: `accessory-toast-${++toastCounter}`,
        accessoryName,
        status,
    };
    pubsub.publish('accessoryConnectivity:toast', entry);
}
