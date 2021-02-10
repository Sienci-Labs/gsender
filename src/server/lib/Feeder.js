import events from 'events';

class Feeder extends events.EventEmitter {
    state = {
        hold: false,
        holdReason: null,
        queue: [],
        pending: false,
        changed: false,
        outstanding: 0,
        interval: null
    };

    dataFilter = null;

    // @param {object} [options] The options object.
    // @param {function} [options.dataFilter] A function to be used to handle the data. The function accepts two arguments: The data to be sent to the controller, and the context.
    constructor(options) {
        super();

        if (typeof options.dataFilter === 'function') {
            this.dataFilter = options.dataFilter;
        }

        this.on('change', () => {
            this.state.changed = true;
        });
    }

    toJSON() {
        return {
            hold: this.state.hold,
            holdReason: this.state.holdReason,
            queue: this.state.queue.length,
            pending: this.state.pending,
            changed: this.state.changed
        };
    }

    feed(data = [], context = {}) {
        // Clear pending state when the feeder queue is empty
        if (this.state.queue.length === 0) {
            this.state.pending = false;
        }

        data = [].concat(data);
        if (data.length > 0) {
            this.state.queue = this.state.queue.concat(data.map(command => {
                return { command: command, context: context };
            }));
            this.emit('change');
        }
    }

    hold(reason) {
        if (this.state.hold) {
            return;
        }
        this.state.hold = true;
        this.state.holdReason = reason;
        this.emit('hold');
        this.emit('change');
    }

    unhold() {
        if (!this.state.hold) {
            return;
        }
        this.state.hold = false;
        this.state.holdReason = null;
        this.emit('unhold');
        this.emit('change');
    }

    clear() {
        this.state.queue = [];
        this.state.pending = false;
        this.state.outstanding = 0;
        this.state.interval && clearInterval(this.state.interval);
        this.emit('change');
    }

    reset() {
        this.state.hold = false;
        this.state.holdReason = null;
        this.state.queue = [];
        this.state.pending = false;
        this.state.outstanding = 0;
        this.state.interval && clearInterval(this.state.interval);
        this.emit('change');
    }

    size() {
        return this.state.queue.length;
    }

    next() {
        while (!this.state.hold && this.state.queue.length > 0) {
            let { command, context } = this.state.queue.shift();

            if (this.dataFilter) {
                command = this.dataFilter(command, context) || '';
                if (!command) { // Ignore blank lines
                    continue;
                }
            }

            this.state.pending = true;
            this.state.outstanding++;
            this.emit('data', command, context);
            this.emit('change');
            break;
        }

        // Clear pending state when the feeder queue is empty
        if (this.state.queue.length === 0) {
            this.state.pending = false;
        }

        return this.state.pending;
    }

    isPending() {
        return this.state.pending;
    }

    // Returns true if any state have changes
    peek() {
        const changed = this.state.changed;
        this.state.changed = false;
        return changed;
    }

    ack() {
        if (this.state.outstanding > 0) {
            this.state.outstanding--;
        }
    }

    hasOutstanding() {
        return this.state.outstanding > 0;
    }

    repeatCommand(command, timer = 250) {
        this.state.interval = setInterval(() => {
            if (!this.hasOutstanding()) {
                this.feed(command);
                if (!this.isPending()) {
                    this.next();
                }
            }
        }, timer);
    }
}

export default Feeder;
