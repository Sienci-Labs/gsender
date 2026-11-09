import { i18n } from 'app/i18n';
import { toast } from 'app/lib/toaster';
import pubsub from 'pubsub-js';
import api from '../api';
import store, { merge } from '../store';
import defaultState from '../store/defaultState';
import { migrateValues } from '../store/valueMigrations';

export const restoreDefault = async (): Promise<void> => {
    await api.events.clearAll();

    restoreSettings(defaultState);
};

const restoreSettings = (state: object, isSync?: boolean): void => {
    store.restoreState(state, () => {
        setTimeout(() => {
            pubsub.publish('repopulate');
            toast.success(i18n.t('notifications:settings.restored'), {
                position: 'bottom-right',
            });
        }, 50);
    });
};

// exports are { settings, events }
// backups are { version, state }
// TODO: backups written between MI-2255 and the server preferences store are
// double-wrapped ({ state: { version, state } }). drop this unwrap once those age out
export const extractSettings = (data: any) => {
    const settings = data?.settings || data?.state;
    if (settings?.state && !settings.workspace) {
        return settings.state;
    }
    return settings;
};

export const storeUpdate = async (
    content: string,
    isSync?: boolean,
): Promise<void> => {
    try {
        const parsed = JSON.parse(content);

        /*await new Promise((resolve, _reject) => {
            // delete all old events
            const res = api.events.clearAll();
            resolve(res);
        }).then((_result) => {
            Promise.all([
                Object.entries(events).map(([_key, event]) =>
                    api.events.create(event),
                ),
            ]);
        });*/

        const rawSettings = extractSettings(parsed);
        // fix old values (e.g. lowercase projection, legacy touchplate type) the same
        // way startup does, since imports skip the startup normalization
        const mergedSettings = migrateValues(
            merge(JSON.parse(JSON.stringify(defaultState)), rawSettings),
        );

        const currentTheme = store.get('widgets.visualizer.theme');
        const nextTheme = mergedSettings?.widgets?.visualizer?.theme;

        restoreSettings(mergedSettings, isSync);

        if (nextTheme && nextTheme !== currentTheme) {
            pubsub.publish('theme:change', nextTheme);
        }
    } catch (error) {
        console.error(error);
        /**
         *  Possible errors:
         *  1. JSON.parse(content) could not execute
         */
        return;
    }
};
