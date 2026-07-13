export const PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";

export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
	| "machine:busy:set"
	| "gcode:load:to:visualizer"
	| "workspace:get:state"
	| "redux:get:state"
	| "viewer:screen-to-world"
	| "viewer:world-to-screen"
	| "viewer:camera:set"
	| "viewer:camera:lock-rotate"
	| "viewer:pick:arm"
	| "viewer:pick:disarm"
	| "viewer:overlay:set";

export type PluginBridgeTopic = "workspace" | "redux" | "viewer";

// --- Viewer bridge types ------------------------------------------------------
// Shared shapes for the `viewer:*` surface. The host defines identical types on
// its end of the bridge — keep these exactly in sync with that contract.

/** Camera presets accepted by `viewer:camera:set`. */
export type CameraView = "top" | "3d" | "front" | "left" | "right";

/**
 * A marker drawn on the host visualizer's overlay via `viewer:overlay:set`.
 * Coordinates are in world space (the same space `screenToWorld` returns).
 */
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

/** Events pushed on the `"viewer"` topic while a pick is armed. */
export type ViewerPickEvent =
	| {
			kind: "pick";
			world: { x: number; y: number; z: number };
			screen: { x: number; y: number };
	  }
	// 0..1 while a press-and-hold pick is in progress
	| { kind: "hold-progress"; t: number };

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

const createRequestId = () =>
	`${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isBrowser = typeof window !== "undefined";

// --- Messaging core -----------------------------------------------------------
// A single window "message" listener multiplexes:
//   - request/response (one-shot RPC)
//   - update (pushed reactive snapshots for subscribed topics)

type PendingResolver = {
	resolve: (value: unknown) => void;
	reject: (reason: unknown) => void;
};

const pending = new Map<string, PendingResolver>();
const topicListeners = new Map<PluginBridgeTopic, Set<() => void>>();
const topicSubscriptionId = new Map<PluginBridgeTopic, string>();
const latestSnapshot = new Map<PluginBridgeTopic, unknown>();

let listenerInstalled = false;

const post = (message: unknown) => {
	if (!isBrowser) {
		return;
	}
	window.parent.postMessage(message, "*");
};

const ensureListener = () => {
	if (listenerInstalled || !isBrowser) {
		return;
	}
	listenerInstalled = true;

	window.addEventListener("message", (event: MessageEvent) => {
		const data = event.data;
		if (!data || data.channel !== PLUGIN_BRIDGE_CHANNEL) {
			return;
		}

		if (data.response) {
			const response = data.response as PluginBridgeResponse;
			const resolver = pending.get(response.id);
			if (!resolver) {
				return;
			}
			pending.delete(response.id);
			if (response.ok) {
				resolver.resolve(response.result);
			} else {
				resolver.reject(
					new Error(response.error || "Plugin bridge request failed"),
				);
			}
			return;
		}

		if (data.update) {
			const { topic, snapshot } = data.update as {
				topic: PluginBridgeTopic;
				snapshot: unknown;
			};
			latestSnapshot.set(topic, snapshot);
			topicListeners.get(topic)?.forEach((notify) => notify());
		}
	});
};

export const request = <T = unknown>(
	type: PluginBridgeRequestType,
	payload?: Record<string, unknown>,
): Promise<T> => {
	ensureListener();

	return new Promise<T>((resolve, reject) => {
		if (!isBrowser) {
			reject(new Error("gSender bridge is only available in the browser"));
			return;
		}

		const id = createRequestId();
		pending.set(id, {
			resolve: resolve as (value: unknown) => void,
			reject,
		});
		post({
			channel: PLUGIN_BRIDGE_CHANNEL,
			request: { id, type, payload } as PluginBridgeRequest,
		});
	});
};

// Fan out a single host subscription per topic to any number of hook instances.
export const subscribeTopic = (
	topic: PluginBridgeTopic,
	notify: () => void,
): (() => void) => {
	ensureListener();

	let listeners = topicListeners.get(topic);
	if (!listeners) {
		listeners = new Set();
		topicListeners.set(topic, listeners);
	}
	listeners.add(notify);

	// First subscriber for this topic opens the host-side subscription.
	if (!topicSubscriptionId.has(topic)) {
		const id = createRequestId();
		topicSubscriptionId.set(topic, id);
		post({ channel: PLUGIN_BRIDGE_CHANNEL, subscribe: { id, topic } });
	}

	return () => {
		const set = topicListeners.get(topic);
		if (!set) {
			return;
		}
		set.delete(notify);

		// Last subscriber left — tear down the host-side subscription.
		if (set.size === 0) {
			topicListeners.delete(topic);
			latestSnapshot.delete(topic);
			const id = topicSubscriptionId.get(topic);
			topicSubscriptionId.delete(topic);
			if (id) {
				post({ channel: PLUGIN_BRIDGE_CHANNEL, unsubscribe: { id } });
			}
		}
	};
};

export const getTopicSnapshot = <T>(topic: PluginBridgeTopic): T | undefined =>
	latestSnapshot.get(topic) as T | undefined;
