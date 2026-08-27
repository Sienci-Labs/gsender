import type { PluginCapabilities } from "../types";

export const EMPTY_CAPABILITIES: PluginCapabilities = {
	requestTypes: new Set([]),
	topics: new Set([]),
};

type PluginRegistration = {
	capabilities: PluginCapabilities;
	pluginId: string;
	windowId: number;
};

const registry = new Map<MessageEventSource, PluginRegistration>();

// Distinguishes one mount of a plugin iframe from the next. Runtime parser
// registrations are keyed on it, so a reload (which re-runs the registering
// effect) gets a fresh identity and cannot inherit the previous mount's
// server-side parsers.
let nextWindowId = 1;

export const registerPluginWindow = (
	win: MessageEventSource,
	capabilities: PluginCapabilities,
	pluginId: string
): void => {
	registry.set(win, { capabilities, pluginId, windowId: nextWindowId++ });
};

export const unregisterPluginWindow = (win: MessageEventSource): void => {
	registry.delete(win);
};

export const getCapabilitiesForSource = (
	source: MessageEventSource | null
): PluginCapabilities | null =>
	(source ? (registry.get(source)?.capabilities ?? null) : null);

export const getPluginIdForSource = (
	source: MessageEventSource | null
): string | null => (source ? (registry.get(source)?.pluginId ?? null) : null);

/**
 * Identifies one mount of one plugin's iframe, e.g. "basic-cam#3". Runtime
 * parser registrations are owned by this, so they can all be torn down when
 * that iframe unmounts.
 */
export const getOwnerIdForSource = (
	source: MessageEventSource | null
): string | null => {
	const registration = source ? registry.get(source) : undefined;
	return registration
		? `${registration.pluginId}#${registration.windowId}`
		: null;
};
