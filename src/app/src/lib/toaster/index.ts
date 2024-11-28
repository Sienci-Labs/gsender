import { toast as sonnerToast } from 'sonner';
import uuid from 'uuid';

import store from 'app/store';
import { Notification } from 'app/workspace/definitions';

type SonnerToastType = typeof sonnerToast;

const saveNotificationToStore = ({
    message,
    type,
}: Pick<Notification, 'message' | 'type'>) => {
    const NOTIFICATIONS_LIST_LIMIT = 100;

    const existingNotifications: Notification[] = store.get(
        'workspace.notifications',
        [],
    );

    const notifications = [...existingNotifications];

    if (notifications.length >= NOTIFICATIONS_LIST_LIMIT) {
        notifications.shift();
    }

    notifications.push({
        message,
        type,
        status: 'unread',
        timestamp: new Date(),
        id: uuid.v4(),
    });

    store.replace('workspace.notifications', notifications);
};

// Create a handler for the proxy
const toastHandler: ProxyHandler<SonnerToastType> = {
    get(target, prop: keyof SonnerToastType) {
        // Check if the property exists on the target
        if (prop in target) {
            return function (...args: any[]) {
                const notificationText: string = args[0];

                saveNotificationToStore({
                    message: notificationText,
                    type: prop as Notification['type'],
                });
                // Call the original method
                return Reflect.apply(target[prop], target, args);
            };
        }
        return target[prop]; // Return the property if it doesn't match
    },
    apply(target, _, args) {
        const notificationText: string = args[0];

        saveNotificationToStore({
            message: notificationText,
            type: 'info',
        });

        return Reflect.apply(target.info, undefined, args);
    },
};

// Create a proxied version of the toast object
export const toast = new Proxy(sonnerToast, toastHandler);
