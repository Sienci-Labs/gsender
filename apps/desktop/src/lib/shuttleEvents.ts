import React from 'react';

import { ShuttleControlEvents, ShuttleEvent } from './definitions/shortcuts';
import combokeys from './combokeys';

class ShuttleEvents extends React.PureComponent {
    allShuttleControlEvents: ShuttleControlEvents = { MACRO: function () {} };

    updateShuttleEvents(shuttleControlEvents: ShuttleControlEvents): void {
        Object.keys(shuttleControlEvents).forEach((eventName) => {
            this.allShuttleControlEvents[eventName] =
                shuttleControlEvents[eventName]!;
        });
    }

    getEvent(key: string): ShuttleEvent {
        if (key === undefined) {
            throw new Error('Key not provided');
        }

        return this.allShuttleControlEvents[key] as ShuttleEvent;
    }
}

const shuttleEvents = new ShuttleEvents({});

export const registerShuttleEvents = (
    shuttleControlEvents: ShuttleControlEvents,
) => {
    Object.keys(shuttleControlEvents).forEach((eventName: string) => {
        const callback = (shuttleControlEvents[eventName] as ShuttleEvent)
            .callback;
        combokeys.on(eventName, callback);
    });
};

export const unregisterShuttleEvents = (
    shuttleControlEvents: ShuttleControlEvents,
) => {
    Object.keys(shuttleControlEvents).forEach((eventName) => {
        const callback = (shuttleControlEvents[eventName] as ShuttleEvent)
            .callback;
        combokeys.removeListener(eventName, callback);
    });
};

export default shuttleEvents;
