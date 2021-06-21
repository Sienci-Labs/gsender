import events from 'events';
import { GamepadListener } from 'gamepad.js';

const deadZone = 0.5;
const precision = 3;

let listener = new GamepadListener({ deadZone, precision });
listener.start();

class Gamepad extends events.EventEmitter {
    events = [];

    constructor(events) {
        super();
        this.updateEvents(events);
    }

    listen = () => {
        for (const event of this.events) {
            listener.on(event.name, event.action);
        }
    }

    stopListening = () => {
        listener.stop();
    }

    updateEvents = (events) => {
        if (events && Array.isArray(events)) {
            this.events = events;
        }
    }

    update = ({ deadZone = 0.4, precision = 3, events }) => {
        listener = new GamepadListener({ deadZone, precision });

        this.updateEvents(events);
        this.listen();
        listener.update();
    }
}

export default Gamepad;
