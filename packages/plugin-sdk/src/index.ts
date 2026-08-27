export {
	PLUGIN_BRIDGE_CHANNEL,
	type PluginBridgeRequest,
	type PluginBridgeRequestType,
	type PluginBridgeResponse,
	type PluginBridgeTopic,
} from "./bridge.js";

import { getTopicSnapshot, request, subscribeTopic } from "./bridge.js";

// --- Imperative client --------------------------------------------------------

type MachineClient = {
	getContext: () => Promise<unknown>;
	command: (cmd: string, ...args: unknown[]) => Promise<unknown>;
}
type WorkspaceClient = {
	getState: () => Promise<unknown>;
}
type ReduxClient = {
	getState: () => Promise<unknown>;
}
type GcodeClient = {
	/** Load a raw G-code program into gSender's main visualizer/job. */
	loadToVisualizer: (gcode: string, name?: string) => Promise<unknown>;
}
type StorageClient = {
	/** Get a value from this plugin's own namespaced storage. */
	get: <T = unknown>(key: string, defaultValue?: T) => Promise<T | undefined>;
	/** Set a value in this plugin's own namespaced storage. */
	set: (key: string, value: unknown) => Promise<void>;
	/** Delete a key from this plugin's own namespaced storage. */
	delete: (key: string) => Promise<void>;
	/** Get this plugin's entire namespaced storage object. */
	getAll: <T = Record<string, unknown>>(defaultValue?: T) => Promise<T>;
	/** Replace this plugin's entire namespaced storage object. */
	setAll: (value: Record<string, unknown>) => Promise<void>;
	/** Clear this plugin's entire namespaced storage object. */
	clear: () => Promise<void>;
}
type GsenderClient = {
	machine: MachineClient;
	workspace: WorkspaceClient;
	redux: ReduxClient;
	gcode: GcodeClient;
};

const createMachineClient = (): MachineClient => ({
	getContext: () => request("machine:get:context"),
	command: (cmd, ...args) => request("machine:command", { cmd, args }),
});
const createWorkspaceClient = (): WorkspaceClient => ({
	getState: () => request("workspace:get:state"),
});
const createReduxClient = (): ReduxClient => ({
	getState: () => request("redux:get:state"),
});
const createGcodeClient = (): GcodeClient => ({
	loadToVisualizer: (gcode, name) =>
	request("gcode:load:to:visualizer", { gcode, name }),
})
// Not part of `gsender`/`GsenderClient` on purpose: capability grants are
// derived from a static scan of imported names, so `storage` must be its own
// directly-imported export to get its own explicit, separately-approved
// permission rather than riding along with the `gsender` bundle.
const createStorageClient = (): StorageClient => ({
	get: (key, defaultValue) => request("storage:get", { key, defaultValue }),
	set: (key, value) =>
		request("storage:set", { key, value }).then(() => undefined),
	delete: (key) =>
		request("storage:delete", { key }).then(() => undefined),
	getAll: (defaultValue) => request("storage:get:all", { defaultValue }),
	setAll: (value) =>
		request("storage:set:all", { value }).then(() => undefined),
	clear: () => request("storage:clear").then(() => undefined),
});
export const machine = createMachineClient();
export const workspace = createWorkspaceClient();
export const redux = createReduxClient();
export const gcode = createGcodeClient();
export const storage = createStorageClient();

const createGsenderClient = (): GsenderClient => ({
	machine: machine,
	workspace: workspace,
	redux: redux,
	gcode: gcode,
});
export const gsender = createGsenderClient();

// --- Framework-agnostic helpers ----------------------------------------------
// For plugins that don't use React (vanilla JS, Vue, Svelte, etc.). The `get*`
// helpers return a one-shot snapshot (Promise). The `subscribe*` helpers deliver
// the current value immediately and then on every change, returning an
// unsubscribe function.

/** One-shot snapshot of gSender's workspace state. */
export const getWorkspaceState = <T = unknown>(): Promise<T> =>
	request<T>("workspace:get:state");

/** One-shot snapshot of gSender's full redux state. */
export const getReduxState = <T = unknown>(): Promise<T> =>
	request<T>("redux:get:state");

/** One-shot selected slice of gSender's redux state. */
export const getSelector = async <Selected = unknown, State = unknown>(
	selector: (state: State) => Selected,
): Promise<Selected> => selector(await getReduxState<State>());

/**
 * Subscribe to live workspace state. Calls `callback` immediately with the
 * current value (once available) and again whenever it changes.
 * @returns unsubscribe function
 */
export const subscribeWorkspaceState = <T = unknown>(
	callback: (state: T) => void,
): (() => void) => {
	const notify = () => {
		const snapshot = getTopicSnapshot<T>("workspace");
		if (snapshot !== undefined) {
			callback(snapshot);
		}
	};

	const unsubscribe = subscribeTopic("workspace", notify);
	notify();
	return unsubscribe;
};

/**
 * Subscribe to a slice of gSender's redux state. Calls `callback` immediately
 * with the current selected value (once available) and again whenever it
 * changes. Pass `equalityFn` to skip callbacks when the selected value is equal.
 * @returns unsubscribe function
 */
export const subscribeSelector = <Selected = unknown, State = unknown>(
	selector: (state: State) => Selected,
	callback: (selected: Selected) => void,
	equalityFn?: (a: Selected, b: Selected) => boolean,
): (() => void) => {
	let last: { value: Selected } | null = null;

	const notify = () => {
		const root = getTopicSnapshot<State>("redux");
		if (root === undefined) {
			return;
		}
		const next = selector(root);
		if (last) {
			const same = equalityFn
				? equalityFn(last.value, next)
				: last.value === next;
			if (same) {
				return;
			}
		}
		last = { value: next };
		callback(next);
	};

	const unsubscribe = subscribeTopic("redux", notify);
	notify();
	return unsubscribe;
};
