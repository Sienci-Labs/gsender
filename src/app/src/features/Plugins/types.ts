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
