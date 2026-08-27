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
	| "visualizer:load"
	| "workspace:read"
	| "redux:read"
	| "local-fonts"
	| "storage";

export type PluginTopicsType = "workspace" | "redux"

export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
	| "workspace:get:state"
	| "redux:get:state"
	| "gcode:load:to:visualizer"
	| "storage:get"
	| "storage:set"
	| "storage:delete"
	| "storage:get:all"
	| "storage:set:all"
	| "storage:clear";

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
export type PluginBridgeTopic = "workspace" | "redux";

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
			"visualizer:load",
			"workspace:read",
			"redux:read",
		],
	],
	["machine", ["machine:read", "machine:write"]],
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
			"gcode:load:to:visualizer",
			"workspace:get:state",
			"redux:get:state",
		],
	],
	["machine", ["machine:get:context", "machine:command"]],
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
]);

// the import specifiers the permission scanner looks for in a plugin's built bundle.
// must stay in sync with SDK_SPECIFIERS in the sdk's config
export const SDK_SCAN_SPECIFIERS = [
	"@sienci/gsender-plugin-sdk",
	"@sienci/gsender-plugin-sdk/react",
	"@sienci/gsender-plugin-sdk/viewer",
];
