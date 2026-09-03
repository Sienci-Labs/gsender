export {
	type CameraView,
	type OverlayMarker,
	PLUGIN_BRIDGE_CHANNEL,
	type PluginBridgeRequest,
	type PluginBridgeRequestType,
	type PluginBridgeResponse,
	type PluginBridgeTopic,
	type ViewerPickEvent,
} from "./bridge.js";

import {
	type CameraView,
	getTopicSnapshot,
	type OverlayMarker,
	request,
	subscribeEvents,
	subscribeTopic,
	type ViewerPickEvent,
} from "./bridge.js";

// --- Firmware response parsers ------------------------------------------------

/** A serialized regex. Matchers run server-side, so they can never be
 * functions — pass a RegExp and the SDK converts it for you. */
export type RegexSpec = { source: string; flags?: string };

export type ParserPattern = RegExp | string | RegexSpec;

export type ParserSpec = {
	/** Unique within your plugin. This is what you pass to onParsed/useParsed. */
	id: string;
	/** "line" matches one line at a time; "block" accumulates a multi-line
	 * response between `begin` and `end`/`until`. */
	mode?: "line" | "block";
	/** Required for "line". Optional for "block", where it extracts per-line
	 * `entries` from within the block. */
	match?: ParserPattern;
	/** Block mode: opens the block. */
	begin?: ParserPattern;
	/** Block mode: closes the block. Prefer this over `until`. */
	end?: ParserPattern;
	/**
	 * Block mode terminator shorthand. Only sound while the machine is idle —
	 * during a job the firmware emits an `ok` per accepted line, so an `ok`
	 * belongs to the running job, not to your block. Pair it with
	 * `whenWorkflow: "idle"`, or use an explicit `end` pattern.
	 */
	until?: "ok" | "error" | "ok-or-error";
	/** Lines dropped from a block without closing it. */
	ignore?: ParserPattern;
	/** Drop `<...>` status reports from blocks. Defaults to true: grblHAL polls
	 * status every 250ms, so one lands inside almost every multi-line response. */
	ignoreStatusReports?: boolean;
	/** Close the block if a line matches neither `match` nor `end`. */
	strict?: boolean;
	/** Restart the block when `begin` matches again. Leave off when `begin`
	 * matches every line of the block (a `$$` dump, say). */
	restartOnBegin?: boolean;
	/** Emit blocks that ended without their terminator. Default true. */
	emitPartial?: boolean;
	/** Max lines per block. Default 64, capped at 500. */
	maxLines?: number;
	/** Milliseconds before an unfinished block is flushed. Default 2000. */
	timeout?: number;
	/** Only run this parser while the machine is idle. */
	whenWorkflow?: "any" | "idle";
	/** Shown to the user in the permissions dialog. */
	label?: string;
};

export type ParsedEntry = {
	line: string;
	groups: Record<string, string>;
	captures: Array<string | null>;
};

export type ParsedResult = {
	pluginId: string;
	parserId: string;
	mode: "line" | "block";
	/** Monotonic per parser, so two identical results stay distinguishable. */
	seq: number;
	line: string | null;
	lines: string[];
	groups: Record<string, string>;
	captures: Array<string | null>;
	entries: ParsedEntry[];
	/** False when the block ended without its terminator. */
	complete: boolean;
	reason:
		| "match"
		| "end"
		| "until"
		| "maxLines"
		| "timeout"
		| "strict"
		| "restart"
		| "close"
		| "reload";
	startedAt: number;
	endedAt: number;
};

export type ParserErrorEvent = {
	pluginId: string;
	parserId: string;
	reason: "quarantined" | "rate-limited" | "invalid-spec";
	message: string;
};

export type QueryOptions = {
	/** Defaults to "ok-or-error". Required as a RegExp when allowDuringJob. */
	until?: "ok" | "error" | "ok-or-error" | RegExp | RegexSpec;
	maxLines?: number;
	timeout?: number;
	/** Responses interleave with the running job's own. Use sparingly. */
	allowDuringJob?: boolean;
	includeStatusReports?: boolean;
};

export type QueryResult = {
	lines: string[];
	ok: boolean;
	error?: string;
	complete: boolean;
	reason: "until" | "maxLines" | "timeout" | "close" | "busy";
	durationMs: number;
};

/** Normalises a RegExp to the serialized form the wire requires. The g and y
 * flags are dropped: their lastIndex persists between calls, which would make a
 * parser match every other line. */
const toRegexSpec = (pattern: ParserPattern): RegexSpec => {
	if (typeof pattern === "string") {
		return { source: pattern };
	}
	if (pattern instanceof RegExp) {
		return { source: pattern.source, flags: pattern.flags.replace(/[gy]/g, "") };
	}
	return { source: pattern.source, flags: (pattern.flags ?? "").replace(/[gy]/g, "") };
};

const PATTERN_FIELDS = ["match", "begin", "end", "ignore"] as const;

const serializeSpec = (spec: ParserSpec): Record<string, unknown> => {
	const out: Record<string, unknown> = { ...spec };
	for (const field of PATTERN_FIELDS) {
		if (spec[field] !== undefined) {
			out[field] = toRegexSpec(spec[field] as ParserPattern);
		}
	}
	return out;
};

let anonymousParserSeq = 0;

// --- Imperative client --------------------------------------------------------

type MachineClient = {
	getContext: () => Promise<unknown>;
	command: (cmd: string, ...args: unknown[]) => Promise<unknown>;
	/**
	 * Registers a parser for the lifetime of this plugin view. For a parser that
	 * should stay live even when your UI is not mounted — so a widget elsewhere
	 * in gSender can read it the moment it appears — declare it in your
	 * manifest's "parsers" array instead.
	 */
	registerParser: (
		spec: ParserSpec,
	) => Promise<{ registered: string[]; errors: Array<unknown> }>;
	unregisterParser: (id: string) => Promise<void>;
	/** Every match, losslessly. Fires immediately with the last result if one
	 * has already arrived. Returns an unsubscribe function. */
	onParsed: (id: string, callback: (result: ParsedResult) => void) => () => void;
	/** Sugar for a one-off line parser. Returns an unsubscribe function. */
	onLine: (
		pattern: RegExp | string,
		callback: (result: ParsedResult) => void,
	) => () => void;
	/** Sends a command and collects every response line until a terminator. */
	query: (cmd: string, opts?: QueryOptions) => Promise<QueryResult>;
	setBusy: (busy: boolean, label?: string) => Promise<void>;
}
type WorkspaceClient = {
	getState: () => Promise<unknown>;
}
type ReduxClient = {
	getState: () => Promise<unknown>;
}
type GcodeClient = {
	/** Load a raw G-code program into gSender's main visualizer/job. */
	loadToVisualizer: (gcode: string, name?: string) => Promise<unknown>;
}
type StorageClient = {
	/** Get a value from this plugin's own namespaced storage. */
	get: <T = unknown>(key: string, defaultValue?: T) => Promise<T | undefined>;
	/** Set a value in this plugin's own namespaced storage. */
	set: (key: string, value: unknown) => Promise<void>;
	/** Delete a key from this plugin's own namespaced storage. */
	delete: (key: string) => Promise<void>;
	/** Get this plugin's entire namespaced storage object. */
	getAll: <T = Record<string, unknown>>(defaultValue?: T) => Promise<T>;
	/** Replace this plugin's entire namespaced storage object. */
	setAll: (value: Record<string, unknown>) => Promise<void>;
	/** Clear this plugin's entire namespaced storage object. */
	clear: () => Promise<void>;
}
type ViewerClient = {
	/** Project a screen pixel onto the visualizer's work plane. */
	screenToWorld: (
		px: number,
		py: number,
	) => Promise<{ x: number; y: number; z: number } | null>;
	/** Project a world coordinate to a screen pixel. */
	worldToScreen: (
		x: number,
		y: number,
		z?: number,
	) => Promise<{ x: number; y: number } | null>;
	camera: {
		/** Snap the host camera to a preset view. */
		set: (view: CameraView) => Promise<void>;
		/** Lock/unlock camera rotation on the host visualizer. */
		lockRotate: (locked: boolean) => Promise<void>;
	};
	/**
	 * Arm point-picking on the host visualizer. Subscribes to pick events
	 * first, then arms; resolves to a disposer that disarms and unsubscribes.
	 * Rejects if the host refuses to arm (see preconditions in the README).
	 */
	armPick: (
		mode: "click" | "hold",
		cb: (e: ViewerPickEvent) => void,
	) => Promise<() => void>;
	/** Disarm point-picking (fire-and-forget on the host). */
	disarmPick: () => Promise<void>;
	/** Replace the overlay markers drawn on the host visualizer. */
	setOverlay: (markers: OverlayMarker[]) => Promise<void>;
}
type GsenderClient = {
	machine: MachineClient;
	workspace: WorkspaceClient;
	redux: ReduxClient;
	gcode: GcodeClient;
	viewer: ViewerClient;
};

const createMachineClient = (): MachineClient => ({
	getContext: () => request("machine:get:context"),
	command: (cmd, ...args) => request("machine:command", { cmd, args }),

	registerParser: (spec) =>
		request("machine:parser:register", { spec: serializeSpec(spec) }),

	unregisterParser: (id) =>
		request("machine:parser:unregister", { id }).then(() => undefined),

	onParsed: (id, callback) => {
		const unsubscribe = subscribeEvents("parser", (payload) => {
			const result = payload as ParsedResult & { reason?: string };
			// The same topic carries error events; those go to onParserError.
			if (result?.parserId === id && Array.isArray(result?.lines)) {
				callback(result);
			}
		});

		// Mirrors subscribeWorkspaceState: deliver what we already know straight
		// away, so a late-mounting view is populated without waiting for the
		// machine to repeat itself.
		const last = getLastParsed(id);
		if (last) {
			callback(last);
		}

		return unsubscribe;
	},

	onLine: (pattern, callback) => {
		const id = `__anon${++anonymousParserSeq}`;
		const off = machine.onParsed(id, callback);

		void machine
			.registerParser({ id, mode: "line", match: pattern })
			.catch((err) => {
				console.warn(`[gsender] onLine registration failed: ${err.message}`);
			});

		return () => {
			off();
			void machine.unregisterParser(id).catch(() => {});
		};
	},

	query: (cmd, opts) =>
		request<QueryResult>("machine:query", {
			cmd,
			opts: opts
				? {
						...opts,
						until:
							opts.until instanceof RegExp || typeof opts.until === "object"
								? toRegexSpec(opts.until as ParserPattern)
								: opts.until,
					}
				: {},
			// A query waits on the machine, so give it room beyond its own timeout
			// before the bridge gives up on it.
		}, { timeoutMs: (opts?.timeout ?? 5000) + 15_000 }),

	setBusy: async (busy, label) => {
		await request("machine:busy:set", { busy, label });
	},
});
const createViewerClient = (): ViewerClient => ({
	screenToWorld: (px, py) =>
		request<{ x: number; y: number; z: number } | null>(
			"viewer:screen-to-world",
			{ px, py },
		),
	worldToScreen: (x, y, z) =>
		request<{ x: number; y: number } | null>("viewer:world-to-screen", {
			x,
			y,
			z,
		}),
	camera: {
		set: async (view) => {
			await request("viewer:camera:set", { view });
		},
		lockRotate: async (locked) => {
			await request("viewer:camera:lock-rotate", { locked });
		},
	},
	armPick: async (mode, cb) => {
		// Subscribe FIRST so no pick event is missed between arm and the
		// first host push.
		const notify = () => {
			const event = getTopicSnapshot<ViewerPickEvent>("viewer");
			if (event !== undefined) {
				cb(event);
			}
		};
		const unsubscribe = subscribeTopic("viewer", notify);

		try {
			await request("viewer:pick:arm", { mode });
		} catch (error) {
			unsubscribe();
			throw error;
		}

		return () => {
			unsubscribe();
			// Fire-and-forget; swallow errors (host may already be gone).
			request("viewer:pick:disarm").catch(() => {});
		};
	},
	disarmPick: async () => {
		await request("viewer:pick:disarm");
	},
	setOverlay: async (markers) => {
		await request("viewer:overlay:set", { markers });
	},
});
const createWorkspaceClient = (): WorkspaceClient => ({
	getState: () => request("workspace:get:state"),
});
const createReduxClient = (): ReduxClient => ({
	getState: () => request("redux:get:state"),
});
const createGcodeClient = (): GcodeClient => ({
	loadToVisualizer: (gcode, name) =>
	request("gcode:load:to:visualizer", { gcode, name }),
})
// Not part of `gsender`/`GsenderClient` on purpose: capability grants are
// derived from a static scan of imported names, so `storage` must be its own
// directly-imported export to get its own explicit, separately-approved
// permission rather than riding along with the `gsender` bundle.
const createStorageClient = (): StorageClient => ({
	get: (key, defaultValue) => request("storage:get", { key, defaultValue }),
	set: (key, value) =>
		request("storage:set", { key, value }).then(() => undefined),
	delete: (key) =>
		request("storage:delete", { key }).then(() => undefined),
	getAll: (defaultValue) => request("storage:get:all", { defaultValue }),
	setAll: (value) =>
		request("storage:set:all", { value }).then(() => undefined),
	clear: () => request("storage:clear").then(() => undefined),
});
export const machine = createMachineClient();
export const workspace = createWorkspaceClient();
export const redux = createReduxClient();
export const gcode = createGcodeClient();
export const storage = createStorageClient();
export const viewer = createViewerClient();

const createGsenderClient = (): GsenderClient => ({
	machine: machine,
	workspace: workspace,
	redux: redux,
	gcode: gcode,
	viewer: viewer
});
export const gsender = createGsenderClient();

// --- Framework-agnostic helpers ----------------------------------------------
// For plugins that don't use React (vanilla JS, Vue, Svelte, etc.). The `get*`
// helpers return a one-shot snapshot (Promise). The `subscribe*` helpers deliver
// the current value immediately and then on every change, returning an
// unsubscribe function.

/**
 * The most recent result from one of your parsers, or undefined if it has not
 * matched yet this session. Reads a cache the host keeps, so it is synchronous
 * and safe to call the moment your view mounts.
 */
export const getLastParsed = (id: string): ParsedResult | undefined =>
	(getTopicSnapshot<Record<string, ParsedResult>>("parser") ?? {})[id];

/**
 * Notified when one of your parsers is rejected, rate limited, or quarantined.
 * @returns unsubscribe function
 */
export const onParserError = (
	callback: (error: ParserErrorEvent) => void,
): (() => void) =>
	subscribeEvents("parser", (payload) => {
		const event = payload as ParserErrorEvent;
		if (event?.reason && !Array.isArray((payload as ParsedResult)?.lines)) {
			callback(event);
		}
	});

/** One-shot snapshot of gSender's workspace state. */
export const getWorkspaceState = <T = unknown>(): Promise<T> =>
	request<T>("workspace:get:state");

/** One-shot snapshot of gSender's full redux state. */
export const getReduxState = <T = unknown>(): Promise<T> =>
	request<T>("redux:get:state");

/** One-shot selected slice of gSender's redux state. */
export const getSelector = async <Selected = unknown, State = unknown>(
	selector: (state: State) => Selected,
): Promise<Selected> => selector(await getReduxState<State>());

/**
 * Subscribe to live workspace state. Calls `callback` immediately with the
 * current value (once available) and again whenever it changes.
 * @returns unsubscribe function
 */
export const subscribeWorkspaceState = <T = unknown>(
	callback: (state: T) => void,
): (() => void) => {
	const notify = () => {
		const snapshot = getTopicSnapshot<T>("workspace");
		if (snapshot !== undefined) {
			callback(snapshot);
		}
	};

	const unsubscribe = subscribeTopic("workspace", notify);
	notify();
	return unsubscribe;
};

/**
 * Subscribe to a slice of gSender's redux state. Calls `callback` immediately
 * with the current selected value (once available) and again whenever it
 * changes. Pass `equalityFn` to skip callbacks when the selected value is equal.
 * @returns unsubscribe function
 */
export const subscribeSelector = <Selected = unknown, State = unknown>(
	selector: (state: State) => Selected,
	callback: (selected: Selected) => void,
	equalityFn?: (a: Selected, b: Selected) => boolean,
): (() => void) => {
	let last: { value: Selected } | null = null;

	const notify = () => {
		const root = getTopicSnapshot<State>("redux");
		if (root === undefined) {
			return;
		}
		const next = selector(root);
		if (last) {
			const same = equalityFn
				? equalityFn(last.value, next)
				: last.value === next;
			if (same) {
				return;
			}
		}
		last = { value: next };
		callback(next);
	};

	const unsubscribe = subscribeTopic("redux", notify);
	notify();
	return unsubscribe;
};
