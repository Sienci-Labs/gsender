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

// ---------------------------------------------------------------------------
// Guided install
// ---------------------------------------------------------------------------

// Where a plugin comes from. Windows and Linux cannot offer a folder and a
// file in one native dialog, so the user picks which.
export type PluginSourceMode = "dir" | "zip";

// What installing this plugin would do to what is already on disk.
// "unknown" means one of the two versions is not valid semver.
export type PluginInstallKind =
	| "new"
	| "update"
	| "downgrade"
	| "reinstall"
	| "unknown";

export type PluginInstallLogEntry = {
	level: "info" | "warn" | "error";
	message: string;
	at: string;
};

export type PluginEngineCheck = {
	// false when there is no engine field, or its range could not be parsed.
	checked: boolean;
	satisfied: boolean;
	unreadable?: boolean;
	appVersion?: string;
	range: string | null;
};

// Everything the review step needs, computed server-side against a staged copy.
export type PluginInstallPlan = {
	kind: PluginInstallKind;
	plugin: {
		id: string;
		name: string;
		description: string;
		version: string;
		engine: string | null;
		contributions: PluginContribution[];
	};
	installedVersion: string | null;
	incomingVersion: string;
	// Everything that will be granted: the union of what the bundle scan proved
	// and what the manifest declares.
	permissions: PluginPermissionsType[];
	// The subset the static scan actually found in the plugin's code.
	verifiedPermissions: PluginPermissionsType[];
	// Declared by the manifest but not corroborated by the code we could read,
	// e.g. because the plugin bundles the SDK instead of importing it.
	declaredOnlyPermissions: PluginPermissionsType[];
	capabilities: PluginCapabilitiesWire;
	// False when no bundle could be found to scan.
	scanned: boolean;
	// True when the plugin's SDK use could not be fully determined, so the
	// permission list above may be incomplete.
	unverifiable: boolean;
	engine: PluginEngineCheck;
	// Set when a copy in another plugins root would take priority over this one.
	shadowedBy: string | null;
	sourcePath: string;
	targetDir: string;
};

export type PluginInstallPrepareResponse = {
	ok: boolean;
	sessionId?: string;
	plan?: PluginInstallPlan;
	error?: string;
	manifestErrors?: string[];
	log?: PluginInstallLogEntry[];
};

export type PluginInstallCommitResponse = {
	ok: boolean;
	error?: string;
	log?: PluginInstallLogEntry[];
	pluginId?: string;
	targetDir?: string;
	replaced?: boolean;
	restartRequired?: boolean;
	// After a failed swap: whether the previous version was put back.
	restored?: boolean;
	backupDir?: string | null;
};

export type PluginPermissionsType =
	| "machine:read"
	| "machine:write"
	| "visualizer:load"
	| "viewer:camera"
	| "viewer:draw"
	| "workspace:read"
	| "redux:read"
	| "local-fonts"
	| "storage";

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
	| "viewer:overlay:set"
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
