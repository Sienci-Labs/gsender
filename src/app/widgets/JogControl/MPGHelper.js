import { EventEmitter } from 'events';

const ROTATION_COUNT_UPPER_LIMIT = 5;
const ROTATION_COUNT_LOWER_LIMIT = 5;

export class MPGHelper extends EventEmitter {
    constructor (value, threshold = 0, previousValuesLimit = 100) {
        super();
        this.threshold = threshold;
        this.rotationPosition = 0;
        this.value = value;
        this.previousValues = [];
        this.previousValuesLimit = previousValuesLimit;
        this.rotationInProgress = false;
    }

    updateValue = (newValue) => {
        //Flush out history when hitting upper limit
        if (this.previousValues.length > this.previousValuesLimit) {
            this.previousValues = [];
        }

        if (this.previousValues.length === 0 && newValue !== 0) {
            return;
        }

        if (newValue === 0) {
            const didFullRotation = this.checkIfDidFullRotation();

            if (didFullRotation) {
                return;
            }
        }

        this.previousValues.push(this.value);

        this.value = newValue;
    }

    checkIfDidFullRotation = () => {
        const prevValues = this.previousValues.reverse();

        const didFullRotation = prevValues
            .every((value, index) => {
                const prevValue = this.previousValues[index - 1];

                if (value === 0) {
                    return true;
                }

                return value > prevValue;
            });

        if (didFullRotation) {
            this.updateRotationPosition('increment');

            this.previousValues = [];
            this.rotationInProgress = false;

            this.emit('full:rotation', {
                rotationPosition: this.rotationPosition,
            });

            return true;
        }

        return false;
    }

    updateRotationPosition = (type) => {
        if (type === 'increment' && this.rotationPosition < ROTATION_COUNT_UPPER_LIMIT) {
            this.rotationPosition += 1;
        }

        if (type === 'decrement' && this.rotationPosition > ROTATION_COUNT_LOWER_LIMIT) {
            this.rotationPosition -= 1;
        }
    }
}
