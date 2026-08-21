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
	plugins: PluginRecord[];
};

export type PluginPermissionsType =
	| "machine:read"
	| "machine:write"
	| "visualizer:load"
	| "viewer:camera"
	| "viewer:draw"
	| "workspace:read"
	| "redux:read"
	| "local-fonts";

export type PluginTopicsType = "workspace" | "redux";

export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
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
	| "viewer:overlay:set";

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
export type PluginBridgeTopic = "workspace" | "redux" | "viewer";

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
]);

export const requestTypesMap = new Map<string, PluginBridgeRequestType[]>([
	[
		"*require-whole-module*",
		[
			"machine:get:context",
			"machine:command",
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
	["machine", ["machine:get:context", "machine:command", "machine:busy:set"]],
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
]);

export const topicsMap = new Map<string, PluginBridgeTopic>([
	["subscribeWorkspaceState", "workspace"],
	["subscribeSelector", "redux"],
	["useWorkspaceState", "workspace"],
	["useTypedSelector", "redux"],
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
