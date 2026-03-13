import store, { merge } from '../store';
import defaultState from '../store/defaultState';
import api from '../api';
import { toast } from 'app/lib/toaster';
import pubsub from "pubsub-js";
import {
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_ZERO,
    TOUCHPLATE_TYPE_3D,
    TOUCHPLATE_TYPE_BITZERO,
} from './constants';

export const restoreDefault = async (): Promise<void> => {
    await api.events.clearAll();

    restoreSettings(defaultState);
};

const restoreSettings = (state: object, isSync?: boolean): void => {
    store.restoreState(state, () => {
        setTimeout(() => {
            pubsub.publish('repopulate');
            toast.success('Settings restored', { position: 'bottom-right' });
        }, 50)

    });

};

export const storeUpdate = async (
    content: string,
    isSync?: boolean,
): Promise<void> => {
    try {
        const { settings, events = [], state } = JSON.parse(content);

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

        const rawSettings = settings || state;
        const mergedSettings = merge(JSON.parse(JSON.stringify(defaultState)), rawSettings);

        // Normalize touchplate type — older settings files may store 'AutoZero Touchplate'
        // which no longer matches any valid option, causing the Config dropdown to appear blank.
        const VALID_TOUCHPLATE_TYPES = [
            TOUCHPLATE_TYPE_STANDARD,
            TOUCHPLATE_TYPE_AUTOZERO,
            TOUCHPLATE_TYPE_ZERO,
            TOUCHPLATE_TYPE_3D,
            TOUCHPLATE_TYPE_BITZERO,
        ];
        const touchplateType = mergedSettings?.workspace?.probeProfile?.touchplateType;
        if (touchplateType === 'AutoZero Touchplate') {
            mergedSettings.workspace.probeProfile.touchplateType = TOUCHPLATE_TYPE_AUTOZERO;
        } else if (!VALID_TOUCHPLATE_TYPES.includes(touchplateType)) {
            mergedSettings.workspace.probeProfile.touchplateType = TOUCHPLATE_TYPE_STANDARD;
        }

        restoreSettings(mergedSettings, isSync);
    } catch (error) {
        console.error(error);
        /**
         *  Possible errors:
         *  1. JSON.parse(content) could not execute
         */
        return;
    }
};
