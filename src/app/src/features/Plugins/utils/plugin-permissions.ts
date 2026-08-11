import type { PluginCapabilities } from "../types";

export const EMPTY_CAPABILITIES: PluginCapabilities = {
	requestTypes: new Set(),
	topics: new Set(),
	allowedFunctions: new Set(),
};

// Keyed by the plugin iframe's window object (event.source identity), not by
// origin/string -- works correctly for opaque-origin sandboxed iframes and
// can't be spoofed by another frame requesting on the plugin's behalf.
const registry = new Map<MessageEventSource, PluginCapabilities>();

export const registerPluginWindow = (
	win: MessageEventSource,
	capabilities: PluginCapabilities
): void => {
	registry.set(win, capabilities);
};

export const unregisterPluginWindow = (win: MessageEventSource): void => {
	registry.delete(win);
};

export const getCapabilitiesForSource = (
	source: MessageEventSource | null
): PluginCapabilities | null => (source ? (registry.get(source) ?? null) : null);
