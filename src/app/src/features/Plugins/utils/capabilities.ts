import {
	type PluginBridgeRequestType,
	type PluginBridgeTopic,
	type PluginCapabilities,
	type PluginCapabilitiesWire,
	type PluginPermissionsType,
	permissionsMap,
	requestTypesMap,
	topicsMap,
} from "../types";

const WHOLE_MODULE_SENTINEL = "*require-whole-module*";

// convert the scanned capabilities to human-readable
// permission labels for the authorize dialog,
// and separate into request types and topics.
// i included allowedFunctions here as well but it's currently unused
export const buildGrantFromScan = (
	scanned: string[],
): {
	permissions: PluginPermissionsType[];
	wire: PluginCapabilitiesWire;
} => {
	const permissions = [
		...new Set(
			scanned.flatMap((name) => permissionsMap.get(name) ?? []),
		),
	];
	const requestTypes = [
		...new Set(
			scanned.flatMap((name) => requestTypesMap.get(name) ?? []),
		),
	];
	const topics = [
		...new Set(
			scanned.flatMap((name) => {
				const topic = topicsMap.get(name);
				return topic === undefined ? [] : [topic];
			}),
		),
	];
	const allowedFunctions = scanned.filter(
		(name) => name !== WHOLE_MODULE_SENTINEL,
	);

	return {
		permissions,
		wire: { requestTypes, topics, allowedFunctions },
	};
};

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
