import type { PluginCapabilities } from "../types";

export const EMPTY_CAPABILITIES: PluginCapabilities = {
	requestTypes: new Set([]),
	topics: new Set([]),
};

type PluginRegistration = {
	capabilities: PluginCapabilities;
	pluginId: string;
};

const registry = new Map<MessageEventSource, PluginRegistration>();

export const registerPluginWindow = (
	win: MessageEventSource,
	capabilities: PluginCapabilities,
	pluginId: string
): void => {
	registry.set(win, { capabilities, pluginId });
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
