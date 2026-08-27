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
	| "standalone";

export type PluginContribution = {
	slot: PluginContributionSlot;
	label?: string;
	route?: string;
	icon?: string;
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
	plugins: PluginRecord[];
};

export type PluginPermissionsType =
	"machine:read"
	| "machine:write"
	// Reading the raw firmware stream through a plugin-supplied regex. NOT part
	// of machine:read: that returns a curated context object, whereas a parser
	// matching "^" sees more of the serial line traffic than the console does.
	| "machine:parse"
	// Writing a command and capturing its response lines.
	| "machine:query"
	| "visualizer:load"
	| "workspace:read"
	| "redux:read"
	| "local-fonts"
	| "storage";

export type PluginTopicsType = "workspace" | "redux" | "parser"

export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
	| "machine:parser:register"
	| "machine:parser:unregister"
	| "machine:query"
	| "workspace:get:state"
	| "redux:get:state"
	| "gcode:load:to:visualizer"
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

// Reactive state that plugins can subscribe to for live updates.
export type PluginBridgeTopic = "workspace" | "redux" | "parser";

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
			"gcode:load:to:visualizer",
			"workspace:get:state",
			"redux:get:state",
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
			"gcode:load:to:visualizer",
			"workspace:get:state",
			"redux:get:state",
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
		],
	],
	["registerParser", ["machine:parser:register"]],
	["unregisterParser", ["machine:parser:unregister"]],
	// onParsed/onLine register an anonymous parser under the hood, so they need
	// the register/unregister request types too, not just the topic.
	["onLine", ["machine:parser:register", "machine:parser:unregister"]],
	["query", ["machine:query"]],
	["gcode", ["gcode:load:to:visualizer"]],
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
]);

// the import specifiers the permission scanner looks for in a plugin's built bundle.
// must stay in sync with SDK_SPECIFIERS in the sdk's config
export const SDK_SCAN_SPECIFIERS = [
	"@sienci/gsender-plugin-sdk",
	"@sienci/gsender-plugin-sdk/react",
	"@sienci/gsender-plugin-sdk/viewer",
];
