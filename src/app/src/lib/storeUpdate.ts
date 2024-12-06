import store from '../store';
import defaultState from '../store/defaultState';
import api from '../api';

export const restoreDefault = async (): Promise<void> => {
    await api.events.clearAll();

    restoreSettings(defaultState);
};

const restoreSettings = (state: object, isSync?: boolean): void => {
    store.restoreState(state);

    // if this is being called for importing settings, need to reload
    // if sync, no reload needed
    if (!isSync) {
        setTimeout(() => {
            window.location.reload();
        }, 250);
    }
};

export const storeUpdate = async (
    content: string,
    isSync?: boolean,
): Promise<void> => {
    try {
        const { settings, events = [], state } = JSON.parse(content);
        console.log(settings);

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

        if (settings) {
            restoreSettings(settings, isSync);
        } else {
            restoreSettings(state, isSync);
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
