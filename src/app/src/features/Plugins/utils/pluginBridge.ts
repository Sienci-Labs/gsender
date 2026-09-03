import { GRBL_ACTIVE_STATE_IDLE, VISUALIZER_PRIMARY } from "app/constants";
import type { VisualizerBridgeHandle } from "app/features/Visualizer/visualizerBridge";
import { visualizerBridge } from "app/features/Visualizer/visualizerBridge";
import controller from "app/lib/controller";
import { uploadGcodeFileToServer } from "app/lib/fileupload";
import store from "app/store";
import reduxStore from "app/store/redux";
import { setPluginBusy } from "app/store/redux/slices/pluginState.slice";
import type {
	OverlayMarker,
	PLUGIN_BRIDGE_CHANNEL,
	PluginBridgeRequest,
	PluginBridgeResponse,
	PluginBridgeSubscribe,
	PluginBridgeTopic,
	PluginCapabilities,
	PluginParserError,
	PluginParserMatch,
} from "../types";
import {
	EMPTY_CAPABILITIES,
	getCapabilitiesForSource,
	getOwnerIdForSource,
	getPluginIdForSource,
} from "./plugin-permissions";

const BRIDGE_CHANNEL: typeof PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";

// Serialized-size guard for a plugin's storage writes. This store is a single
// shared JSON file rewritten in full on every change (debounced), so an
// unbounded write from one plugin would degrade save performance for the
// whole app, not just that plugin.
const MAX_STORAGE_VALUE_BYTES = 256 * 1024;

const assertWithinStorageSizeLimit = (value: unknown) => {
	const size = new Blob([JSON.stringify(value) ?? ""]).size;
	if (size > MAX_STORAGE_VALUE_BYTES) {
		throw new Error(
			`Plugin storage write exceeds the ${MAX_STORAGE_VALUE_BYTES} byte limit`
		);
	}
};

const getPluginData = (pluginId: string): Record<string, unknown> =>
	store.get(["plugins", pluginId, "data"], {});

const getStorageValue = (
	pluginId: string,
	payload: Record<string, unknown> = {}
) => {
	const key = String(payload.key ?? "");
	if (!key) {
		throw new Error("key is required");
	}
	return store.get(["plugins", pluginId, "data", key], payload.defaultValue);
};

const setStorageValue = (
	pluginId: string,
	payload: Record<string, unknown> = {}
) => {
	const key = String(payload.key ?? "");
	if (!key) {
		throw new Error("key is required");
	}
	assertWithinStorageSizeLimit(payload.value);
	store.set(["plugins", pluginId, "data", key], payload.value);
	return { ok: true };
};

const deleteStorageValue = (
	pluginId: string,
	payload: Record<string, unknown> = {}
) => {
	const key = String(payload.key ?? "");
	if (!key) {
		throw new Error("key is required");
	}
	const data = { ...getPluginData(pluginId) };
	delete data[key];
	// NOTE: this has to be replace(), not set(). ImmutableStore.set() writes
	// via a lodash deep merge, so it can only add or overwrite keys — writing
	// the shorter object back with it would leave the deleted key in place.
	// replace() unsets the path first, so the stored object is exactly `data`.
	// (unset() alone isn't enough: it deliberately does not emit "change", so
	// the write would never be persisted to disk.)
	store.replace(["plugins", pluginId, "data"], data);
	return { ok: true };
};

const getAllStorageValues = (
	pluginId: string,
	payload: Record<string, unknown> = {}
) => store.get(["plugins", pluginId, "data"], payload.defaultValue ?? {});

const setAllStorageValues = (
	pluginId: string,
	payload: Record<string, unknown> = {}
) => {
	assertWithinStorageSizeLimit(payload.value);
	// replace(), not set() — see deleteStorageValue: a merge would keep keys
	// the caller left out instead of replacing the whole object.
	store.replace(["plugins", pluginId, "data"], payload.value ?? {});
	return { ok: true };
};

const clearStorageValues = (pluginId: string) => {
	// replace(), not set() — merging {} into the existing data is a no-op.
	store.replace(["plugins", pluginId, "data"], {});
	return { ok: true };
};

const getWorkspaceSnapshot = () => store.get("workspace", {});

const getReduxSnapshot = () => reduxStore.getState();

const getTopicSnapshot = (
	topic: PluginBridgeTopic,
	pluginId: string | null = null
): unknown => {
	switch (topic) {
		case "workspace":
			return getWorkspaceSnapshot();
		case "redux":
			return getReduxSnapshot();
		case "parser":
			// Per-plugin, so a plugin never sees another plugin's matches.
			return (pluginId && parserSnapshots.get(pluginId)) || {};
		// "viewer" is a push-only event stream (pick/hold-progress); there is no
		// meaningful initial snapshot, so subscribers get null until an event fires.
		case "viewer":
			return null;
		default:
			return null;
	}
};

const requireVisualizer = (): VisualizerBridgeHandle => {
	const handle = visualizerBridge.get();
	if (!handle) {
		throw new Error("Visualizer is not available");
	}
	return handle;
};

// Defense-in-depth idle gate mirroring the app's `activeState === 'Idle'` checks:
// picking drives real machine moves, so refuse unless connected and idle.
const machineIsConnectedAndIdle = (): boolean => {
	const state = reduxStore.getState();
	const isConnected = !!state.connection?.isConnected;
	const activeState = state.controller?.state?.status?.activeState;
	return isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;
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

	// NOTE: this must NOT go through controller.command() with a trailing
	// callback. That callback becomes the socket.io ack, the server leaves it in
	// `args`, and handlers destructure positionally — so `gcode` reads it as
	// `context` and passes a function into feeder.feed(). Nothing invokes it and
	// this promise hangs until the SDK request times out. pluginCommand() keeps
	// the ack out of the args entirely.
	return controller.pluginCommand(cmd, args);
};

// --- Plugin parsers -----------------------------------------------------------
// Matching runs server-side against every raw firmware line, so only matches
// arrive here. Snapshots are kept per plugin, so one plugin can never observe
// another's parser output.

const parserSnapshots = new Map<string, Record<string, PluginParserMatch>>();

/**
 * Runtime (iframe-scoped) parser registrations, so they can be replayed after a
 * reconnect and torn down when the iframe goes away. Manifest parsers are not
 * tracked here — the server owns those.
 */
const runtimeParsers = new Map<
	string,
	{ pluginId: string; specs: Map<string, unknown> }
>();

const requireOwner = (source: MessageEventSource | null) => {
	const ownerId = getOwnerIdForSource(source);
	if (!ownerId) {
		throw new Error("Unable to resolve plugin identity for parser request");
	}
	return ownerId;
};

const registerRuntimeParser = async (
	source: MessageEventSource | null,
	pluginId: string,
	payload: Record<string, unknown> = {},
) => {
	const ownerId = requireOwner(source);
	const spec = payload.spec as { id?: string } | undefined;
	if (!spec || typeof spec.id !== "string") {
		throw new Error("A parser spec with an id is required");
	}

	const entry = runtimeParsers.get(ownerId) ?? {
		pluginId,
		specs: new Map<string, unknown>(),
	};
	entry.specs.set(spec.id, spec);
	runtimeParsers.set(ownerId, entry);

	return controller.registerPluginParsers(ownerId, pluginId, [spec]);
};

const unregisterRuntimeParser = async (
	source: MessageEventSource | null,
	payload: Record<string, unknown> = {},
) => {
	const ownerId = requireOwner(source);
	const parserId = typeof payload.id === "string" ? payload.id : undefined;

	const entry = runtimeParsers.get(ownerId);
	if (entry && parserId) {
		entry.specs.delete(parserId);
		if (entry.specs.size === 0) {
			runtimeParsers.delete(ownerId);
		}
	} else if (!parserId) {
		runtimeParsers.delete(ownerId);
	}

	return controller.unregisterPluginParsers(ownerId, parserId);
};

const runMachineQuery = async (payload: Record<string, unknown> = {}) => {
	const cmd = String(payload.cmd || "");
	if (!cmd) {
		throw new Error("cmd is required");
	}
	return controller.pluginQuery(cmd, (payload.opts as object) ?? {});
};

/**
 * Drops every runtime parser and live subscription belonging to one iframe.
 *
 * Must run BEFORE unregisterPluginWindow, which is what resolves the owner id.
 */
export const releaseRuntimeParsersForSource = (source: MessageEventSource) => {
	const ownerId = getOwnerIdForSource(source);
	if (ownerId && runtimeParsers.has(ownerId)) {
		runtimeParsers.delete(ownerId);
		controller.unregisterPluginParsers(ownerId).catch(() => {
			// The port may already be closed; the server drops these on close too.
		});
	}

	// Subscriptions were previously only reaped lazily, when a postMessage to a
	// dead iframe threw — so an unmounted plugin leaked its subscription until
	// the next broadcast happened to hit it.
	subscriptions.forEach((sub, id) => {
		if (sub.source === source) {
			subscriptions.delete(id);
		}
	});
	// // `controller.command` is fire-and-forget: it emits over the socket and the
	// // server never acks (see CNCEngine `socket.on('command')`). Waiting on a
	// // callback here would hang forever — resolve once the command is dispatched.
	// controller.command(cmd, ...args);
	// return { ok: true };
};

// --- Plugin-asserted busy latch ------------------------------------------------
// A plugin can flag the machine as busy for the whole span of a feeder-driven
// operation (e.g. Screw Spot drilling a batch of holes). The feeder streams
// line-by-line, so the raw controller `activeState` dips to Idle between moves
// and the status pill would otherwise flicker. Raising this latch lets the UI
// show a stable status without touching the loaded job (unlike a real sender
// run, which would replace the loaded file).
//
// The host owns the *release* so plugins don't have to detect completion (the
// feeder gives them no "finished" callback): once set, we watch the controller
// and auto-clear after the machine has genuinely returned to Idle and stayed
// there. `armed` guards against releasing during the latency between the call
// and the first move — we only start the release countdown after we've seen the
// machine actually leave Idle at least once.
const BUSY_IDLE_DEBOUNCE_MS = 1500; // sustained Idle before we call it done
const BUSY_ARM_GRACE_MS = 15000; // release if no motion ever starts
const BUSY_MAX_MS = 15 * 60 * 1000; // absolute cap so it can never stick on

let busyUnsubscribe: (() => void) | null = null;
let busyIdleTimer: ReturnType<typeof setTimeout> | null = null;
let busyGraceTimer: ReturnType<typeof setTimeout> | null = null;
let busyMaxTimer: ReturnType<typeof setTimeout> | null = null;
let busyArmed = false; // has the machine left Idle since we were set?

const clearBusyTimers = () => {
	for (const t of [busyIdleTimer, busyGraceTimer, busyMaxTimer]) {
		if (t) {
			clearTimeout(t);
		}
	}
	busyIdleTimer = null;
	busyGraceTimer = null;
	busyMaxTimer = null;
};

const releasePluginBusy = () => {
	clearBusyTimers();
	if (busyUnsubscribe) {
		busyUnsubscribe();
		busyUnsubscribe = null;
	}
	busyArmed = false;
	if (reduxStore.getState().pluginState?.busy) {
		reduxStore.dispatch(setPluginBusy({ busy: false }));
	}
};

const onBusyStateChange = () => {
	const state = reduxStore.getState();
	if (!state.connection?.isConnected) {
		releasePluginBusy();
		return;
	}
	const activeState = state.controller?.state?.status?.activeState;
	const isIdle = activeState === GRBL_ACTIVE_STATE_IDLE;
	if (!isIdle) {
		// Machine is doing something — arm release and cancel any pending
		// idle/grace countdowns.
		busyArmed = true;
		if (busyGraceTimer) {
			clearTimeout(busyGraceTimer);
			busyGraceTimer = null;
		}
		if (busyIdleTimer) {
			clearTimeout(busyIdleTimer);
			busyIdleTimer = null;
		}
		return;
	}
	// Idle. Only begin the release countdown once we've actually seen motion, so
	// command/round-trip latency after setBusy(true) can't release us early.
	if (busyArmed && !busyIdleTimer) {
		busyIdleTimer = setTimeout(releasePluginBusy, BUSY_IDLE_DEBOUNCE_MS);
	}
};

const setMachineBusy = async (payload: Record<string, unknown> = {}) => {
	const busy = !!payload.busy;
	if (!busy) {
		releasePluginBusy();
		return { ok: true };
	}

	const label = typeof payload.label === "string" ? payload.label : null;

	// (Re)arm for a fresh operation: tear down any prior watcher/timers first.
	clearBusyTimers();
	if (busyUnsubscribe) {
		busyUnsubscribe();
		busyUnsubscribe = null;
	}
	busyArmed = false;

	reduxStore.dispatch(setPluginBusy({ busy: true, label }));
	busyUnsubscribe = reduxStore.subscribe(onBusyStateChange);
	// Safety nets: drop the latch if motion never starts, and an absolute cap so
	// a wedged operation can never leave the pill stuck "busy" forever.
	busyGraceTimer = setTimeout(() => {
		if (!busyArmed) {
			releasePluginBusy();
		}
	}, BUSY_ARM_GRACE_MS);
	busyMaxTimer = setTimeout(releasePluginBusy, BUSY_MAX_MS);
	// Evaluate immediately in case the machine is already moving.
	onBusyStateChange();

	return { ok: true };
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

const STORAGE_REQUEST_TYPES = new Set([
	"storage:get",
	"storage:set",
	"storage:delete",
	"storage:get:all",
	"storage:set:all",
	"storage:clear",
]);

const PARSER_REQUEST_TYPES = new Set([
	"machine:parser:register",
	"machine:parser:unregister",
]);

const handleBridgeRequest = async (
	request: PluginBridgeRequest,
	capabilities: PluginCapabilities,
	pluginId: string | null,
	source: MessageEventSource | null
): Promise<unknown> => {
	// check if plugin is allowed to use this request type
	if (!capabilities.requestTypes.has(request.type)) {
		console.error(`Plugin not authorized to use '${request.type}`)
		throw new Error(`Plugin not authorized to use '${request.type}'`);
	}

	// defense in depth: storage requests must resolve to a registered plugin
	// identity (the source of the namespacing that keeps plugins from
	// reading/writing each other's data). An unregistered source is already
	// denied above via EMPTY_CAPABILITIES, so this should never trip in
	// practice.
	if (STORAGE_REQUEST_TYPES.has(request.type) && !pluginId) {
		throw new Error("Unable to resolve plugin identity for storage request");
	}

	// Same reasoning as storage: a runtime parser is owned by one iframe, and
	// without a resolvable identity it could never be torn down.
	if (PARSER_REQUEST_TYPES.has(request.type) && !pluginId) {
		throw new Error("Unable to resolve plugin identity for parser request");
	}

	switch (request.type) {
		case "machine:get:context":
			return getMachineContext();
		case "machine:command":
			return runMachineCommand(request.payload, /*capabilities*/);
		case "machine:parser:register":
			return registerRuntimeParser(source, pluginId as string, request.payload);
		case "machine:parser:unregister":
			return unregisterRuntimeParser(source, request.payload);
		case "machine:query":
			return runMachineQuery(request.payload);
		case "machine:busy:set":
			return setMachineBusy(request.payload);
		case "workspace:get:state":
			return getWorkspaceSnapshot();
		case "redux:get:state":
			return getReduxSnapshot();
		case "gcode:load:to:visualizer":
			return loadGCodeToVisualizer(
				request.payload as { gcode: string; name: string }
			);
		case "viewer:screen-to-world": {
			const handle = requireVisualizer();
			const { px, py } = (request.payload ?? {}) as { px: number; py: number };
			return handle.screenToWorld(px, py);
		}
		case "viewer:world-to-screen": {
			const handle = requireVisualizer();
			const { x, y, z } = (request.payload ?? {}) as {
				x: number;
				y: number;
				z?: number;
			};
			return handle.worldToScreen(x, y, z);
		}
		case "viewer:camera:set": {
			const handle = requireVisualizer();
			const { view } = (request.payload ?? {}) as {
				view: "top" | "3d" | "front" | "left" | "right";
			};
			handle.setCameraView(view);
			return { ok: true };
		}
		case "viewer:camera:lock-rotate": {
			const handle = requireVisualizer();
			const { locked } = (request.payload ?? {}) as { locked: boolean };
			handle.setRotateEnabled(!locked);
			return { ok: true };
		}
		case "viewer:pick:arm": {
			const handle = requireVisualizer();
			if (handle.isRotaryFile()) {
				throw new Error("Picking is not available for rotary files");
			}
			if (!machineIsConnectedAndIdle()) {
				throw new Error("Machine must be connected and idle to pick a point");
			}
			const { mode } = (request.payload ?? {}) as {
				mode?: "click" | "hold";
			};
			handle.armPick(
				mode === "click" ? "click" : "hold",
				(p) =>
					broadcastViewerEvent({
						kind: "pick",
						world: p.world,
						screen: p.screen,
					}),
				(t) => broadcastViewerEvent({ kind: "hold-progress", t }),
			);
			return { ok: true };
		}
		case "viewer:pick:disarm": {
			const handle = requireVisualizer();
			handle.disarmPick();
			return { ok: true };
		}
		case "viewer:overlay:set": {
			const handle = requireVisualizer();
			const { markers } = (request.payload ?? {}) as {
				markers?: OverlayMarker[];
			};
			handle.setOverlay(Array.isArray(markers) ? markers : []);
			return { ok: true };
		}
		case "storage:get":
			return getStorageValue(pluginId as string, request.payload);
		case "storage:set":
			return setStorageValue(pluginId as string, request.payload);
		case "storage:delete":
			return deleteStorageValue(pluginId as string, request.payload);
		case "storage:get:all":
			return getAllStorageValues(pluginId as string, request.payload);
		case "storage:set:all":
			return setAllStorageValues(pluginId as string, request.payload);
		case "storage:clear":
			return clearStorageValues(pluginId as string);
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
	const pluginId = getPluginIdForSource(event.source);

	try {
		const result = await handleBridgeRequest(
			request,
			capabilities,
			pluginId,
			event.source
		);
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
	pluginId: string | null;
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

const broadcast = (topic: PluginBridgeTopic, onlyPluginId?: string) => {
	if (subscriptions.size === 0) {
		return;
	}

	// Compute the snapshot once per broadcast where it is shared. The "parser"
	// topic is per-plugin, so it has to be computed per subscriber instead.
	let snapshot: unknown;
	let computed = false;

	subscriptions.forEach((sub) => {
		if (sub.topic !== topic) {
			return;
		}
		if (onlyPluginId && sub.pluginId !== onlyPluginId) {
			return;
		}
		if (topic === "parser") {
			pushUpdate(sub, getTopicSnapshot(topic, sub.pluginId));
			return;
		}
		if (!computed) {
			snapshot = getTopicSnapshot(topic);
			computed = true;
		}
		pushUpdate(sub, snapshot);
	});
};

/**
 * Pushes a discrete event, as opposed to a snapshot.
 *
 * Needed alongside broadcast() because a snapshot is last-value-only and
 * useSyncExternalStore de-dupes by reference — two matches arriving in one tick
 * would collapse into one. Dropping a firmware match is a correctness bug, so
 * onParsed rides this stream while useParsed reads the snapshot.
 */
const pushEvent = (sub: PluginSubscription, payload: unknown) => {
	try {
		sub.source.postMessage(
			{
				channel: BRIDGE_CHANNEL,
				event: { id: sub.id, topic: sub.topic, event: payload },
			},
			{ targetOrigin: sub.origin },
		);
	} catch {
		subscriptions.delete(sub.id);
	}
};

const emitEvent = (
	topic: PluginBridgeTopic,
	pluginId: string,
	payload: unknown,
) => {
	subscriptions.forEach((sub) => {
		if (sub.topic === topic && sub.pluginId === pluginId) {
			pushEvent(sub, payload);
		}
	});
};

// Push a one-off event (pick / hold-progress) to every "viewer"-topic
// subscriber. Unlike broadcast(), the payload is the event itself rather than a
// recomputed state snapshot, since "viewer" is a push-only event stream. Rides
// the "update"/topic-snapshot channel (not the "parser"-style discrete-event
// channel above) because the client reads it via getTopicSnapshot/subscribeTopic.
const broadcastViewerEvent = (event: unknown) => {
	if (subscriptions.size === 0) {
		return;
	}
	subscriptions.forEach((sub) => {
		if (sub.topic !== "viewer") {
			return;
		}
		pushUpdate(sub, event);
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

	controller.addListener("plugin:parser:match", (match: PluginParserMatch) => {
		if (!match?.pluginId) {
			return;
		}
		// Replace the map so the topic snapshot changes identity, but keep every
		// other parser's entry referentially stable — useParsed(id) then only
		// re-renders for the parser that actually fired.
		const forPlugin = { ...(parserSnapshots.get(match.pluginId) ?? {}) };
		forPlugin[match.parserId] = match;
		parserSnapshots.set(match.pluginId, forPlugin);

		broadcast("parser", match.pluginId);
		emitEvent("parser", match.pluginId, match);
	});

	controller.addListener("plugin:parser:error", (error: PluginParserError) => {
		if (error?.pluginId) {
			emitEvent("parser", error.pluginId, error);
		}
	});

	// Server-side registrations die with the controller, so a reconnect has to
	// replay them or a plugin silently stops receiving matches.
	controller.addListener("serialport:open", () => {
		runtimeParsers.forEach((entry, ownerId) => {
			controller
				.registerPluginParsers(ownerId, entry.pluginId, [...entry.specs.values()])
				.catch(() => {
					// Best effort — the plugin sees the gap via plugin:parser:error.
				});
		});
	});
};

const addSubscription = (
	source: MessageEventSource,
	origin: string,
	subscribe: PluginBridgeSubscribe,
	capabilities: PluginCapabilities,
	pluginId: string | null
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
		pluginId,
	};

	subscriptions.set(sub.id, sub);

	// Push the current value immediately so the hook renders without waiting for
	// the next store change. For "parser" this is what lets a widget mounting
	// late — a carve-page widget, say — show the last match straight away
	// instead of waiting for the machine to repeat itself.
	pushUpdate(sub, getTopicSnapshot(sub.topic, sub.pluginId));
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
					capabilities,
					getPluginIdForSource(event.source)
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
