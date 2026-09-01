export const PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";

// NOTE: this union is duplicated in the host at
// src/app/src/features/Plugins/types.ts and the two must stay in sync.
export type PluginBridgeRequestType =
	| "machine:get:context"
	| "machine:command"
	| "machine:parser:register"
	| "machine:parser:unregister"
	| "machine:query"
	| "machine:busy:set"
	| "gcode:load:to:visualizer"
	| "workspace:get:state"
	| "redux:get:state"
	| "storage:get"
	| "storage:set"
	| "storage:delete"
	| "storage:get:all"
	| "storage:set:all"
	| "storage:clear"
	| "viewer:screen-to-world"
	| "viewer:world-to-screen"
	| "viewer:camera:set"
	| "viewer:camera:lock-rotate"
	| "viewer:pick:arm"
	| "viewer:pick:disarm"
	| "viewer:overlay:set";

export type PluginBridgeTopic = "workspace" | "redux" | "parser" | "viewer";

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
	timer: ReturnType<typeof setTimeout> | null;
};

// Without this, a request the host never answers (no port open, host listener
// torn down, iframe outliving its handler) leaves an entry in `pending` and a
// promise that never settles — both leak for the life of the plugin.
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

const pending = new Map<string, PendingResolver>();
const topicListeners = new Map<PluginBridgeTopic, Set<() => void>>();
const eventListeners = new Map<
	PluginBridgeTopic,
	Set<(payload: unknown) => void>
>();
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
			if (resolver.timer) {
				clearTimeout(resolver.timer);
			}
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
			// biome-ignore lint/suspicious/useIterableCallbackReturn: <>
			topicListeners.get(topic)?.forEach((notify) => notify());
			return;
		}

		// Discrete events, as opposed to snapshots. A snapshot is last-value-only
		// and useSyncExternalStore de-dupes by reference, so two parser matches in
		// one tick would collapse into one — fine for state, wrong for events.
		if (data.event) {
			const { topic, event } = data.event as {
				topic: PluginBridgeTopic;
				event: unknown;
			};
			// biome-ignore lint/suspicious/useIterableCallbackReturn: <>
			eventListeners.get(topic)?.forEach((notify) => notify(event));
		}
	});
};

export const request = <T = unknown>(
	type: PluginBridgeRequestType,
	payload?: Record<string, unknown>,
	opts?: { timeoutMs?: number },
): Promise<T> => {
	ensureListener();

	return new Promise<T>((resolve, reject) => {
		if (!isBrowser) {
			reject(new Error("gSender bridge is only available in the browser"));
			return;
		}

		const id = createRequestId();
		const timeoutMs = opts?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
		const timer =
			timeoutMs > 0
				? setTimeout(() => {
						pending.delete(id);
						reject(new Error(`Bridge request '${type}' timed out`));
					}, timeoutMs)
				: null;

		pending.set(id, {
			resolve: resolve as (value: unknown) => void,
			reject,
			timer,
		});
		post({
			channel: PLUGIN_BRIDGE_CHANNEL,
			request: { id, type, payload } as PluginBridgeRequest,
		});
	});
};

// Snapshot listeners and event listeners share ONE host subscription per topic.
// They have to participate in the same refcount: if only the snapshot listeners
// were counted, the last of them unsubscribing would tear the subscription out
// from under any event listeners still attached.
const refCount = (topic: PluginBridgeTopic) =>
	(topicListeners.get(topic)?.size ?? 0) +
	(eventListeners.get(topic)?.size ?? 0);

const openSubscription = (topic: PluginBridgeTopic) => {
	if (topicSubscriptionId.has(topic)) {
		return;
	}
	const id = createRequestId();
	topicSubscriptionId.set(topic, id);
	post({ channel: PLUGIN_BRIDGE_CHANNEL, subscribe: { id, topic } });
};

const closeSubscriptionIfIdle = (topic: PluginBridgeTopic) => {
	if (refCount(topic) > 0) {
		return;
	}
	topicListeners.delete(topic);
	eventListeners.delete(topic);
	latestSnapshot.delete(topic);
	const id = topicSubscriptionId.get(topic);
	topicSubscriptionId.delete(topic);
	if (id) {
		post({ channel: PLUGIN_BRIDGE_CHANNEL, unsubscribe: { id } });
	}
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

	openSubscription(topic);

	return () => {
		topicListeners.get(topic)?.delete(notify);
		closeSubscriptionIfIdle(topic);
	};
};

/**
 * Subscribe to the lossless event stream for a topic. Unlike subscribeTopic,
 * every event is delivered — none are collapsed by de-duplication.
 */
export const subscribeEvents = (
	topic: PluginBridgeTopic,
	notify: (payload: unknown) => void,
): (() => void) => {
	ensureListener();

	let listeners = eventListeners.get(topic);
	if (!listeners) {
		listeners = new Set();
		eventListeners.set(topic, listeners);
	}
	listeners.add(notify);

	openSubscription(topic);

	return () => {
		eventListeners.get(topic)?.delete(notify);
		closeSubscriptionIfIdle(topic);
	};
};

export const getTopicSnapshot = <T>(topic: PluginBridgeTopic): T | undefined =>
	latestSnapshot.get(topic) as T | undefined;
