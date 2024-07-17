import store from 'app/store';
import defaultState from 'app/store/defaultState';
import api from 'app/api';

export const restoreDefault = async () => {
    await api.events.clearAll();

    restoreSettings(defaultState);
};

const restoreSettings = (state, isSync) => {
    store.restoreState(state);

    // if this is being called for importing settings, need to reload
    // if sync, no reload needed
    if (!isSync) {
        setTimeout(() => {
            window.location.reload();
        }, 250);
    }
};

export const storeUpdate = async (content, isSync) => {
    try {
        const { settings, events = [], state } = JSON.parse(content);

        await new Promise((resolve, reject) => {
            // delete all old events
            const res = api.events.clearAll();
            resolve(res);
        }).then((result) => {
            Promise.all([
                Object.entries(events).map(([key, event]) => api.events.create(event))
            ]);
        });

        if (settings) {
            restoreSettings(settings, isSync);
        } else {
            restoreSettings(state, isSync);
        }
    } catch (error) {
        /**
         *  Possible errors:
         *  1. JSON.parse(content) could not execute
         */
        return;
    }
};
