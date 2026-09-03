/**
 * Per-connection engine that runs plugin-supplied parsers against every raw
 * firmware line.
 *
 * It is fed from the controller's `runner.on("raw")` listener, which fires for
 * EVERY line before any built-in parsing. That placement is deliberate:
 *
 *   - It is lossless. serialport:read is emitted per-branch and several
 *     branches (status, json, description, alarmDetail, groupDetail) never emit
 *     it at all, so it cannot be used as a general tap.
 *   - It is observe-only. Nothing here can consume a line, alter built-in
 *     parsing, change machine state tracking, or touch the console feed.
 *   - It is isolated. A throw on a listener cannot break Runner.parse(), and we
 *     additionally swallow everything in feed().
 *
 * Only matches cross the socket, so the console keeps its curated feed and a
 * plugin cannot turn the serial stream into a firehose.
 */

import { STATUS_REPORT_PATTERN, validateParserSpecs } from "./specSchema.js";

const SWEEP_INTERVAL_MS = 250;

// A single match that takes this long is pathological on a <200 char line;
// quarantine immediately.
const PARSER_KILL_MS = 50;
// Repeatedly slow-but-not-fatal matches also earn a quarantine.
const PARSER_SLOW_MS = 2;
const PARSER_SLOW_LIMIT = 20;

// A parser matching "^" would otherwise emit 4/sec from status polling alone at
// idle, and one per G-code line during a job.
const MAX_EMITS_PER_SEC = 20;

const OK_PATTERN = /^ok$/;
const ERROR_PATTERN = /^error:\s*\d+/;

const nowMs = () => Date.now();

const hrMs = (start) => Number(process.hrtime.bigint() - start) / 1e6;

const namedGroups = (result) => ({ ...(result?.groups ?? {}) });

const numberedGroups = (result) =>
	result ? result.slice(1).map((value) => (value === undefined ? null : value)) : [];

class PluginParserChain {
	/**
	 * @param {object} deps
	 * @param {(eventName: string, payload: object) => void} deps.emit
	 * @param {() => string|undefined} deps.getWorkflowState
	 * @param {object} deps.log
	 */
	constructor({ emit, getWorkflowState, log }) {
		this.emitEvent = emit;
		this.getWorkflowState = getWorkflowState || (() => undefined);
		this.log = log || console;

		/** @type {object[]} */
		this.parsers = [];
		this.capture = null;
		this.sweepTimer = null;
	}

	// --- registration ---------------------------------------------------------

	ensureSweep() {
		// A capture with no registered parsers still needs the timer, or a query
		// whose response never arrives would never time out.
		if (this.sweepTimer || (this.parsers.length === 0 && !this.capture)) {
			return;
		}
		this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
		// Never hold the process open for a plugin's timeout bookkeeping.
		this.sweepTimer.unref?.();
	}

	/**
	 * Replaces every manifest-declared parser. Runtime registrations are left
	 * alone — they belong to a live iframe, not to the registry.
	 *
	 * @param {object[]} specs Each carrying its own `pluginId`.
	 */
	setManifestParsers(specs = []) {
		this.parsers
			.filter((parser) => parser.origin === "manifest")
			.forEach((parser) => this.flushBlock(parser, false, "reload"));

		this.parsers = this.parsers.filter((parser) => parser.origin !== "manifest");

		const byPlugin = new Map();
		specs.forEach((spec) => {
			const pluginId = spec?.pluginId;
			if (!pluginId) {
				return;
			}
			if (!byPlugin.has(pluginId)) {
				byPlugin.set(pluginId, []);
			}
			byPlugin.get(pluginId).push(spec);
		});

		byPlugin.forEach((pluginSpecs, pluginId) => {
			const { parsers, errors, warnings } = validateParserSpecs(pluginSpecs, {
				pluginId,
				ownerId: `manifest:${pluginId}`,
				origin: "manifest",
			});

			this.parsers.push(...parsers);
			errors.forEach(({ id, error }) =>
				this.reportSpecProblem(pluginId, id, "invalid-spec", error),
			);
			warnings.forEach(({ id, warning }) =>
				this.log.warn?.(
					`plugin parser ${pluginId}/${id}: ${warning}`,
				),
			);
		});

		this.ensureSweep();
	}

	/**
	 * @param {string} ownerId Identifies the registering iframe instance.
	 * @returns {{ registered: string[], errors: {id: string, error: string}[], warnings: {id: string, warning: string}[] }}
	 */
	registerRuntime(ownerId, pluginId, specs = []) {
		const { parsers, errors, warnings } = validateParserSpecs(specs, {
			pluginId,
			ownerId,
			origin: "runtime",
		});

		parsers.forEach((parser) => {
			// Re-registering the same id from the same owner replaces it.
			this.removeWhere(
				(existing) =>
					existing.ownerId === ownerId && existing.parserId === parser.parserId,
				"reload",
			);
			this.parsers.push(parser);
		});

		this.ensureSweep();

		return {
			registered: parsers.map((parser) => parser.parserId),
			errors,
			warnings,
		};
	}

	/**
	 * @param {string} ownerId
	 * @param {string} [parserId] Omit to drop every parser for that owner.
	 */
	unregisterRuntime(ownerId, parserId) {
		this.removeWhere(
			(parser) =>
				parser.origin === "runtime" &&
				parser.ownerId === ownerId &&
				(parserId === undefined || parser.parserId === parserId),
			"close",
		);
		return { ok: true };
	}

	removeWhere(predicate, reason) {
		const kept = [];
		this.parsers.forEach((parser) => {
			if (predicate(parser)) {
				this.flushBlock(parser, false, reason);
			} else {
				kept.push(parser);
			}
		});
		this.parsers = kept;
	}

	// --- the hot path ---------------------------------------------------------

	/**
	 * Runs one raw firmware line through every registered parser.
	 *
	 * NEVER throws. The caller is the serial read path.
	 */
	feed(line) {
		try {
			this.sweep();

			for (const parser of this.parsers) {
				if (parser.quarantined) {
					continue;
				}
				if (
					parser.whenWorkflow === "idle" &&
					this.getWorkflowState() !== "idle"
				) {
					continue;
				}

				const started = process.hrtime.bigint();
				try {
					if (parser.mode === "line") {
						this.feedLineParser(parser, line);
					} else {
						this.feedBlockParser(parser, line);
					}
				} finally {
					this.chargeTime(parser, hrMs(started));
				}
			}

			this.capture?.feed(line);
		} catch (err) {
			this.log.error?.(
				`plugin parser chain failed on "${line}": ${err.message}`,
			);
		}
	}

	chargeTime(parser, elapsedMs) {
		if (elapsedMs > PARSER_KILL_MS) {
			this.quarantine(
				parser,
				`a single match took ${elapsedMs.toFixed(1)}ms`,
			);
			return;
		}
		if (elapsedMs > PARSER_SLOW_MS) {
			parser.slowHits += 1;
			if (parser.slowHits > PARSER_SLOW_LIMIT) {
				this.quarantine(
					parser,
					`matched slower than ${PARSER_SLOW_MS}ms on ${parser.slowHits} lines`,
				);
			}
		}
	}

	quarantine(parser, message) {
		if (parser.quarantined) {
			return;
		}
		parser.quarantined = true;
		this.flushBlock(parser, false, "close");
		this.log.error?.(
			`plugin parser ${parser.pluginId}/${parser.parserId} quarantined: ${message}`,
		);
		this.reportSpecProblem(
			parser.pluginId,
			parser.parserId,
			"quarantined",
			message,
		);
	}

	feedLineParser(parser, line) {
		const result = parser.match.exec(line);
		if (!result) {
			return;
		}
		this.emitMatch(parser, {
			line,
			lines: [line],
			groups: namedGroups(result),
			captures: numberedGroups(result),
			entries: [],
			complete: true,
			reason: "match",
			startedAt: nowMs(),
			endedAt: nowMs(),
		});
	}

	isIgnored(parser, line) {
		if (parser.ignore?.test(line)) {
			return true;
		}
		return parser.ignoreStatusReports && STATUS_REPORT_PATTERN.test(line);
	}

	isTerminator(parser, line) {
		if (parser.end?.test(line)) {
			return true;
		}
		if (parser.untilKind === "ok") {
			return OK_PATTERN.test(line);
		}
		if (parser.untilKind === "error") {
			return ERROR_PATTERN.test(line);
		}
		if (parser.untilKind === "ok-or-error") {
			return OK_PATTERN.test(line) || ERROR_PATTERN.test(line);
		}
		return false;
	}

	feedBlockParser(parser, line) {
		if (parser.block === null) {
			const opened = parser.begin.exec(line);
			if (!opened) {
				return;
			}
			parser.block = {
				lines: [line],
				entries: [],
				groups: namedGroups(opened),
				captures: numberedGroups(opened),
				startedAt: nowMs(),
			};
			this.collectEntry(parser, line);
			// A one-line block is legal — the opening line may also close it.
			if (this.isTerminator(parser, line)) {
				this.flushBlock(parser, true, parser.end ? "end" : "until");
			}
			return;
		}

		// Interleaved noise (a status report, by default) is dropped without
		// terminating the block and without counting toward maxLines. grblHAL
		// polls status every 250ms, so without this essentially every multi-line
		// response would be corrupted.
		if (this.isIgnored(parser, line)) {
			return;
		}

		if (this.isTerminator(parser, line)) {
			parser.block.lines.push(line);
			this.collectEntry(parser, line);
			this.flushBlock(parser, true, parser.end ? "end" : "until");
			return;
		}

		if (parser.restartOnBegin && parser.begin.test(line)) {
			this.flushBlock(parser, false, "restart");
			this.feedBlockParser(parser, line);
			return;
		}

		if (parser.strict && !(parser.match && parser.match.test(line))) {
			this.flushBlock(parser, false, "strict");
			return;
		}

		parser.block.lines.push(line);
		this.collectEntry(parser, line);

		if (parser.block.lines.length >= parser.maxLines) {
			this.flushBlock(parser, false, "maxLines");
		}
	}

	collectEntry(parser, line) {
		if (!parser.match) {
			return;
		}
		const result = parser.match.exec(line);
		if (!result) {
			return;
		}
		parser.block.entries.push({
			line,
			groups: namedGroups(result),
			captures: numberedGroups(result),
		});
	}

	flushBlock(parser, complete, reason) {
		const block = parser.block;
		if (!block) {
			return;
		}
		parser.block = null;

		if (!complete && !parser.emitPartial) {
			return;
		}

		this.emitMatch(parser, {
			line: null,
			lines: block.lines,
			groups: block.groups,
			captures: block.captures,
			entries: block.entries,
			complete,
			reason,
			startedAt: block.startedAt,
			endedAt: nowMs(),
		});
	}

	emitMatch(parser, payload) {
		if (!this.withinEmitBudget(parser)) {
			return;
		}
		parser.seq += 1;
		this.emitEvent("plugin:parser:match", {
			pluginId: parser.pluginId,
			parserId: parser.parserId,
			mode: parser.mode,
			seq: parser.seq,
			...payload,
		});
	}

	withinEmitBudget(parser) {
		const now = nowMs();
		if (now - parser.emitWindowStart >= 1000) {
			parser.emitWindowStart = now;
			parser.emitCount = 0;
			parser.rateLimitReported = false;
		}
		parser.emitCount += 1;
		if (parser.emitCount <= MAX_EMITS_PER_SEC) {
			return true;
		}
		if (!parser.rateLimitReported) {
			parser.rateLimitReported = true;
			this.reportSpecProblem(
				parser.pluginId,
				parser.parserId,
				"rate-limited",
				`more than ${MAX_EMITS_PER_SEC} matches in one second — further matches in this window were dropped`,
			);
		}
		return false;
	}

	reportSpecProblem(pluginId, parserId, reason, message) {
		this.emitEvent("plugin:parser:error", {
			pluginId,
			parserId,
			reason,
			message,
		});
	}

	// --- timeouts and teardown ------------------------------------------------

	/**
	 * Flushes blocks and captures that have outlived their timeout. Driven by an
	 * interval, and also called at the top of feed() so a busy line rate flushes
	 * promptly rather than waiting for the next tick.
	 */
	sweep() {
		const now = nowMs();

		this.parsers.forEach((parser) => {
			if (parser.block && now - parser.block.startedAt >= parser.timeoutMs) {
				this.flushBlock(parser, false, "timeout");
			}
		});

		if (this.capture && now - this.capture.startedAt >= this.capture.timeoutMs) {
			this.capture.finish(false, "timeout");
		}
	}

	/**
	 * Opens a one-shot capture window for machine.query(). Distinct from the
	 * parser chain: it is anchored to a write the server itself is about to
	 * perform, so it does not need a `begin` pattern.
	 *
	 * @returns {() => void} cancel
	 */
	beginCapture({
		until,
		maxLines = 200,
		timeout = 5000,
		includeStatusReports = false,
		onDone,
	}) {
		// One in flight at a time; the caller is expected to have rejected a
		// second, but never silently drop the first if it happens.
		this.capture?.finish(false, "close");

		const startedAt = nowMs();
		const lines = [];
		let settled = false;

		const finish = (complete, reason) => {
			if (settled) {
				return;
			}
			settled = true;
			this.capture = null;
			onDone({
				lines,
				ok: lines.some((line) => OK_PATTERN.test(line)),
				error:
					lines.find((line) => ERROR_PATTERN.test(line)) ?? undefined,
				complete,
				reason,
				durationMs: nowMs() - startedAt,
			});
		};

		const matchesUntil = (line) => {
			if (until instanceof RegExp) {
				return until.test(line);
			}
			if (until === "ok") {
				return OK_PATTERN.test(line);
			}
			if (until === "error") {
				return ERROR_PATTERN.test(line);
			}
			return OK_PATTERN.test(line) || ERROR_PATTERN.test(line);
		};

		this.capture = {
			startedAt,
			timeoutMs: timeout,
			finish,
			feed: (line) => {
				if (!includeStatusReports && STATUS_REPORT_PATTERN.test(line)) {
					return;
				}
				lines.push(line);
				if (matchesUntil(line)) {
					finish(true, "until");
					return;
				}
				if (lines.length >= maxLines) {
					finish(false, "maxLines");
				}
			},
		};

		this.ensureSweep();

		return () => finish(false, "close");
	}

	/**
	 * Flushes every open block so a subscriber never waits forever on a block
	 * that the port closing made impossible to finish.
	 */
	reset(reason = "close") {
		this.parsers.forEach((parser) => this.flushBlock(parser, false, reason));
		this.capture?.finish(false, reason);
		this.parsers = this.parsers.filter((parser) => parser.origin === "manifest");
	}

	destroy() {
		this.reset("close");
		this.parsers = [];
		if (this.sweepTimer) {
			clearInterval(this.sweepTimer);
			this.sweepTimer = null;
		}
	}
}

export default PluginParserChain;
