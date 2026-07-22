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
	engine: string | null;
	permissions: string[];
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
