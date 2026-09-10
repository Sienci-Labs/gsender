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

import events from "events";

import { computeTravelBudget } from "./jog-limits";

export const JOG_MODE_VELOCITY = "velocity";
export const JOG_MODE_DISPLACEMENT = "displacement";

export const JOG_STATE_IDLE = "idle";
export const JOG_STATE_STREAMING = "streaming";
export const JOG_STATE_DRAINING = "draining";

// How often the scheduler wakes up. Segments are emitted on their own schedule;
// this is only the resolution with which we notice one is due.
export const TICK_MS = 10;

// Bounds on how much time a single segment covers. DT_MIN keeps us under
// MAX_SEGMENT_RATE_HZ, DT_MAX keeps direction changes feeling immediate.
export const DT_MIN = 0.02;
export const DT_MAX = 0.12;
// A tick that runs late is coalesced into one larger segment rather than
// banking a backlog. This caps how much a single segment can absorb.
export const DT_MAX_CATCHUP = 0.25;

// How far ahead of the machine we try to keep the planner filled. Must exceed
// the time needed to decelerate from the current speed, or the planner will
// slow down at the end of the queue.
export const T_LOOK_MIN = 0.1;
export const T_LOOK_MAX = 0.5;
export const SAFETY_K = 1.5;

// Target and hard cap on the number of un-acked lines. Both stay well under
// grbl's 15 planner blocks.
export const N_INFLIGHT = 6;
export const MAX_INFLIGHT_LINES = 8;

// ~1.5 KB/s at 30 bytes a line, which is about 1.3% of a 115200 baud link.
export const MAX_SEGMENT_RATE_HZ = 50;

// Below this a segment would be lost to rounding, so we widen dt instead.
export const MIN_SEGMENT_MM = 0.02;

// Advisory back-off, only used when the firmware reports buffer state (Bf:).
export const PLANNER_LOW_WATER = 3;

// Ceiling on un-acked motion time, as a multiple of the lookahead window.
export const OVERRUN_FACTOR = 2.0;

// Matches the convention the Sender uses for grbl's 128 byte receive buffer.
export const RX_MARGIN_BYTES = 24;

// A jog stream that nobody is steering must not outlive the operator's intent.
export const MAX_STREAM_DURATION_MS = 30000;

// How long we keep absorbing our own acks after a jog cancel.
export const DRAIN_TIMEOUT_MS = 1500;

// A joystick varies its feedrate continuously, so speed changes are announced
// no more often than this. A keybind change, being one discrete step, always
// lands on the first opportunity.
export const FEEDRATE_ANNOUNCE_INTERVAL_MS = 1000;

// Retained for parity with the previous jog handlers. Properly clamping the
// feedrate against $112 makes this redundant, and it wrongly derates an XZ
// move where Z is not the binding axis - remove it in a follow-up.
export const Z_FEEDRATE_DERATE = 0.8;

export const DECIMALS = 3;
// Anything below half the output precision cannot be commanded at all.
export const MIN_MOTION_MM = 0.5 * 10 ** -DECIMALS;
export const MIN_FEEDRATE = 1;
export const DEFAULT_FEEDRATE = 1000;
// Stand-in for an axis whose acceleration the firmware never reported - a
// FluidNC board answers $$ in a dialect we don't parse, so the settings map
// stays empty. Deliberately low: assuming too little costs only a longer lead,
// capped at T_LOOK_MAX and flushed by the jog cancel on release, while
// assuming too much starves the planner and the jog stutters.
export const ASSUMED_ACCEL = 1000;

const LINEAR_AXES = ["X", "Y", "Z"];
const ALL_AXES = ["X", "Y", "Z", "A"];

// Active states we refuse to keep streaming through.
const BLOCKING_STATES = ["Alarm", "Hold", "Door", "Check", "Home", "Sleep"];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const round = (value) => {
	const factor = 10 ** DECIMALS;
	return Math.round(value * factor) / factor;
};

const toNumber = (value, fallback = 0) => {
	const num = Number(value);
	return Number.isFinite(num) ? num : fallback;
};

/**
 * Work out how large each streamed jog segment should be.
 *
 * The controlling constraint is that the queued motion must always be longer
 * than the distance needed to decelerate from the current speed. If it isn't,
 * grbl plans a stop at the end of the queue and the jog visibly stutters.
 *
 * @returns {object} { feedrate, dt, segmentLength, inflight, tLook, starved }
 */
export function computeSegmentPlan({
	dir = {},
	feedrate,
	accelByAxis = {},
	maxRateByAxis = {},
}) {
	const magnitude = Math.hypot(...LINEAR_AXES.map((axis) => dir[axis] || 0));

	const unit = {};
	LINEAR_AXES.forEach((axis) => {
		unit[axis] = magnitude > 0 ? (dir[axis] || 0) / magnitude : 0;
	});

	// Clamp against each axis' max rate. A diagonal is limited by whichever
	// axis reaches its own ceiling first, which the old max($110,$111,$112)
	// clamp got wrong in both directions.
	//
	// An axis that reports nothing is left unclamped rather than given an
	// assumed ceiling: the firmware clamps jog feedrate itself, and the
	// backpressure gates stop the resulting overrun from growing, whereas a
	// guessed ceiling would cap a fast machine that simply doesn't report.
	let resolved = toNumber(feedrate, MIN_FEEDRATE);
	LINEAR_AXES.forEach((axis) => {
		if (!unit[axis]) {
			return;
		}
		const maxRate = toNumber(maxRateByAxis[axis]);
		if (maxRate > 0) {
			resolved = Math.min(resolved, maxRate / Math.abs(unit[axis]));
		}
	});
	if (dir.A) {
		const maxRate = toNumber(maxRateByAxis.A);
		if (maxRate > 0) {
			resolved = Math.min(resolved, maxRate);
		}
	}
	resolved = Math.max(resolved, MIN_FEEDRATE);

	const v = resolved / 60;

	// Acceleration available along the travel vector, limited per axis.
	//
	// Every axis on the vector contributes a constraint, whether or not the
	// firmware told us about it. Skipping the unreported ones would read them
	// as infinitely capable: X=500 with Y silent used to come out at 707 on a
	// diagonal, a more confident answer than knowing both were 500.
	let inverseSquares = 0;
	let accelReported = false;
	const axisAccel = (axis) => {
		const accel = toNumber(accelByAxis[axis]);
		if (accel > 0) {
			accelReported = true;
			return accel;
		}
		return ASSUMED_ACCEL;
	};

	LINEAR_AXES.forEach((axis) => {
		if (!unit[axis]) {
			return;
		}
		inverseSquares += (unit[axis] / axisAccel(axis)) ** 2;
	});
	if (dir.A && magnitude === 0) {
		inverseSquares += (1 / axisAccel("A")) ** 2;
	}
	const effectiveAccel =
		inverseSquares > 0
			? Math.max(1 / Math.sqrt(inverseSquares), 1)
			: ASSUMED_ACCEL;

	const requiredLook = (SAFETY_K * v) / (2 * effectiveAccel);
	const tLook = clamp(requiredLook, T_LOOK_MIN, T_LOOK_MAX);

	let dt = clamp(tLook / N_INFLIGHT, DT_MIN, DT_MAX);
	// Widen rather than emit segments small enough to be lost to rounding.
	dt = Math.max(dt, MIN_SEGMENT_MM / v);
	// And never saturate the serial link at high feedrates.
	dt = Math.max(dt, 1 / MAX_SEGMENT_RATE_HZ);

	// Note this is a planner depth, not a serial one: grbl parses lines out of
	// the receive buffer in microseconds, so RX occupancy is not the queue that
	// matters. The byte budget is enforced separately, purely as overflow
	// protection.
	const inflight = Math.max(
		1,
		Math.min(Math.ceil(tLook / dt), MAX_INFLIGHT_LINES),
	);

	return {
		feedrate: resolved,
		dt,
		segmentLength: v * dt,
		inflight,
		tLook,
		requiredLook,
		effectiveAccel,
		// False when every axis on this vector fell back to ASSUMED_ACCEL, so
		// callers can tell a real limit from one we invented.
		accelReported,
		// True when the machine's acceleration is so low relative to the
		// requested feedrate that no reachable queue depth can hold enough
		// motion. The planner will decelerate; this is physics, not a bug.
		starved: requiredLook > T_LOOK_MAX,
	};
}

/**
 * Streams short incremental `$J=` moves so the firmware planner always has
 * enough queued motion to hold a constant velocity.
 *
 * This replaces both the single enormous jog move the controllers used to
 * fabricate and the renderer-side series of independent short moves. It is
 * driven by wall-clock time, not by acks: grbl acknowledges a line when it is
 * parsed into the planner, not when it executes, so pacing on acks lets the
 * stream run arbitrarily far ahead of the machine. Acks are used purely as
 * backpressure.
 */
export default class JogStreamer extends events.EventEmitter {
	constructor({
		write,
		getSettings,
		getStatus,
		getHomingFlag = () => false,
		canStream = () => true,
		lineFilter = (line) => line,
		softLimitsEnabled,
		log = null,
		rxBufferSize = 128,
		now = () => Date.now(),
		setIntervalFn = setInterval,
		clearIntervalFn = clearInterval,
	} = {}) {
		super();

		this.write = write;
		this.getSettings = getSettings;
		this.getStatus = getStatus;
		this.getHomingFlag = getHomingFlag;
		this.canStream = canStream;
		this.lineFilter = lineFilter;
		this.softLimitsEnabled =
			softLimitsEnabled || ((settings) => settings.$20 === "1");
		this.log = log;
		this.rxBufferSize = rxBufferSize;
		this.now = now;
		this.setIntervalFn = setIntervalFn;
		this.clearIntervalFn = clearIntervalFn;

		this.acksConsumed = 0;
		this.acksOrphaned = 0;

		this._resetState();
	}

	_resetState() {
		this.state = JOG_STATE_IDLE;
		this.mode = null;
		this.dir = { X: 0, Y: 0, Z: 0, A: 0 };
		this.work = { X: 0, Y: 0, Z: 0, A: 0 };
		this.limit = { X: Infinity, Y: Infinity, Z: Infinity, A: Infinity };
		this.residual = { X: 0, Y: 0, Z: 0, A: 0 };
		this.requestedFeedrate = 0;
		this.plan = null;
		this.pending = [];
		this.pendingBytes = 0;
		this.pendingTime = 0;
		this.plannerFree = null;
		this.tick = null;
		this.emittedUntil = 0;
		this.startedAt = 0;
		this.deadlineAt = 0;
		this.drainDeadlineAt = 0;
		this.warnedStarved = false;
		this.announcedFeedrate = 0;
		this.announcedAt = 0;
	}

	isActive() {
		return this.state !== JOG_STATE_IDLE;
	}

	isStreaming() {
		return this.state === JOG_STATE_STREAMING;
	}

	get rxBudget() {
		return Math.max(this.rxBufferSize - RX_MARGIN_BYTES, 32);
	}

	// ---- public control ---------------------------------------------------

	/**
	 * Begin streaming in the given direction until stopped.
	 * @param {object} axes  direction vector; only the sign of each axis matters
	 */
	start({ axes = {}, feedrate = 1000, units = "mm" } = {}) {
		if (!this.canStream()) {
			this._warn("Refusing to start a jog stream: preconditions not met");
			return false;
		}

		const direction = ALL_AXES.reduce((acc, axis) => {
			acc[axis] = Math.sign(toNumber(axes[axis] ?? axes[axis.toLowerCase()]));
			return acc;
		}, {});

		if (ALL_AXES.every((axis) => direction[axis] === 0)) {
			return false;
		}

		this._resetState();
		this.mode = JOG_MODE_VELOCITY;
		this.dir = direction;
		this.work = ALL_AXES.reduce((acc, axis) => {
			acc[axis] = direction[axis] * Infinity;
			return acc;
		}, {});

		this._setFeedrate(feedrate, units);
		this._refreshTravelBudget();
		this._replan();

		this._beginStreaming();
		this.emit("start", {
			mode: this.mode,
			direction,
			feedrate: this.plan.feedrate,
			summary: this._startedMessage(),
		});
		return true;
	}

	/**
	 * Retarget an in-flight stream. Direction and speed change without a jog
	 * cancel, so a joystick can be swept around without the machine stopping.
	 */
	update({ axes = {}, feedrate } = {}) {
		if (this.state !== JOG_STATE_STREAMING) {
			return false;
		}

		const direction = ALL_AXES.reduce((acc, axis) => {
			acc[axis] = Math.sign(toNumber(axes[axis] ?? axes[axis.toLowerCase()]));
			return acc;
		}, {});

		if (ALL_AXES.every((axis) => direction[axis] === 0)) {
			return false;
		}

		const changedDirection = ALL_AXES.some(
			(axis) => direction[axis] !== this.dir[axis],
		);

		this.dir = direction;
		this.work = ALL_AXES.reduce((acc, axis) => {
			acc[axis] = direction[axis] * Infinity;
			return acc;
		}, {});

		if (feedrate !== undefined) {
			this._setFeedrate(feedrate, this.units);
		}
		if (changedDirection) {
			this.residual = { X: 0, Y: 0, Z: 0, A: 0 };
			this._refreshTravelBudget();
		}
		this._replan();
		this._announceFeedrate();
		this.deadlineAt = this.now() + MAX_STREAM_DURATION_MS;
		return true;
	}

	/**
	 * Add distance to the outstanding work, starting a stream if needed.
	 *
	 * This is what an MPG handwheel drives: each pulse tops up a budget the
	 * streamer is already draining, so a continuous spin produces continuous
	 * motion rather than one accel/decel cycle per pulse.
	 */
	feed({ axes = {}, feedrate, units = "mm" } = {}) {
		const distances = ALL_AXES.reduce((acc, axis) => {
			acc[axis] = toNumber(axes[axis] ?? axes[axis.toLowerCase()]);
			return acc;
		}, {});

		if (ALL_AXES.every((axis) => distances[axis] === 0)) {
			return false;
		}

		const scale = units === "mm" ? 1 : 25.4;

		const starting = this.state !== JOG_STATE_STREAMING;

		if (starting) {
			if (!this.canStream()) {
				this._warn("Refusing to start a jog stream: preconditions not met");
				return false;
			}
			this._resetState();
			this.mode = JOG_MODE_DISPLACEMENT;
			this.work = { X: 0, Y: 0, Z: 0, A: 0 };
			this._setFeedrate(feedrate ?? DEFAULT_FEEDRATE, units);
		} else if (this.mode !== JOG_MODE_DISPLACEMENT) {
			// A handwheel pulse arriving mid-velocity-jog is not meaningful.
			return false;
		} else if (feedrate !== undefined) {
			this._setFeedrate(feedrate, units);
		}

		ALL_AXES.forEach((axis) => {
			// Reversing direction discards the opposing remainder rather than
			// letting it cancel out, so the wheel always feels responsive.
			if (
				distances[axis] !== 0 &&
				Math.sign(distances[axis]) !== Math.sign(this.work[axis])
			) {
				this.work[axis] = 0;
				this.residual[axis] = 0;
			}
			this.work[axis] += distances[axis] * scale;
		});

		this.dir = ALL_AXES.reduce((acc, axis) => {
			acc[axis] = Math.sign(this.work[axis]);
			return acc;
		}, {});

		this._refreshTravelBudget();
		this._replan();

		if (starting) {
			this._beginStreaming();
			this.emit("start", {
				mode: this.mode,
				feedrate: this.plan.feedrate,
				summary: this._startedMessage(),
			});
		} else {
			this.deadlineAt = this.now() + MAX_STREAM_DURATION_MS;
		}
		return true;
	}

	/**
	 * Stop producing segments. The caller is responsible for the 0x85 jog
	 * cancel - we stay alive to absorb the acks for lines already in flight.
	 */
	stop() {
		if (this.state !== JOG_STATE_STREAMING) {
			return false;
		}
		this.state = JOG_STATE_DRAINING;
		this.drainDeadlineAt = this.now() + DRAIN_TIMEOUT_MS;
		this.emit("stop");
		this._settleIfDrained();
		return true;
	}

	abort(reason = "abort") {
		if (this.state === JOG_STATE_IDLE) {
			return false;
		}
		this._stopTimer();
		const hadPending = this.pending.length > 0;
		this._resetState();
		this.emit("abort", reason);
		this._debug(`Jog stream aborted (${reason})`);
		return hadPending;
	}

	// ---- controller hooks -------------------------------------------------

	/**
	 * Consume one ack, if it belongs to us.
	 * @returns {boolean} true when the ack was ours and must not reach the feeder
	 */
	ack() {
		if (this.pending.length === 0) {
			return false;
		}
		const segment = this.pending.shift();
		this.pendingBytes -= segment.bytes;
		this.pendingTime -= segment.dt;
		this.acksConsumed += 1;
		this._settleIfDrained();
		return true;
	}

	/**
	 * Claim an error that belongs to a streamed jog line, so it is not
	 * mis-attributed to the feeder or counted against a running file.
	 */
	onError() {
		if (!this.isActive() || this.pending.length === 0) {
			return false;
		}
		this.acksOrphaned += this.pending.length;
		return true;
	}

	/**
	 * Fold a fresh status report into the stream: the reported position is the
	 * truth our locally decremented travel budget is only estimating.
	 */
	onStatus(status = {}) {
		if (!this.isActive()) {
			return;
		}

		const activeState = status.activeState;
		if (activeState && BLOCKING_STATES.includes(activeState)) {
			this.abort(`state:${activeState}`);
			return;
		}

		const planner = status.buf?.planner;
		this.plannerFree = Number.isFinite(planner) ? planner : null;

		// grblHAL's receive buffer is larger than the floor we assume; take the
		// firmware's word for it once it tells us.
		const rx = status.buf?.rx;
		if (Number.isFinite(rx) && rx > this.rxBufferSize) {
			this.rxBufferSize = rx;
		}

		if (this.state === JOG_STATE_STREAMING) {
			this._refreshTravelBudget();
			// Settings can land mid-jog: Grbl re-issues $$ on every idle status
			// until something parses, so a jog started before then would
			// otherwise keep its assumed acceleration for its whole duration.
			// Segments are independent, so a changed dt applies cleanly.
			this._replan();
		}
	}

	toJSON() {
		return {
			state: this.state,
			mode: this.mode,
			feedrate: this.plan?.feedrate ?? 0,
			dt: this.plan?.dt ?? 0,
			pending: this.pending.length,
			pendingBytes: this.pendingBytes,
			acksConsumed: this.acksConsumed,
			acksOrphaned: this.acksOrphaned,
		};
	}

	// ---- internals --------------------------------------------------------

	_setFeedrate(feedrate, units) {
		this.units = units;
		const value = toNumber(feedrate, NaN);
		// A missing or non-positive feedrate used to fall through the clamp in
		// computeSegmentPlan and come out as F1, which reads as a hang. Keep
		// whatever we were already running at instead.
		if (!Number.isFinite(value) || value <= 0) {
			this._warn(`Ignoring invalid jog feedrate: ${feedrate}`);
			if (!this.requestedFeedrate) {
				this.requestedFeedrate = DEFAULT_FEEDRATE;
			}
			return;
		}
		// Everything downstream is millimetres, so convert once, here.
		this.requestedFeedrate = units === "mm" ? value : value * 25.4;
	}

	_settings() {
		return (this.getSettings && this.getSettings()) || {};
	}

	_refreshTravelBudget() {
		const settings = this._settings();
		const status = (this.getStatus && this.getStatus()) || {};

		this.limit = computeTravelBudget({
			direction: this.dir,
			settings,
			mpos: status.mpos || {},
			homingFlagSet: this.getHomingFlag(),
			softLimitsEnabled: this.softLimitsEnabled(settings),
		});
	}

	_replan() {
		const settings = this._settings();

		this.plan = computeSegmentPlan({
			dir: this.dir,
			feedrate: this.requestedFeedrate,
			accelByAxis: {
				X: settings.$120,
				Y: settings.$121,
				Z: settings.$122,
				// grbl's 3 axis builds have no rotary acceleration setting, so Y
				// stands in for it.
				A: settings.$123 ?? settings.$121,
			},
			maxRateByAxis: {
				X: settings.$110,
				Y: settings.$111,
				Z: settings.$112,
				A: settings.$113 ?? settings.$111,
			},
			rxBudget: this.rxBudget,
		});

		// Only complain about acceleration the firmware actually gave us -
		// otherwise every board with an unparsed $$ is told off for figures it
		// never supplied.
		if (this.plan.starved && this.plan.accelReported && !this.warnedStarved) {
			this.warnedStarved = true;
			this._warn(
				`Jog feedrate ${Math.round(this.plan.feedrate)} exceeds what this machine's acceleration can hold at a constant speed; the firmware will decelerate between segments.`,
			);
		}
	}

	_beginStreaming() {
		this.state = JOG_STATE_STREAMING;
		this.startedAt = this.now();
		this.deadlineAt = this.startedAt + MAX_STREAM_DURATION_MS;
		// The start line already carries the speed, so it counts as announced.
		this.announcedFeedrate = Math.round(this.plan.feedrate);
		this.announcedAt = this.startedAt;
		this.emittedUntil = this.startedAt;
		this._pump();
		this.tick = this.setIntervalFn(() => this._onTick(), TICK_MS);
	}

	_stopTimer() {
		if (this.tick) {
			this.clearIntervalFn(this.tick);
			this.tick = null;
		}
	}

	_settleIfDrained() {
		if (this.state !== JOG_STATE_DRAINING) {
			return;
		}
		if (this.pending.length === 0) {
			this._stopTimer();
			this._resetState();
			this.emit("idle");
			return;
		}
		if (this.now() > this.drainDeadlineAt) {
			this.acksOrphaned += this.pending.length;
			this._warn(
				`Timed out waiting for ${this.pending.length} jog ack(s); clearing`,
			);
			this._stopTimer();
			this._resetState();
			this.emit("idle");
		}
	}

	_onTick() {
		if (this.state === JOG_STATE_DRAINING) {
			this._settleIfDrained();
			return;
		}
		if (this.state !== JOG_STATE_STREAMING) {
			return;
		}
		if (!this.canStream()) {
			this.abort("preconditions");
			return;
		}
		if (this.now() > this.deadlineAt) {
			this.abort("watchdog");
			return;
		}
		this._pump();
	}

	/**
	 * Emit segments until the commanded timeline runs tLook ahead of the wall
	 * clock, or a backpressure gate stops us.
	 *
	 * The lead is the whole point: motion commanded at exactly 1x real time
	 * leaves the planner with a single block, grbl plans a stop at the end of
	 * it, and the jog stutters. Anything queued beyond the operator's release
	 * is discarded by the 0x85 jog cancel the caller sends on stop().
	 */
	_pump() {
		const leadMs = this.plan.tLook * 1000;
		for (let i = 0; i < MAX_INFLIGHT_LINES; i += 1) {
			if (this.state !== JOG_STATE_STREAMING) {
				return;
			}
			if (this.emittedUntil - this.now() >= leadMs) {
				return;
			}
			if (!this._emitSegment()) {
				return;
			}
		}
	}

	/**
	 * Emit one segment. Returns true when a line was scheduled, false when a
	 * gate or the end of the work stopped us.
	 */
	_emitSegment() {
		const now = this.now();
		// Time the schedule has fallen behind the wall clock, if any. A lead is
		// the normal case and is not owed time.
		const owed = Math.max(0, now - this.emittedUntil);

		const { dt, feedrate } = this.plan;

		// Backpressure. When any gate trips we forfeit the owed time rather
		// than banking it, so resuming never produces a burst of catch-up
		// motion the operator did not ask for.
		const estimatedBytes = 40;
		if (this.pendingBytes + estimatedBytes > this.rxBudget) {
			this.emittedUntil = Math.max(this.emittedUntil, now);
			return false;
		}
		if (this.pendingTime > this.plan.tLook * OVERRUN_FACTOR) {
			this.emittedUntil = Math.max(this.emittedUntil, now);
			return false;
		}
		if (this.pending.length >= this.plan.inflight) {
			this.emittedUntil = Math.max(this.emittedUntil, now);
			return false;
		}
		if (this.plannerFree !== null && this.plannerFree < PLANNER_LOW_WATER) {
			this.emittedUntil = Math.max(this.emittedUntil, now);
			return false;
		}

		// A late tick is covered by one longer segment. This is safe because
		// velocity is set by the F word, not by how often we emit.
		const dtEff = Math.min(dt + owed / 1000, DT_MAX_CATCHUP);
		const v = feedrate / 60;

		const unit = this._unitVector();
		const distances = {};
		let exhausted = true;

		ALL_AXES.forEach((axis) => {
			if (!unit[axis]) {
				distances[axis] = 0;
				return;
			}

			let distance = unit[axis] * v * dtEff;

			// Never command past the remaining work or the soft limit.
			const remainingWork = this.work[axis];
			if (Number.isFinite(remainingWork)) {
				distance =
					Math.sign(distance) *
					Math.min(Math.abs(distance), Math.abs(remainingWork));
			}
			const remainingTravel = this.limit[axis];
			if (Number.isFinite(remainingTravel)) {
				distance =
					Math.sign(distance) *
					Math.min(Math.abs(distance), Math.abs(remainingTravel));
			}

			if (Math.abs(distance) > MIN_MOTION_MM) {
				exhausted = false;
			}
			distances[axis] = distance;
		});

		if (exhausted) {
			this._onExhausted();
			return false;
		}

		// Carry sub-precision remainders forward. Rounding each segment
		// independently is a systematic velocity error at low feedrates.
		const commanded = {};
		let hasMotion = false;
		ALL_AXES.forEach((axis) => {
			if (!distances[axis]) {
				commanded[axis] = 0;
				return;
			}
			const raw = this.residual[axis] + distances[axis];
			const out = round(raw);
			this.residual[axis] = raw - out;
			commanded[axis] = out;
			if (out !== 0) {
				hasMotion = true;
			}
		});

		if (!hasMotion) {
			// Everything rounded away; let it accumulate into the next tick.
			return false;
		}

		const line = this._formatLine(commanded, feedrate);
		const filtered = this.lineFilter(line);
		if (!filtered) {
			this._advanceSchedule(now, dtEff);
			return true;
		}

		this.write(`${filtered}\n`);

		this.pending.push({ bytes: filtered.length + 1, dt: dtEff });
		this.pendingBytes += filtered.length + 1;
		this.pendingTime += dtEff;

		ALL_AXES.forEach((axis) => {
			if (!commanded[axis]) {
				return;
			}
			if (Number.isFinite(this.work[axis])) {
				this.work[axis] -= commanded[axis];
			}
			if (Number.isFinite(this.limit[axis])) {
				this.limit[axis] -= commanded[axis];
			}
		});

		this._advanceSchedule(now, dtEff);
		return true;
	}

	// Extend the commanded timeline. When we have fallen behind, the forfeited
	// backlog is dropped rather than banked, so resuming never produces a burst
	// of catch-up motion the operator did not ask for.
	_advanceSchedule(now, dtEff) {
		this.emittedUntil = Math.max(this.emittedUntil, now) + dtEff * 1000;
	}

	_onExhausted() {
		if (this.mode === JOG_MODE_DISPLACEMENT) {
			// The wheel stopped turning. Leave the last segment to finish on its
			// own so a further pulse blends straight in, with no jog cancel.
			this.state = JOG_STATE_DRAINING;
			this.drainDeadlineAt = this.now() + DRAIN_TIMEOUT_MS;
			this.emit("drained");
			this._settleIfDrained();
			return;
		}

		// Velocity mode only runs out of distance at a soft limit.
		this.state = JOG_STATE_DRAINING;
		this.drainDeadlineAt = this.now() + DRAIN_TIMEOUT_MS;
		this.emit("limit");
		this._settleIfDrained();
	}

	_unitVector() {
		const source =
			this.mode === JOG_MODE_DISPLACEMENT
				? ALL_AXES.reduce((acc, axis) => {
						acc[axis] = this.work[axis];
						return acc;
					}, {})
				: this.dir;

		const magnitude = Math.hypot(
			...LINEAR_AXES.map((axis) => source[axis] || 0),
		);

		const unit = {};
		LINEAR_AXES.forEach((axis) => {
			unit[axis] = magnitude > 0 ? (source[axis] || 0) / magnitude : 0;
		});
		// A is rotary; it does not share the linear feedrate vector.
		unit.A = Math.sign(source.A || 0);
		return unit;
	}

	_formatLine(distances, feedrate) {
		const words = ALL_AXES.filter((axis) => distances[axis] !== 0)
			.map((axis) => `${axis}${distances[axis]}`)
			.join("");

		// Parity with the previous handlers, which slowed any move involving Z.
		const derated = distances.Z ? feedrate * Z_FEEDRATE_DERATE : feedrate;

		return `$J=G21G91${words}F${round(derated)}`;
	}

	/**
	 * The console messages this service writes. One family, one prefix, so the
	 * whole life of a jog reads as a single conversation in the terminal.
	 */
	_startedMessage() {
		const active = ALL_AXES.filter((axis) => this.dir[axis])
			.map((axis) => `${axis}${this.dir[axis] > 0 ? "+" : "-"}`)
			.join(" ");
		const feedrate = Math.round(this.plan?.feedrate ?? this.requestedFeedrate);
		return `Jogging service started ${active || "-"} at F${feedrate}`;
	}

	/**
	 * Announce a change in the speed the machine is actually being given, which
	 * is not always the speed that was asked for - it is clamped against each
	 * axis' max rate first.
	 */
	_announceFeedrate() {
		const feedrate = Math.round(this.plan.feedrate);
		if (feedrate === this.announcedFeedrate) {
			return;
		}
		const now = this.now();
		if (now - this.announcedAt < FEEDRATE_ANNOUNCE_INTERVAL_MS) {
			return;
		}
		this.announcedFeedrate = feedrate;
		this.announcedAt = now;
		this.emit("feedrate", {
			feedrate,
			summary: `Jogging service now at F${feedrate}`,
		});
	}

	_warn(message) {
		this.log?.warn?.(message);
	}

	_debug(message) {
		this.log?.debug?.(message);
	}
}
