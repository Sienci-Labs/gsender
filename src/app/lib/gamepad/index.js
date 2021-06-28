import { GamepadListener } from 'gamepad.js';
import store from 'app/store';

class Gamepad extends GamepadListener {
    constructor() {
        const { deadZone = 0.5, precision = 3 } = store.get('workspace.gamepad');
        super({ deadZone, precision });
        this.start();
    }

    update = ({ deadZone, precision }) => {
        if (deadZone) {
            this.options.deadZone = deadZone;
        }

        if (precision) {
            this.options.precision = precision;
        }
    }
}

const gamepad = new Gamepad();

export default gamepad;
