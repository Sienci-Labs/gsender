export {
	type CameraView,
	type OverlayMarker,
	PLUGIN_BRIDGE_CHANNEL,
	type PluginBridgeRequest,
	type PluginBridgeRequestType,
	type PluginBridgeResponse,
	type PluginBridgeTopic,
	type ViewerPickEvent,
} from "./bridge.js";

import {
	type CameraView,
	getTopicSnapshot,
	type OverlayMarker,
	request,
	subscribeTopic,
	type ViewerPickEvent,
} from "./bridge.js";

// --- Imperative client --------------------------------------------------------

type MachineClient = {
	getContext: () => Promise<unknown>;
	command: (cmd: string, ...args: unknown[]) => Promise<unknown>;
	setBusy: (busy: boolean, label?: string) => Promise<void>
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
type ViewerClient = {
	/** Project a screen pixel onto the visualizer's work plane. */
	screenToWorld: (
		px: number,
		py: number,
	) => Promise<{ x: number; y: number; z: number } | null>;
	/** Project a world coordinate to a screen pixel. */
	worldToScreen: (
		x: number,
		y: number,
		z?: number,
	) => Promise<{ x: number; y: number } | null>;
	camera: {
		/** Snap the host camera to a preset view. */
		set: (view: CameraView) => Promise<void>;
		/** Lock/unlock camera rotation on the host visualizer. */
		lockRotate: (locked: boolean) => Promise<void>;
	};
	/**
	 * Arm point-picking on the host visualizer. Subscribes to pick events
	 * first, then arms; resolves to a disposer that disarms and unsubscribes.
	 * Rejects if the host refuses to arm (see preconditions in the README).
	 */
	armPick: (
		mode: "click" | "hold",
		cb: (e: ViewerPickEvent) => void,
	) => Promise<() => void>;
	/** Disarm point-picking (fire-and-forget on the host). */
	disarmPick: () => Promise<void>;
	/** Replace the overlay markers drawn on the host visualizer. */
	setOverlay: (markers: OverlayMarker[]) => Promise<void>;
}
type GsenderClient = {
	machine: MachineClient;
	workspace: WorkspaceClient;
	redux: ReduxClient;
	gcode: GcodeClient;
	viewer: ViewerClient;
};

const createMachineClient = (): MachineClient => ({
	getContext: () => request("machine:get:context"),
	command: (cmd, ...args) => request("machine:command", { cmd, args }),
	setBusy: async (busy, label) => {
		await request("machine:busy:set", { busy, label });
	},
});
const createViewerClient = (): ViewerClient => ({
	screenToWorld: (px, py) =>
		request<{ x: number; y: number; z: number } | null>(
			"viewer:screen-to-world",
			{ px, py },
		),
	worldToScreen: (x, y, z) =>
		request<{ x: number; y: number } | null>("viewer:world-to-screen", {
			x,
			y,
			z,
		}),
	camera: {
		set: async (view) => {
			await request("viewer:camera:set", { view });
		},
		lockRotate: async (locked) => {
			await request("viewer:camera:lock-rotate", { locked });
		},
	},
	armPick: async (mode, cb) => {
		// Subscribe FIRST so no pick event is missed between arm and the
		// first host push.
		const notify = () => {
			const event = getTopicSnapshot<ViewerPickEvent>("viewer");
			if (event !== undefined) {
				cb(event);
			}
		};
		const unsubscribe = subscribeTopic("viewer", notify);

		try {
			await request("viewer:pick:arm", { mode });
		} catch (error) {
			unsubscribe();
			throw error;
		}

		return () => {
			unsubscribe();
			// Fire-and-forget; swallow errors (host may already be gone).
			request("viewer:pick:disarm").catch(() => {});
		};
	},
	disarmPick: async () => {
		await request("viewer:pick:disarm");
	},
	setOverlay: async (markers) => {
		await request("viewer:overlay:set", { markers });
	},
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
export const viewer = createViewerClient();

const createGsenderClient = (): GsenderClient => ({
	machine: machine,
	workspace: workspace,
	redux: redux,
	gcode: gcode,
	viewer: viewer
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
