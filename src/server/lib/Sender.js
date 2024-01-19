/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

/* eslint max-classes-per-file: 0 */
import events from 'events';
import logger from './logger';

export const SP_TYPE_SEND_RESPONSE = 0;
export const SP_TYPE_CHAR_COUNTING = 1;

const log = logger('controller:Grbl');

const noop = () => {};

class SPSendResponse {
    callback = null;

    constructor(options, callback = noop) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        if (typeof callback === 'function') {
            this.callback = callback;
        }
    }

    process() {
        this.callback && this.callback(this);
    }

    clear() {
        // Do nothing
    }

    get type() {
        return SP_TYPE_SEND_RESPONSE;
    }
}

class SPCharCounting {
    callback = null;

    state = {
        bufferSize: 128, // Defaults to 128
        dataLength: 0,
        queue: [],
        line: ''
    };

    constructor(options, callback = noop) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        // bufferSize
        const bufferSize = Number(options.bufferSize);
        if (bufferSize && bufferSize > 0) {
            this.state.bufferSize = bufferSize;
        }

        if (typeof callback === 'function') {
            this.callback = callback;
        }
    }

    process() {
        this.callback && this.callback(this);
    }

    reset() {
        this.state.bufferSize = 128; // Defaults to 128
        this.state.dataLength = 0;
        this.state.queue = [];
        this.state.line = '';
    }

    clear() {
        this.state.dataLength = 0;
        this.state.queue = [];
        this.state.line = '';
    }

    get type() {
        return SP_TYPE_CHAR_COUNTING;
    }

    get bufferSize() {
        return this.state.bufferSize;
    }

    set bufferSize(bufferSize = 0) {
        bufferSize = Number(bufferSize);
        if (!bufferSize) {
            return;
        }

        // The buffer size cannot be reduced below the size of the data within the buffer.
        this.state.bufferSize = Math.max(bufferSize, this.state.dataLength);
    }

    get dataLength() {
        return this.state.dataLength;
    }

    set dataLength(dataLength) {
        this.state.dataLength = dataLength;
    }

    get queue() {
        return this.state.queue;
    }

    set queue(queue) {
        this.state.queue = queue;
    }

    get line() {
        return this.state.line;
    }

    set line(line) {
        this.state.line = line;
    }
}

class Sender extends events.EventEmitter {
    // streaming protocol
    sp = null;

    state = {
        hold: false,
        holdReason: null,
        name: '',
        gcode: '',
        context: {},
        lines: [],
        total: 0,
        sent: 0,
        received: 0,
        startTime: 0,
        finishTime: 0,
        elapsedTime: 0,
        remainingTime: 0,
        toolChanges: 0,
        estimatedTime: 0,
        estimateData: [],
        ovF: 100,
        countdownQueue: [],
        queueDone: true,
        timer: 0,
        countdownIsPaused: false,
    };

    stateChanged = false;

    dataFilter = null;

    countDownID = null;

    checkIntervalID = null;

    // @param {number} [type] Streaming protocol type. 0 for send-response, 1 for character-counting.
    // @param {object} [options] The options object.
    // @param {number} [options.bufferSize] The buffer size used in character-counting streaming protocol. Defaults to 127.
    // @param {function} [options.dataFilter] A function to be used to handle the data. The function accepts two arguments: The data to be sent to the controller, and the context.
    constructor(type = SP_TYPE_SEND_RESPONSE, options = {}) {
        super();

        if (typeof options.dataFilter === 'function') {
            this.dataFilter = options.dataFilter;
        }

        // character-counting
        if (type === SP_TYPE_CHAR_COUNTING) {
            this.sp = new SPCharCounting(options, (sp) => {
                if (sp.queue.length > 0) {
                    const lineLength = sp.queue.shift();
                    sp.dataLength -= lineLength;
                }

                while (!this.state.hold && (this.state.sent < this.state.total)) {
                    // Remove leading and trailing whitespace from both ends of a string
                    sp.line = sp.line || this.state.lines[this.state.sent].trim();

                    if (this.dataFilter) {
                        sp.line = this.dataFilter(sp.line, this.state.context) || '';
                    }


                    // The newline character (\n) consumed the RX buffer space
                    if ((sp.line.length > 0) && ((sp.dataLength + sp.line.length + 1) >= sp.bufferSize)) {
                        break;
                    }

                    this.state.sent++;
                    this.emit('change');

                    if (sp.line.length === 0) {
                        this.ack(); // ack empty line
                        continue;
                    }

                    const line = sp.line + '\n';
                    sp.line = '';
                    sp.dataLength += line.length;
                    sp.queue.push(line.length);
                    this.emit('data', line, this.state.context);
                }
            });
        }

        // send-response
        if (type === SP_TYPE_SEND_RESPONSE) {
            this.sp = new SPSendResponse(options, (sp) => {
                while (!this.state.hold && (this.state.sent < this.state.total)) {
                    // Remove leading and trailing whitespace from both ends of a string
                    let line = this.state.lines[this.state.sent].trim();

                    if (this.dataFilter) {
                        line = this.dataFilter(line, this.state.context) || '';
                    }

                    this.state.sent++;
                    this.emit('change');

                    if (line.length === 0) {
                        this.ack(); // ack empty line
                        continue;
                    }

                    this.emit('data', line + '\n', this.state.context);
                    break;
                }
            });
        }

        this.on('change', () => {
            this.stateChanged = true;
        });
    }

    getContext() {
        return this.state.context;
    }

    toJSON() {
        return {
            sp: this.sp.type,
            hold: this.state.hold,
            holdReason: this.state.holdReason,
            name: this.state.name,
            context: this.state.context,
            size: this.state.gcode.length,
            total: this.state.total,
            sent: this.state.sent,
            received: this.state.received,
            startTime: this.state.startTime,
            finishTime: this.state.finishTime,
            elapsedTime: this.state.elapsedTime,
            timePaused: this.state.timePaused,
            timeRunning: this.state.timeRunning,
            remainingTime: this.state.remainingTime,
            toolChanges: this.state.toolChanges,
            bufferSize: this.state.bufferSize,
            dataLength: this.state.dataLength,
            estimatedTime: this.state.estimatedTime,
            ovF: this.state.ovF,
        };
    }

    hold(reason) {
        if (this.state.hold) {
            return;
        }
        this.state.hold = true;
        this.state.holdReason = reason;
        // this.state.timePaused = new Date().getTime();
        this.emit('hold');
        this.emit('change');
    }

    unhold() {
        if (!this.state.hold) {
            return;
        }
        this.state.hold = false;
        this.state.holdReason = null;
        // this.state.timePaused = new Date().getTime() - this.state.timePaused;
        this.emit('unhold');
        this.emit('change');
    }

    // @return {boolean} Returns true on success, false otherwise.
    load(name, gcode = '', context = {}) {
        if (typeof gcode !== 'string' || !gcode) {
            return false;
        }

        let lines = gcode.split('\n');
        lines = lines.filter(line => (line.trim().length > 0));

        if (this.sp) {
            this.sp.clear();
        }
        this.state.hold = false;
        this.state.holdReason = null;
        this.state.name = name;
        this.state.gcode = gcode;
        this.state.context = context;
        this.state.lines = lines;
        this.state.total = this.state.lines.length;
        this.state.sent = 0;
        this.state.received = 0;
        this.state.startTime = 0;
        this.state.finishTime = 0;
        this.state.elapsedTime = 0;
        this.state.timePaused = 0;
        this.state.timeRunning = 0;
        this.state.remainingTime = 0;
        this.state.toolChanges = 0;
        this.state.estimatedTime = 0;
        this.state.estimateData = [];
        this.state.countdownQueue = [];
        this.state.queueDone = true;

        this.emit('load', name, gcode, context);
        log.debug('sender requesting');
        this.emit('requestData');
        this.emit('change');

        return true;
    }

    unload() {
        if (this.sp) {
            this.sp.clear();
        }
        this.state.hold = false;
        this.state.holdReason = null;
        this.state.name = '';
        this.state.gcode = '';
        this.state.context = {};
        this.state.lines = [];
        this.state.total = 0;
        this.state.sent = 0;
        this.state.received = 0;
        this.state.startTime = 0;
        this.state.finishTime = 0;
        this.state.elapsedTime = 0;
        this.state.timePaused = 0;
        this.state.timeRunning = 0;
        this.state.remainingTime = 0;
        this.state.toolChanges = 0;
        this.state.estimatedTime = 0;
        this.state.estimateData = [];
        this.state.countdownQueue = [];
        this.state.queueDone = true;

        this.emit('unload');
        this.emit('change');
    }

    // Tells the sender an acknowledgement has received.
    // @return {boolean} Returns true on success, false otherwise.
    ack() {
        if (!this.state.gcode) {
            return false;
        }

        if (this.state.received >= this.state.sent) {
            return false;
        }

        this.state.received++;
        this.emit('change');

        return true;
    }

    setStartLine(line = 0) {
        this.state.sent = line;
        this.state.received = line;
    }

    // Tells the sender to send more data.
    // @return {boolean} Returns true on success, false otherwise.
    next(options = {}) {
        const { startFromLine, timePaused, forceEnd } = options;

        if (!this.state.gcode) {
            return false;
        }

        const now = new Date().getTime();

        const handleStart = () => {
            this.state.startTime = now;
            this.state.finishTime = 0;
            this.state.elapsedTime = 0;
            this.state.timePaused = 0;
            this.state.timeRunning = 0;
            this.state.remainingTime = this.state.estimatedTime;
            this.state.countdownQueue = [];
            this.state.queueDone = true;
            this.state.countdownIsPaused = false;
            this.checkIntervalID = setInterval(() => {
                if (this.state.countdownQueue.length > 0 && this.state.queueDone) {
                    this.state.queueDone = false;
                    console.log(this.state.countdownQueue);
                    console.log('start afterr waiting');
                    this.fakeCountdown();
                }
            }, 100);
            this.emit('start', this.state.startTime);
            this.emit('change');
        };
        console.log('sent: ' + this.state.sent);
        if (startFromLine) {
            handleStart();
        } else if (this.state.total > 0 && this.state.sent === 0) {
            this.state.received = 0;
            handleStart();
        }

        if (timePaused) {
            this.state.timePaused += timePaused - 1000; // subtracted one second here to account for the time it takes for the sender to hold/unhold
        }

        if (this.sp) {
            this.sp.process();
        }

        // Elapsed Time
        this.state.elapsedTime = now - this.state.startTime;
        this.state.timeRunning = this.state.elapsedTime;
        // subtract time paused
        if (this.state.timePaused > 0) {
            this.state.timeRunning -= this.state.timePaused;
        }

        // Make a 1 second delay before estimating the remaining time
        console.log('elapsed time: ' + this.state.elapsedTime);
        console.log('received: ' + this.state.received);
        if (this.state.elapsedTime >= 1000 && this.state.received > 0) {
            console.log('estimated time: ' + this.state.estimatedTime);
            if (this.state.estimatedTime > 0) { // in case smth goes wrong with the estimate, don't want to show negative time
                console.log('recoieved: ' + this.state.received);
                console.log('estimatedata length: ' + this.state.estimateData.length);
                if (this.state.received < this.state.estimateData.length) {
                    console.log('adding to queue');
                    for (let i = this.state.countdownQueue.length; i <= this.state.received; i++) {
                        this.state.countdownQueue.push(Number(this.state.estimateData[i] || 0) / (this.state.ovF / 100));
                    }
                }
            }
        }

        if (this.state.received >= this.state.total || forceEnd) {
            if (this.state.finishTime === 0) {
                // avoid issue 'end' multiple times
                this.state.finishTime = now;
                this.emit('end', this.state.finishTime);
                this.emit('change');
            }
        }

        return true;
    }

    fakeCountdown() {
        this.state.timer = this.state.countdownQueue.shift();
        this.countDownID = setInterval(() => {
            if (!this.state.countdownIsPaused) {
                this.state.timer--;
                this.state.remainingTime--;

                if (this.state.timer < 1) {
                    if (this.state.countdownQueue.length > 0) {
                        console.log('go to next in queue');
                        this.state.timer = this.state.countdownQueue.shift();
                    } else {
                        console.log('stop countdown');
                        this.stopCountdown();
                    }
                }
            }
        }, 1000);
    }

    // Rewinds the internal array pointer.
    // @return {boolean} Returns true on success, false otherwise.
    rewind() {
        if (!this.state.gcode) {
            return false;
        }

        if (this.sp) {
            this.sp.clear();
        }
        this.state.hold = false; // clear hold off state
        this.state.holdReason = null;
        this.state.sent = 0;
        this.state.received = 0;
        this.state.toolChanges = 0;
        this.state.countdownQueue = [];
        clearInterval(this.checkIntervalID);
        this.emit('change');

        return true;
    }

    // Checks if there are any state changes. It also clears the stateChanged flag.
    // @return {boolean} Returns true on state changes, false otherwise.
    peek() {
        const stateChanged = this.stateChanged;
        this.stateChanged = false;
        return stateChanged;
    }

    incrementToolChanges() {
        this.state.toolChanges = this.state.toolChanges + 1;
        this.emit('change');
        return this.state.toolChanges;
    }

    setEstimateData(estimates) {
        this.state.estimateData = estimates;
    }

    setEstimatedTime(estimatedTime) {
        this.state.remainingTime = Number(estimatedTime);
        this.state.estimatedTime = Number(estimatedTime);
    }

    setOvF(ovF) {
        if (this.state.ovF !== 100) {
            this.state.remainingTime *= this.state.ovF / 100; // reset to 100%
        }
        this.state.remainingTime /= ovF / 100; // set to new time
        this.state.ovF = ovF;
    }

    resumeCountdown() {
        this.state.countdownIsPaused = false;
    }

    pauseCountdown() {
        this.state.countdownIsPaused = true;
    }

    stopCountdown() {
        clearInterval(this.countDownID);
        this.state.queueDone = true;
        this.state.remainingTime -= this.state.timer;
    }
}

export default Sender;
