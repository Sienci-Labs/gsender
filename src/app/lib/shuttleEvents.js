import React from 'react';

class ShuttleEvents extends React.PureComponent {
    allShuttleControlEvents = {};

    updateShuttleEvents(shuttleControlEvents) {
        Object.keys(shuttleControlEvents).forEach(eventName => {
            this.allShuttleControlEvents[eventName] = shuttleControlEvents[eventName];
        });
    }
}

const shuttleEvents = new ShuttleEvents();

export default shuttleEvents;
