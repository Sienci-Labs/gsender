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
	| "machine.getContext"
	| "cam.loadPreview"
	| "cam.commitToJob"
	| "machine.command";

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

export const PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";
