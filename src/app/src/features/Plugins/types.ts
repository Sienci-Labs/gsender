export interface PluginCapabilities {
	requestTypes: Set<PluginBridgeRequestType>;
	topics: Set<PluginBridgeTopic>;
}

// What travels over REST and lives in gsender-plugin.json
export interface PluginCapabilitiesWire {
	requestTypes: PluginBridgeRequestType[];
	topics: PluginBridgeTopic[];
	allowedFunctions?: string[];
}

export type PluginContributionSlot =
	| "tools-tab"
	| "tools-page"
	| "settings-section"
	| "navbar"
	| "standalone"
	| "visualizer-overlay";

// A declarative marker the host draws over the visualizer canvas on behalf of
// an overlay plugin. Coordinates are in world/scene space; the host re-projects
// them to screen space every frame so they track camera pan/zoom. Plugins never
// draw on the canvas themselves — they hand the host this list.
export interface OverlayMarker {
	id: string;
	x: number;
	y: number;
	z?: number; // world coordinates
	shape?: "circle" | "cross" | "ring"; // default 'circle'
	color?: string; // CSS color
	size?: number; // px, default 6
	label?: string;
}

export type PluginContribution = {
	slot: PluginContributionSlot;
	label?: string;
	route?: string;
	icon?: string;
	// For "visualizer-overlay" contributions that drive machine motion: when
	// true, the host greys out and blocks the overlay toggle unless the machine
	// is connected and idle (i.e. actually able to accept the command).
	requiresIdle?: boolean;
};

export type PluginRecord = {
	id: string;
	name: string;
	version: string;
	description: string;
	engine: string | null;
	capabilities: PluginCapabilitiesWire;
	permissions: PluginPermissionsType[];
	enabled: boolean;
	valid: boolean;
	errors: string[];
	mountSlug: string;
	mountRoute: string;
	uiUrl: string;
	contributions: PluginContribution[];
};

export type PluginsResponse = {
	pluginsDir: string;
	userPluginsDir: string;
	plugins: PluginRecord[];
};

export type PluginPermissionsType =
	| "machine:read"
	| "machine:write"
	// Reading the raw firmware stream through a plugin-supplied regex. NOT part
	// of machine:read: that returns a curated context object, whereas a parser
	// matching "^" sees more of the serial line traffic than the console does.
	| "machine:parse"
	// Writing a command and capturing its response lines.
	| "machine:query"
	| "visualizer:load"
	| "viewer:camera"
	| "viewer:draw"
	| "workspace:read"
	| "redux:read"
	| "local-fonts"
	| "storage";

export type PluginTopicsType = "workspace" | "redux" | "parser" | "viewer";

export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
	| "machine:parser:register"
	| "machine:parser:unregister"
	| "machine:query"
	| "machine:busy:set"
	| "workspace:get:state"
	| "redux:get:state"
	| "gcode:load:to:visualizer"
	| "viewer:screen-to-world"
	| "viewer:world-to-screen"
	| "viewer:camera:set"
	| "viewer:camera:lock-rotate"
	| "viewer:pick:arm"
	| "viewer:pick:disarm"
	| "viewer:overlay:set"
	| "storage:get"
	| "storage:set"
	| "storage:delete"
	| "storage:get:all"
	| "storage:set:all"
	| "storage:clear";

/** A serialized regex. Matchers cross postMessage and run server-side, so they
 * can never be functions. */
export type RegexSpec = { source: string; flags?: string };

/** A parser as authored, in a manifest or via the runtime SDK call. */
export type PluginParserSpec = {
	id: string;
	mode?: "line" | "block";
	match?: RegexSpec | string;
	begin?: RegexSpec | string;
	end?: RegexSpec | string;
	ignore?: RegexSpec | string;
	until?: "ok" | "error" | "ok-or-error";
	ignoreStatusReports?: boolean;
	strict?: boolean;
	restartOnBegin?: boolean;
	emitPartial?: boolean;
	maxLines?: number;
	timeout?: number;
	whenWorkflow?: "any" | "idle";
	label?: string;
};

export type PluginParserMatch = {
	pluginId: string;
	parserId: string;
	mode: "line" | "block";
	/** Monotonic per parser, so two identical payloads stay distinguishable. */
	seq: number;
	line: string | null;
	lines: string[];
	groups: Record<string, string>;
	captures: Array<string | null>;
	entries: Array<{
		line: string;
		groups: Record<string, string>;
		captures: Array<string | null>;
	}>;
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

export type PluginParserError = {
	pluginId: string;
	parserId: string;
	reason: "quarantined" | "rate-limited" | "invalid-spec";
	message: string;
};

export type PluginBridgeRequest = {
	id: string;
	type: PluginBridgeRequestType;
	payload?: Record<string, unknown>;
};

export type PluginBridgeResponse = {
	id: string;
	ok: boolean;
	result?: unknown;
	error?: string;
};

// Reactive state that plugins can subscribe to for live updates. "viewer" is a
// push-only event stream (pick/hold-progress events) rather than a state
// snapshot topic.
export type PluginBridgeTopic = "workspace" | "redux" | "parser" | "viewer";

/**
 * A pushed event, as opposed to a topic snapshot.
 *
 * Snapshots are last-value-only and useSyncExternalStore de-dupes by reference,
 * so two parser matches inside one tick would collapse into one. Firmware
 * matches are events — dropping one is a correctness bug — so the "parser"
 * topic carries both: a snapshot (for useParsed and late-mount) and this
 * lossless stream (for onParsed).
 */
export type PluginBridgeEvent = {
	id: string;
	topic: PluginBridgeTopic;
	event: unknown;
};

export type PluginBridgeSubscribe = {
	id: string;
	topic: PluginBridgeTopic;
};

export type PluginBridgeUnsubscribe = {
	id: string;
};

export type PluginBridgeUpdate = {
	id: string;
	topic: PluginBridgeTopic;
	snapshot: unknown;
};

export const PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";

export const permissionsMap = new Map<string, PluginPermissionsType[]>([
	[
		"gsender",
		[
			"machine:read",
			"machine:write",
			"machine:parse",
			"machine:query",
			"visualizer:load",
			"workspace:read",
			"redux:read",
		],
	],
	["machine", ["machine:read", "machine:write", "machine:parse", "machine:query"]],
	["registerParser", ["machine:parse"]],
	["unregisterParser", ["machine:parse"]],
	["onParsed", ["machine:parse"]],
	["useParsed", ["machine:parse"]],
	["onLine", ["machine:parse"]],
	["getLastParsed", ["machine:parse"]],
	["onParserError", ["machine:parse"]],
	["query", ["machine:query", "machine:parse"]],
	["gcode", ["visualizer:load"]],
	["viewer", ["viewer:camera", "viewer:draw"]],
	["workspace", ["workspace:read"]],
	["getWorkspaceState", ["workspace:read"]],
	["subscribeWorkspaceState", ["workspace:read"]],
	["redux", ["redux:read"]],
	["getReduxState", ["redux:read"]],
	["getSelector", ["redux:read"]],
	["useWorkspaceState", ["workspace:read"]],
	["subscribeSelector", ["redux:read"]],
	["useTypedSelector", ["redux:read"]],
	["storage", ["storage"]],
]);

export const requestTypesMap = new Map<string, PluginBridgeRequestType[]>([
	[
		"*require-whole-module*",
		[
			"machine:get:context",
			"machine:command",
			"machine:parser:register",
			"machine:parser:unregister",
			"machine:query",
			"machine:busy:set",
			"gcode:load:to:visualizer",
			"workspace:get:state",
			"redux:get:state",
			"viewer:screen-to-world",
			"viewer:world-to-screen",
			"viewer:camera:set",
			"viewer:camera:lock-rotate",
			"viewer:pick:arm",
			"viewer:pick:disarm",
			"viewer:overlay:set",
		],
	],
	[
		"gsender",
		[
			"machine:get:context",
			"machine:command",
			"machine:parser:register",
			"machine:parser:unregister",
			"machine:query",
			"machine:busy:set",
			"gcode:load:to:visualizer",
			"workspace:get:state",
			"redux:get:state",
			"viewer:screen-to-world",
			"viewer:world-to-screen",
			"viewer:camera:set",
			"viewer:camera:lock-rotate",
			"viewer:pick:arm",
			"viewer:pick:disarm",
			"viewer:overlay:set",
		],
	],
	[
		"machine",
		[
			"machine:get:context",
			"machine:command",
			"machine:parser:register",
			"machine:parser:unregister",
			"machine:query",
			"machine:busy:set",
		],
	],
	["registerParser", ["machine:parser:register"]],
	["unregisterParser", ["machine:parser:unregister"]],
	// onParsed/onLine register an anonymous parser under the hood, so they need
	// the register/unregister request types too, not just the topic.
	["onLine", ["machine:parser:register", "machine:parser:unregister"]],
	["query", ["machine:query"]],
	["gcode", ["gcode:load:to:visualizer"]],
	[
		"viewer",
		[
			"viewer:screen-to-world",
			"viewer:world-to-screen",
			"viewer:camera:set",
			"viewer:camera:lock-rotate",
			"viewer:pick:arm",
			"viewer:pick:disarm",
			"viewer:overlay:set",
		],
	],
	["workspace", ["workspace:get:state"]],
	["getWorkspaceState", ["workspace:get:state"]],
	["redux", ["redux:get:state"]],
	["getReduxState", ["redux:get:state"]],
	["getSelector", ["redux:get:state"]],
	[
		"storage",
		[
			"storage:get",
			"storage:set",
			"storage:delete",
			"storage:get:all",
			"storage:set:all",
			"storage:clear",
		],
	],
]);

export const topicsMap = new Map<string, PluginBridgeTopic>([
	["subscribeWorkspaceState", "workspace"],
	["subscribeSelector", "redux"],
	["useWorkspaceState", "workspace"],
	["useTypedSelector", "redux"],
	["onParsed", "parser"],
	["useParsed", "parser"],
	["onLine", "parser"],
	["getLastParsed", "parser"],
	["onParserError", "parser"],
	["registerParser", "parser"],
	["viewer", "viewer"],
	["useVisualizerPick", "viewer"],
]);

// the import specifiers the permission scanner looks for in a plugin's built bundle.
// must stay in sync with SDK_SPECIFIERS in the sdk's config
export const SDK_SCAN_SPECIFIERS = [
	"@sienci/gsender-plugin-sdk",
	"@sienci/gsender-plugin-sdk/react",
	"@sienci/gsender-plugin-sdk/viewer",
];
