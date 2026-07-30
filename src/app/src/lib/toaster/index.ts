import { toast as sonnerToast } from 'sonner';
import uuid from 'uuid';
import get from 'lodash/get';

import store from 'app/store';
import { Notification } from 'app/workspace/definitions';
import reduxStore from 'app/store/redux';
import { setNotifications } from 'app/store/redux/slices/preferences.slice';
import {
    TOASTER_DEFAULT,
    TOASTER_DISABLED,
    TOASTER_UNTIL_CLOSE,
} from './ToasterLib';

type SonnerToastType = typeof sonnerToast;

const getToastDuration = (options: Record<string, any> = {}) => {
    // Get the configured duration from workspace store settings
    let duration: number = store.get('workspace.toastDuration');

    // Set duration to default if configured to 0 (use library default)
    if (duration === 0) {
        duration = options.duration ?? TOASTER_DEFAULT;
    }

    // Set duration to Infinity if configured to stay until manually closed
    if (duration === TOASTER_UNTIL_CLOSE) {
        duration = Infinity;
    }

    // TOASTER_DISABLED is handled in the proxy to skip showing the toast entirely

    return {
        ...options,
        duration: duration,
    };
};

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
                const options = args[1] || {};

                saveNotificationToStore({
                    message: notificationText,
                    type: prop as Notification['type'],
                });

                args[1] = getToastDuration(options);

                // Disable the toast if duration is TOASTER_DISABLED
                if (args[1].duration === TOASTER_DISABLED) {
                    return;
                }

                // Call the original method with updated args
                return Reflect.apply(target[prop], target, args);
            };
        }
        return target[prop]; // Return the property if it doesn't match
    },
    apply(target, _, args) {
        const notificationText: string = args[0];
        const options = args[1] || {};

        saveNotificationToStore({
            message: notificationText,
            type: 'info',
        });

        args[1] = getToastDuration(options);

        // Disable the toast if duration is TOASTER_DISABLED
        if (args[1].duration === TOASTER_DISABLED) {
            return;
        }

        return Reflect.apply(target.info, undefined, args);
    },
};

// Create a proxied version of the toast object
export const toast = new Proxy(sonnerToast, toastHandler);
