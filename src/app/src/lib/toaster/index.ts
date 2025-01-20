import { toast as sonnerToast } from 'sonner';
import uuid from 'uuid';
import get from 'lodash/get';

import { Notification } from 'app/workspace/definitions';
import reduxStore from 'app/store/redux';
import { setNotifications } from 'app/store/redux/slices/preferences.slice';

type SonnerToastType = typeof sonnerToast;

const saveNotificationToStore = ({
    message,
    type,
}: Pick<Notification, 'message' | 'type'>) => {
    const NOTIFICATIONS_LIST_LIMIT = 100;

    const existingNotifications = get(
        reduxStore.getState(),
        'preferences.notifications',
        [],
    );

    const notifications: Notification[] = [...existingNotifications];

    if (notifications.length >= NOTIFICATIONS_LIST_LIMIT) {
        notifications.shift();
    }

    notifications.push({
        message,
        type,
        status: 'unread',
        timestamp: new Date().toISOString(),
        id: uuid.v4(),
    });

    reduxStore.dispatch(setNotifications(notifications));
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
