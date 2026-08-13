import { VISUALIZER_PRIMARY } from "app/constants";
import controller from "app/lib/controller";
import { uploadGcodeFileToServer } from "app/lib/fileupload";
import store from "app/store";
import reduxStore from "app/store/redux";
import type {
	PLUGIN_BRIDGE_CHANNEL,
	PluginBridgeRequest,
	PluginBridgeResponse,
	PluginBridgeSubscribe,
	PluginBridgeTopic,
	PluginCapabilities,
} from "../types";
import {
	EMPTY_CAPABILITIES,
	getCapabilitiesForSource,
} from "./plugin-permissions";

const BRIDGE_CHANNEL: typeof PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";

const getWorkspaceSnapshot = () => store.get("workspace", {});

const getReduxSnapshot = () => reduxStore.getState();

const getTopicSnapshot = (topic: PluginBridgeTopic): unknown => {
	switch (topic) {
		case "workspace":
			return getWorkspaceSnapshot();
		case "redux":
			return getReduxSnapshot();
		default:
			return null;
	}
};

const getMachineContext = () => {
	const units = store.get("workspace.units", "mm");
	const machineProfile = store.get("workspace.machineProfile", {});
	const controllerState = reduxStore.getState().controller;
	const connectionState = reduxStore.getState().connection;

	return {
		units,
		machineProfile,
		connected: connectionState.isConnected,
		port: controller.port,
		position: controllerState?.state?.status?.mpos || null,
		workPosition: controllerState?.state?.status?.wpos || null,
	};
};

const runMachineCommand = async (
	payload: Record<string, unknown> = {},
	// capabilities: PluginCapabilities
) => {
	const cmd = String(payload.cmd || "");
	const args = Array.isArray(payload.args) ? payload.args : [];

	if (!cmd) {
		console.error("cmd is required");
		throw new Error("cmd is required");
	}

	// TODO: add ability to differentiate between and give separate permissions for machine commands as some of them are very sensitive
	// if (!capabilities.allowedCommands.has(cmd)) {
	// 	throw new Error(`Plugin not authorized to run command '${cmd}'`);
	// }

	return new Promise((resolve, reject) => {
		controller.command(cmd, ...args, (err: Error | null, data: unknown) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
};

const loadGCodeToVisualizer = async ({
	gcode,
	name,
}: {
	gcode: string;
	name: string;
}) => {
	const file = new File([gcode], name);
	await uploadGcodeFileToServer(file, controller.port, VISUALIZER_PRIMARY);
	// The upload helper resolves with a raw axios response (functions, headers,
	// etc.) which can't be structured-cloned back across postMessage. Return a
	// plain, serializable ack instead.
	return { ok: true, name };
};

const handleBridgeRequest = async (
	request: PluginBridgeRequest,
	capabilities: PluginCapabilities
): Promise<unknown> => {
	// check if plugin is allowed to use this request type
	if (!capabilities.requestTypes.has(request.type)) {
		console.error(`Plugin not authorized to use '${request.type}`)
		throw new Error(`Plugin not authorized to use '${request.type}'`);
	}

	switch (request.type) {
		case "machine:get:context":
			return getMachineContext();
		case "machine:command":
			return runMachineCommand(request.payload, /*capabilities*/);
		case "workspace:get:state":
			return getWorkspaceSnapshot();
		case "redux:get:state":
			return getReduxSnapshot();
		case "gcode:load:to:visualizer":
			return loadGCodeToVisualizer(
				request.payload as { gcode: string; name: string }
			);
		default:
			console.error(`Unknown bridge request: ${request.type}`);
			throw new Error(`Unknown bridge request: ${request.type}`);
	}
};

export const handlePluginBridgeMessage = async (
	event: MessageEvent
): Promise<PluginBridgeResponse | null> => {
	if (event.data?.channel !== BRIDGE_CHANNEL || !event.data?.request) {
		return null;
	}

	const request = event.data.request as PluginBridgeRequest;

	// Unregistered source (a plugin who never registered it,
	// or a message from something that isn't a known plugin iframe at all)
	// gets zero capabilities
	const capabilities = getCapabilitiesForSource(event.source) ?? EMPTY_CAPABILITIES;

	try {
		const result = await handleBridgeRequest(request, capabilities);
		return {
			id: request.id,
			ok: true,
			result,
		};
	} catch (err) {
		return {
			id: request.id,
			ok: false,
			error: err instanceof Error ? err.message : "Bridge request failed",
		};
	}
};

// --- Reactive subscriptions ---------------------------------------------------
// Plugins subscribe to a topic; the host pushes a fresh snapshot whenever the
// underlying store changes. A single host-level listener per source fans out to
// every active plugin subscription so we never attach/detach store listeners per
// subscriber.

type PluginSubscription = {
	id: string;
	topic: PluginBridgeTopic;
	source: MessageEventSource;
	origin: string;
};

const subscriptions = new Map<string, PluginSubscription>();
let hostListenersInstalled = false;

const pushUpdate = (sub: PluginSubscription, snapshot: unknown) => {
	try {
		sub.source.postMessage(
			{
				channel: BRIDGE_CHANNEL,
				update: { id: sub.id, topic: sub.topic, snapshot },
			},
			{ targetOrigin: sub.origin },
		);
	} catch {
		// The iframe is gone (navigated/unmounted) — drop the dead subscription.
		subscriptions.delete(sub.id);
	}
};

const broadcast = (topic: PluginBridgeTopic) => {
	if (subscriptions.size === 0) {
		return;
	}

	// Compute the snapshot once per broadcast, shared across subscribers.
	let snapshot: unknown;
	let computed = false;

	subscriptions.forEach((sub) => {
		if (sub.topic !== topic) {
			return;
		}
		if (!computed) {
			snapshot = getTopicSnapshot(topic);
			computed = true;
		}
		pushUpdate(sub, snapshot);
	});
};

const ensureHostListeners = () => {
	if (hostListenersInstalled) {
		return;
	}
	hostListenersInstalled = true;

	store.on("change", () => broadcast("workspace"));
	// NOTE: redux subscribe fires on every action; the snapshot is only computed
	// when there is at least one active redux subscriber.
	reduxStore.subscribe(() => broadcast("redux"));
};

const addSubscription = (
	source: MessageEventSource,
	origin: string,
	subscribe: PluginBridgeSubscribe,
	capabilities: PluginCapabilities
) => {
	// check if plugin has subscription perms
	if (!capabilities.topics.has(subscribe.topic)) {
		console.error(`Plugin not authorized to subscribe to '${subscribe.topic}'`);
		throw new Error(`Plugin not authorized to subscribe to '${subscribe.topic}'`);
	}

	ensureHostListeners();

	const sub: PluginSubscription = {
		id: subscribe.id,
		topic: subscribe.topic,
		source,
		origin,
	};

	subscriptions.set(sub.id, sub);

	// Push the current value immediately so the hook renders without waiting for
	// the next store change.
	pushUpdate(sub, getTopicSnapshot(sub.topic));
};

const removeSubscription = (id: string) => {
	subscriptions.delete(id);
};

export const installPluginBridgeListener = () => {
	const listener = async (event: MessageEvent) => {
		const data = event.data;

		if (!data || data.channel !== BRIDGE_CHANNEL) {
			return;
		}

		const capabilities = getCapabilitiesForSource(event.source) ?? EMPTY_CAPABILITIES;

		if (data.subscribe && event.source) {
			try {
				addSubscription(
					event.source,
					event.origin,
					data.subscribe as PluginBridgeSubscribe,
					capabilities
				);
			} catch(err) {
				event.source.postMessage(
					{
						channel: BRIDGE_CHANNEL,
						err,
					},
					{ targetOrigin: event.origin }
				);
			}
			return;
		}

		if (data.unsubscribe) {
			removeSubscription(data.unsubscribe.id);
			return;
		}

		if (!data.request) {
			return;
		}

		const response = await handlePluginBridgeMessage(event);

		if (
			!response ||
			!event.source ||
			typeof event.source.postMessage !== "function"
		) {
			return;
		}

		event.source.postMessage(
			{
				channel: BRIDGE_CHANNEL,
				response,
			},
			{ targetOrigin: event.origin }
		);
	};

	window.addEventListener("message", listener);

	return () => {
		window.removeEventListener("message", listener);
	};
};
