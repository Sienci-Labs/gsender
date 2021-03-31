import _ from 'lodash';

class JogHelper {
    timeoutFunction = null;

    timeout = 250; //250ms

    startTime = 0;

    didPress = false;

    currentCoordinates = null;

    jog = null;

    continuousJog = null;

    stopContinuousJog = null;

    constructor({ jogCB, startContinuousJogCB, stopContinuousJogCB }) {
        this.jog = _.throttle(jogCB, 150, { trailing: false });
        this.continuousJog = _.throttle(startContinuousJogCB, 150, { trailing: false });
        this.stopContinuousJog = _.throttle(stopContinuousJogCB, 150, { trailing: false });

        // this.jog = jogCB;
        // this.continuousJog = startContinuousJogCB;
        // this.stopContinuousJog = stopContinuousJogCB;
    }

    onKeyDown(coordinates, feedrate) {
        const startTime = new Date();

        if (this.timeoutFunction) {
            return;
        }

        this.startTime = startTime;
        this.currentCoordinates = coordinates;

        this.timeoutFunction = setTimeout(() => {
            this.continuousJog(coordinates, feedrate);
        }, this.timeout);

        this.didPress = true;
    }

    onKeyUp(coordinates) {
        const timer = new Date() - this.startTime;

        if (!this.timeoutFunction) {
            return;
        }

        if (timer < this.timeout && this.didPress) {
            this.jog(coordinates);
            this.startTime = new Date();
            this.didPress = false;
            this.currentCoordinates = null;
        } else {
            this.stopContinuousJog();
            this.startTime = new Date();
            this.didPress = false;
            this.currentCoordinates = null;
        }

        clearTimeout(this.timeoutFunction);
        this.timeoutFunction = null;
    }
}

export default JogHelper;
