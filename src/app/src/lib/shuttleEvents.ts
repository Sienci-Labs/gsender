import React from 'react';
import { ShuttleControlEvents, ShuttleEvent } from './definitions/shortcuts';

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

export default shuttleEvents;
