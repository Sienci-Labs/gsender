import type {
	PluginBridgeRequestType,
	PluginBridgeTopic,
	PluginCapabilities,
} from "../types";

const toStringArray = (value: unknown): string[] =>
	Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];

export const toRuntimeCapabilities = (raw: unknown): PluginCapabilities => {
	const source =
		raw && !Array.isArray(raw) && typeof raw === "object"
			? (raw as Record<string, unknown>)
			: {};
	return {
		requestTypes: new Set(
			toStringArray(source.requestTypes) as PluginBridgeRequestType[],
		),
		topics: new Set(toStringArray(source.topics) as PluginBridgeTopic[]),
	};
};
