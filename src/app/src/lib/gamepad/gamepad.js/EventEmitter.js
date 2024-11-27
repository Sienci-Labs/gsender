/**
 * Event Emitter
 */
export default class EventEmitter {
    /**
     * Constructor
     */
    constructor() {
        this._events = {};

        // Aliases
        this.on = this.addEventListener;
        this.off = this.removeEventListener;
    }

    /**
     * Emit a new event
     *
     * @param {String} type
     * @param {Object} data
     */
    emit(name, data) {
        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
            return;
        }

        const callbacks = this._events[name];
        const event = { type: name, detail: data };

        for (let length = callbacks.length, i = 0; i < length; i++) {
            this.handle(callbacks[i], event);
        }
    }

    /**
     * Call the given callback
     *
     * @param {Function} callback
     * @param {Object} event
     */
    handle(callback, event) {
        callback(event);
    }

    /**
     * Add a listener
     *
     * @param {String} name
     * @param {Function} callback
     */
    addEventListener(name, callback) {
        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
            this._events[name] = [];
        }

        if (this._events[name].indexOf(callback) < 0) {
            this._events[name].push(callback);
        }
    }

    /**
     * Remove a listener
     *
     * @param {String} name
     * @param {Function} callback
     */
    removeEventListener(name, callback) {
        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
            return;
        }

        const callbacks = this._events[name];
        const index = callbacks.indexOf(callback);

        if (index >= 0) {
            callbacks.splice(index, 1);
        }

        if (callbacks.length === 0) {
            delete this._events[name];
        }
    }
}
