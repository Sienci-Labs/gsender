import { EventEmitter } from 'events';
import { inRange } from 'lodash';

const TOTAL_ANGLE = 60;
const ANGLE_THRESHOLD = 30;

export class MPGHelper extends EventEmitter {
    constructor(jog) {
        super();
        this.value = null;

        this.jog = jog;
    }

    update = (value, axis, step, feedrate, factor = 1) => {
        this.axis = axis;
        this.step = step;
        this.feedrate = feedrate;
        this.factor = factor;

        this._updateValue(value);
    }

    _updateValue = (newValue) => {
        if (this.value === null) {
            this.value = newValue;
        }

        const { axis, step, feedrate, factor } = this;

        if (inRange(this.value - newValue, TOTAL_ANGLE - ANGLE_THRESHOLD, TOTAL_ANGLE + ANGLE_THRESHOLD)) {
            this.jog({ [axis]: step * factor, F: feedrate });
            this.value = newValue;
            return;
        }

        if (inRange(this.value - newValue, -TOTAL_ANGLE - ANGLE_THRESHOLD, -TOTAL_ANGLE + ANGLE_THRESHOLD)) {
            this.jog({ [axis]: -step * factor, F: feedrate });
            this.value = newValue;
            return;
        }
    }

    clearValue = () => {
        this.value = null;
    }
}
