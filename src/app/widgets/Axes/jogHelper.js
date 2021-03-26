import _ from 'lodash';

class JogHelper {
    timeoutFunction = null;

    timeout = 250; //250ms

    startTime = 0;

    jog = null;

    continuousJog = null;

    stopContinuousJog = null;

    constructor({ jogCB, startContinuousJogCB, stopContinuousJogCB }) {
        this.jog = _.throttle(jogCB, this.timeout, { trailing: false });
        this.continuousJog = _.throttle(startContinuousJogCB, this.timeout, { trailing: false });
        this.stopContinuousJog = _.throttle(stopContinuousJogCB, this.timeout, { trailing: false });
    }

    onKeyDown(coordinates, feedrate) {
        const startTime = new Date();

        this.startTime = startTime;

        this.timeoutFunction = setTimeout(() => {
            this.continuousJog(coordinates, feedrate);
        }, this.timeout);
    }

    onKeyUp(coordinates) {
        const timer = new Date() - this.startTime;

        if (!this.timeoutFunction) {
            this.stopContinuousJog();
            return;
        }

        if (timer < this.timeout) {
            this.jog(coordinates);
            this.startTime = new Date();
        } else {
            this.stopContinuousJog();
            this.startTime = new Date();
        }

        clearTimeout(this.timeoutFunction);
        this.timeoutFunction = null;
    }
}

export default JogHelper;
