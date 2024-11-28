export default class Loop {
    constructor(callback) {
        this.callback = callback;
        this.frame = null;
        this.update = this.update.bind(this);
    }

    setCallback(callback) {
        this.callback = callback;
    }

    start() {
        if (this.frame) {
            return;
        }

        this.frame = window.requestAnimationFrame(this.update);
    }

    stop() {
        if (!this.frame) {
            return;
        }

        window.cancelAnimationFrame(this.frame);

        this.frame = null;
    }

    update() {
        this.frame = window.requestAnimationFrame(this.update);
        this.callback();
    }
}
