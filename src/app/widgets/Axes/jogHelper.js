import _ from 'lodash';

class JogHelper {
    timeoutFunction = null;

    timeout = 250; //250ms

    startTime = 0;

    didPress = false;

    jog = null;

    continuousJog = null;

    stopContinuousJog = null;

    constructor({ jogCB, startContinuousJogCB, stopContinuousJogCB }) {
        this.jog = _.throttle(jogCB, this.timeout);
        this.continuousJog = _.throttle(startContinuousJogCB, this.timeout);
        this.stopContinuousJog = _.throttle(stopContinuousJogCB, this.timeout);
    }

    onKeyDown(coordinates, feedrate) {
        const startTime = new Date();

        this.startTime = startTime;
        this.didPress = true;

        this.timeoutFunction = setTimeout(() => {
            this.continuousJog(coordinates, feedrate);
        }, this.timeout);
    }

    onKeyUp(coordinates) {
        const timer = new Date() - this.startTime;
        clearTimeout(this.timeoutFunction);
        this.timeoutFunction = null;

        if (timer < this.timeout) {
            this.jog(coordinates);
            this.didPress = false;
            this.startTime = new Date();
        } else {
            this.stopContinuousJog();
            this.startTime = new Date();
            this.didPress = false;
        }
    }
}

export default JogHelper;
