import React from 'react';

class ShuttleEvents extends React.PureComponent {
    allShuttleControlEvents = {};

    updateShuttleEvents(shuttleControlEvents) {
        Object.keys(shuttleControlEvents).forEach(eventName => {
            this.allShuttleControlEvents[eventName] = shuttleControlEvents[eventName];
        });
    }

    getEvent(key) {
        if (key === undefined) {
            throw new Error('Key not provided');
        }

        return this.allShuttleControlEvents[key];
    }
}

const shuttleEvents = new ShuttleEvents();

export default shuttleEvents;
