export interface PluginCapabilities {
	requestTypes: Set<PluginBridgeRequestType>;
	topics: Set<PluginBridgeTopic>;
	allowedFunctions: Set<string>;
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
	engine: string | null;
	permissions: string[];
	capabilities: PluginCapabilities;
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
	| "redux:read";

export type PluginTopicsType = "workspace" | "redux"

export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
	| "workspace:get:state"
	| "redux:get:state"
	| "gcode:load:to:visualizer";

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
	["useWorkspaceState", ["workspace:read"]],
	["redux", ["redux:read"]],
	["getReduxState", ["redux:read"]],
	["getSelector", ["redux:read"]],
	["subscribeSelector", ["redux:read"]],
	["useTypedSelector", ["redux:read"]],
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
]);

export const topicsMap = new Map<string, PluginTopicsType>([
	["subscribeWorkspaceState", "workspace"],
	["subscribeSelector", "redux"],
]);
