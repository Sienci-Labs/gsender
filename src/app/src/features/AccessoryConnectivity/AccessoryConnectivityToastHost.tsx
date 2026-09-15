import { TOASTER_DEFAULT } from 'app/lib/toaster/ToasterLib';
import pubsub from 'pubsub-js';
import { useEffect, useState } from 'react';

import { AccessoryConnectivityToast } from './AccessoryConnectivityToast';

export interface AccessoryConnectivityToastEntry {
    id: string;
    accessoryName: string;
    status: 'connected' | 'disconnected';
}

export function AccessoryConnectivityToastHost() {
    const [toasts, setToasts] = useState<AccessoryConnectivityToastEntry[]>([]);

    const dismiss = (id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    };

    useEffect(() => {
        const token = pubsub.subscribe(
            'accessoryConnectivity:toast',
            (_msg: string, entry: AccessoryConnectivityToastEntry) => {
                setToasts((current) => [...current, entry]);
            },
        );
        return () => pubsub.unsubscribe(token);
    }, []);

    useEffect(() => {
        const timers = toasts.map((toast) =>
            setTimeout(() => dismiss(toast.id), TOASTER_DEFAULT),
        );
        return () => {
            timers.forEach(clearTimeout);
        };
    }, [toasts]);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-3 p-4">
            {toasts.map((toast) => (
                <AccessoryConnectivityToast
                    key={toast.id}
                    status={toast.status}
                    accessoryName={toast.accessoryName}
                    onDismiss={() => dismiss(toast.id)}
                />
            ))}
        </div>
    );
}
