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
import events from "node:events";
import logger from "./logger";
import { checkIfRotaryFile } from "./rotary";

export const SP_TYPE_SEND_RESPONSE = 0;
export const SP_TYPE_CHAR_COUNTING = 1;

const log = logger("controller:Grbl");

const noop = () => {};

// Matches LINE_KIND_* in app/lib/timeEstimator/MotionPlanner
const LINE_KIND_RAPID = 2;
const LINE_KIND_FIXED = 3;
const REMAINING_FEED = 0;
const REMAINING_RAPID = 1;
const REMAINING_FIXED = 2;

const ACTIVE_STATE_RUN = "Run";
const ACTIVE_STATE_IDLE = "Idle";

const toArrayBuffer = (data) => {
	if (data instanceof ArrayBuffer) {
		return data;
	}
	if (ArrayBuffer.isView(data)) {
		// Buffers from socket.io may be unaligned slices of a shared pool
		return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
	}
	return null;
};

// Accepts typed arrays / buffers from the estimator, or a legacy number[]
const toLineTimes = (data) => {
	if (Array.isArray(data)) {
		return Float32Array.from(data, (v) => Number(v) || 0);
	}
	const buffer = toArrayBuffer(data);
	if (!buffer) {
		return new Float32Array(0);
	}
	return new Float32Array(buffer, 0, Math.floor(buffer.byteLength / 4));
};

const toLineKinds = (data, length) => {
	const buffer = toArrayBuffer(data);
	const kinds = buffer ? new Uint8Array(buffer) : new Uint8Array(0);
	if (kinds.length >= length) {
		return kinds;
	}
	const padded = new Uint8Array(length);
	padded.set(kinds);
	return padded;
};

const remainingIndexForKind = (kind) => {
	if (kind === LINE_KIND_RAPID) return REMAINING_RAPID;
	if (kind === LINE_KIND_FIXED) return REMAINING_FIXED;
	return REMAINING_FEED;
};

class SPSendResponse {
	callback = null;

	constructor(options, callback = noop) {
		if (typeof options === "function") {
			callback = options;
			options = {};
		}
		if (typeof callback === "function") {
			this.callback = callback;
		}
	}

	process() {
		this.callback?.(this);
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
		line: "",
	};

	constructor(options, callback = noop) {
		if (typeof options === "function") {
			callback = options;
			options = {};
		}

		// bufferSize
		const bufferSize = Number(options.bufferSize);
		if (bufferSize && bufferSize > 0) {
			this.state.bufferSize = bufferSize;
		}

		if (typeof callback === "function") {
			this.callback = callback;
		}
	}

	process(isOk) {
		this.callback?.(this, isOk);
	}

	reset() {
		this.state.bufferSize = 128; // Defaults to 128
		this.state.dataLength = 0;
		this.state.queue = [];
		this.state.line = "";
	}

	clear() {
		this.state.dataLength = 0;
		this.state.queue = [];
		this.state.line = "";
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
		name: "",
		gcode: "",
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
		ovF: 100,
		ovR: 100,
		isRotaryFile: false,
	};

	stateChanged = false;

	dataFilter = null;

	// Per sender line estimated seconds at 100% overrides, and the LINE_KIND of each
	lineTime = new Float32Array(0);

	lineKind = new Uint8Array(0);

	// Execution playhead: lines fully executed, plus progress through the next one
	execLine = 0;

	execFrac = 0;

	// Unexecuted estimated seconds at 100%, split by how overrides scale them
	remaining = [0, 0, 0];

	lastProgressTick = 0;

	// Largest planner "blocks available" seen, i.e. the empty-buffer count
	plannerSize = 0;

	// Consecutive Idle status reports during a job
	idleReports = 0;

	// Between job start and rewind (stop/finish) - progress only tracks then
	jobActive = false;

	// @param {number} [type] Streaming protocol type. 0 for send-response, 1 for character-counting.
	// @param {object} [options] The options object.
	// @param {number} [options.bufferSize] The buffer size used in character-counting streaming protocol. Defaults to 127.
	// @param {function} [options.dataFilter] A function to be used to handle the data. The function accepts two arguments: The data to be sent to the controller, and the context.
	constructor(type = SP_TYPE_SEND_RESPONSE, options = {}) {
		super();

		if (typeof options.dataFilter === "function") {
			this.dataFilter = options.dataFilter;
		}

		// character-counting
		if (type === SP_TYPE_CHAR_COUNTING) {
			this.sp = new SPCharCounting(options, (sp, isOk) => {
				// only remove line length from buffer if ok was sent
				if (sp.queue.length > 0 && isOk) {
					const lineLength = sp.queue.shift();
					sp.dataLength -= lineLength;
				}

				while (!this.state.hold && this.state.sent < this.state.total) {
					// Remove leading and trailing whitespace from both ends of a string.
					// Only load and filter a fresh line when sp.line is empty; if sp.line is
					// already set, it was cached from a previous iteration where the buffer
					// was full — re-running dataFilter would double-remap tool numbers.
					if (!sp.line) {
						sp.line = this.state.lines[this.state.sent].trim();
						if (this.dataFilter) {
							sp.line = this.dataFilter(sp.line, this.state.context) || "";
						}
					}

					// The newline character (\n) consumed the RX buffer space
					if (
						sp.line.length > 0 &&
						sp.dataLength + sp.line.length + 1 >= sp.bufferSize
					) {
						break;
					}

					this.state.sent++;
					this.emit("change");

					if (sp.line.length === 0) {
						this.ack(); // ack empty line
						continue;
					}

					const line = `${sp.line}\n`;
					sp.line = "";
					sp.dataLength += line.length;
					sp.queue.push(line.length);
					this.emit("data", line, this.state.context);
				}
			});
		}

		// send-response
		if (type === SP_TYPE_SEND_RESPONSE) {
			this.sp = new SPSendResponse(options, (_sp) => {
				while (!this.state.hold && this.state.sent < this.state.total) {
					// Remove leading and trailing whitespace from both ends of a string
					let line = this.state.lines[this.state.sent].trim();

					if (this.dataFilter) {
						line = this.dataFilter(line, this.state.context) || "";
					}

					this.state.sent++;
					this.emit("change");

					if (line.length === 0) {
						this.ack(); // ack empty line
						continue;
					}

					this.emit("data", `${line}\n`, this.state.context);
					break;
				}
			});
		}

		this.on("change", () => {
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
			isRotaryFile: this.state.isRotaryFile,
			currentLineRunning: this.execLine,
		};
	}

	hold(reason) {
		if (this.state.hold) {
			return;
		}
		this.state.hold = true;
		this.state.holdReason = reason;
		// this.state.timePaused = new Date().getTime();
		this.emit("hold");
		this.emit("change");
	}

	unhold() {
		if (!this.state.hold) {
			return;
		}
		this.state.hold = false;
		this.state.holdReason = null;
		// this.state.timePaused = new Date().getTime() - this.state.timePaused;
		this.emit("unhold");
		this.emit("change");
	}

	// @return {boolean} Returns true on success, false otherwise.
	load(name, gcode = "", context = {}) {
		if (typeof gcode !== "string" || !gcode) {
			return false;
		}

		// grbl treats a lone CR as end of line too; matches the estimator's split
		let lines = gcode.split(/\r\n|\r|\n/);
		lines = lines.filter((line) => line.trim().length > 0);

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
		this.clearEstimateData();

		// check if file is rotary
		this.state.isRotaryFile = checkIfRotaryFile(gcode);

		this.emit("load", name, gcode, context);
		log.debug("sender requesting");
		this.emit("requestData");
		this.emit("change");

		return true;
	}

	unload() {
		if (this.sp) {
			this.sp.clear();
		}
		this.state.hold = false;
		this.state.holdReason = null;
		this.state.name = "";
		this.state.gcode = "";
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
		this.clearEstimateData();
		this.state.isRotaryFile = false;

		this.emit("unload");
		this.emit("change");
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
		this.emit("change");

		return true;
	}

	setStartLine(line = 0) {
		this.state.sent = line;
		this.state.received = line;
	}

	// Tells the sender to send more data.
	// @return {boolean} Returns true on success, false otherwise.
	next(options = {}) {
		const { startFromLine, timePaused, forceEnd, isOk } = options;

		if (!this.state.gcode) {
			return false;
		}

		const now = Date.now();

		const handleStart = () => {
			this.state.startTime = now;
			this.state.finishTime = 0;
			this.state.elapsedTime = 0;
			this.state.timePaused = 0;
			this.state.timeRunning = 0;
			this.lastProgressTick = now;
			this.jobActive = true;
			this.resetPlayhead();
			// Start from line: everything before the start line counts as done
			if (startFromLine) {
				this.advancePlayheadTo(this.state.received);
			}
			this.updateRemainingTime();

			this.emit("start", this.state.startTime);
			this.emit("change");
		};
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
			this.sp.process(isOk);
		}

		// Elapsed Time
		this.updateElapsedTime();

		if (this.state.received >= this.state.total || forceEnd) {
			if (this.state.finishTime === 0) {
				// avoid issue 'end' multiple times
				this.state.finishTime = now;
				this.emit("end", this.state.finishTime);
				this.emit("change");
			}
		}

		return true;
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
		// remainingTime is left as-is so a finished job keeps showing 0
		this.jobActive = false;
		this.execLine = 0;
		this.execFrac = 0;
		this.emit("change");

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
		this.emit("change");
		return this.state.toolChanges;
	}

	// @param {object} data { lineTime, lineKind, estimatedTime } from the estimator.
	// lineTime/lineKind arrive as ArrayBuffers/Buffers (or a legacy number[]).
	setEstimateData({ lineTime, lineKind, estimatedTime } = {}) {
		this.lineTime = toLineTimes(lineTime);
		this.lineKind = toLineKinds(lineKind, this.lineTime.length);
		let total = 0;
		for (let i = 0; i < this.lineTime.length; i++) {
			total += this.lineTime[i];
		}
		this.state.estimatedTime = Number(estimatedTime) || total;
		this.resetPlayhead();
		if (this.jobActive) {
			this.advancePlayheadTo(this.state.received);
		}
		this.updateRemainingTime();
	}

	clearEstimateData() {
		this.jobActive = false;
		this.lineTime = new Float32Array(0);
		this.lineKind = new Uint8Array(0);
		this.resetPlayhead();
		this.lastProgressTick = 0;
		this.idleReports = 0;
	}

	// UI feed override command; status reports (Ov:) take over once they arrive
	setOvF(ovF) {
		const value = Number(ovF);
		if (value > 0) {
			this.state.ovF = value;
			this.updateRemainingTime();
		}
	}

	resetPlayhead() {
		this.execLine = 0;
		this.execFrac = 0;
		this.remaining = [0, 0, 0];
		for (let i = 0; i < this.lineTime.length; i++) {
			this.remaining[remainingIndexForKind(this.lineKind[i])] +=
				this.lineTime[i];
		}
	}

	lineRate(kind) {
		if (kind === LINE_KIND_FIXED) return 1;
		const ov = kind === LINE_KIND_RAPID ? this.state.ovR : this.state.ovF;
		return Math.max(Number(ov) || 100, 1) / 100;
	}

	// Mark `fraction` (0..1) of line i executed
	consumeLine(i, fraction) {
		const time = this.lineTime[i] || 0;
		if (time > 0 && fraction > 0) {
			const idx = remainingIndexForKind(this.lineKind[i]);
			this.remaining[idx] = Math.max(0, this.remaining[idx] - time * fraction);
		}
	}

	// Jump the playhead forward to the start of `line`
	advancePlayheadTo(line) {
		const target = Math.min(line, this.state.total);
		if (target <= this.execLine) {
			return;
		}
		this.consumeLine(this.execLine, 1 - this.execFrac);
		for (let i = this.execLine + 1; i < target; i++) {
			this.consumeLine(i, 1);
		}
		this.execLine = target;
		this.execFrac = 0;
	}

	// Run the playhead for `seconds` of wall time, never past `limit` lines
	advancePlayheadBy(seconds, limit) {
		let dt = seconds;
		while (dt > 0 && this.execLine < limit) {
			const i = this.execLine;
			const duration =
				(this.lineTime[i] || 0) / this.lineRate(this.lineKind[i]);
			const left = duration * (1 - this.execFrac);
			if (dt >= left) {
				dt -= left;
				this.consumeLine(i, 1 - this.execFrac);
				this.execLine++;
				this.execFrac = 0;
			} else {
				const fraction = dt / duration;
				this.consumeLine(i, fraction);
				this.execFrac += fraction;
				dt = 0;
			}
		}
	}

	// Highest line that must have finished executing, from planner occupancy:
	// the last `queued` motion lines received may still be in the planner.
	executedLowerBound(queuedBlocks) {
		let line = this.state.received;
		let queued = queuedBlocks;
		while (queued > 0 && line > this.execLine) {
			line--;
			const kind = this.lineKind[line];
			if (kind !== 0 && kind !== LINE_KIND_FIXED) {
				queued--;
			}
		}
		return line;
	}

	updateRemainingTime() {
		const [feed, rapid, fixed] = this.remaining;
		const remaining =
			feed / this.lineRate(1) + rapid / this.lineRate(LINE_KIND_RAPID) + fixed;
		this.state.remainingTime = Math.max(0, Number(remaining.toFixed(3)));
	}

	/**
	 * Advance the execution playhead from a controller status report. Time only
	 * passes while the machine is in Run; the playhead can't pass the last acked
	 * line, and planner occupancy (Bf) pulls it forward if it falls behind.
	 * @param {object} status parsed status report ({ activeState, ov, buf })
	 * @param {number} [now]
	 */
	updateProgress(status = {}, now = Date.now()) {
		const dtSeconds = this.lastProgressTick
			? Math.max(0, (now - this.lastProgressTick) / 1000)
			: 0;
		this.lastProgressTick = now;

		const [ovF, ovR] = Array.isArray(status.ov) ? status.ov : [];
		if (Number(ovF) > 0) this.state.ovF = Number(ovF);
		if (Number(ovR) > 0) this.state.ovR = Number(ovR);

		const planner = status.buf ? Number(status.buf.planner) : Number.NaN;
		if (Number.isFinite(planner) && planner > this.plannerSize) {
			this.plannerSize = planner;
		}

		if (!this.jobActive) {
			return;
		}

		const prevLine = this.execLine;
		const prevRemaining = Math.round(this.state.remainingTime);
		const prevElapsed = Math.floor(this.state.elapsedTime / 1000);

		const received = Math.min(this.state.received, this.state.total);
		this.idleReports =
			status.activeState === ACTIVE_STATE_IDLE ? this.idleReports + 1 : 0;
		if (status.activeState === ACTIVE_STATE_RUN) {
			this.advancePlayheadBy(dtSeconds, received);
		}
		if (Number.isFinite(planner) && this.plannerSize > 0) {
			const queued = Math.max(0, this.plannerSize - planner);
			this.advancePlayheadTo(this.executedLowerBound(queued));
		} else if (this.idleReports >= 2) {
			// Without buffer reports, a sustained Idle means everything acked has
			// run. A single Idle isn't enough: grbl acks lines into the planner
			// before it starts the cycle.
			this.advancePlayheadTo(received);
		}
		this.updateRemainingTime();

		// Runs until the workflow stops, i.e. past the last ack while the
		// machine finishes the buffered moves
		this.updateElapsedTime();

		if (
			this.execLine !== prevLine ||
			Math.round(this.state.remainingTime) !== prevRemaining ||
			Math.floor(this.state.elapsedTime / 1000) !== prevElapsed
		) {
			this.emit("change");
		}
	}

	// Real-world data for tuning the estimator
	logEstimateAccuracy() {
		if (!this.state.estimatedTime || !this.state.startTime) {
			return;
		}
		this.updateElapsedTime();
		const running = (this.state.timeRunning || 0) / 1000;
		const paused = (this.state.timePaused || 0) / 1000;
		const ratio = running > 0 ? this.state.estimatedTime / running : 0;
		log.info(
			`Job time: estimated=${this.state.estimatedTime.toFixed(1)}s actual=${running.toFixed(1)}s paused=${paused.toFixed(1)}s ratio=${ratio.toFixed(3)} ovF=${this.state.ovF} ovR=${this.state.ovR} lines=${this.state.total}`,
		);
	}

	updateElapsedTime() {
		// Elapsed Time
		const now = Date.now();
		this.state.elapsedTime = now - this.state.startTime;
		this.state.timeRunning = this.state.elapsedTime - this.state.timePaused;
	}
}

export default Sender;
