import { useEffect } from 'react';

import combokeys from '../lib/combokeys';
import {
    ShuttleControlEvents,
    ShuttleEvent,
} from '../lib/definitions/shortcuts';

const useShuttleEvents = (shuttleControlEvents: ShuttleControlEvents) => {
    useEffect(() => {
        Object.keys(shuttleControlEvents).forEach((eventName: string) => {
            const callback = (shuttleControlEvents[eventName] as ShuttleEvent)
                .callback;
            combokeys.on(eventName, callback);
        });

        return () => {
            Object.keys(shuttleControlEvents).forEach((eventName) => {
                const callback = (
                    shuttleControlEvents[eventName] as ShuttleEvent
                ).callback;
                combokeys.removeListener(eventName, callback);
            });
        };
    }, []);
};

export default useShuttleEvents;
