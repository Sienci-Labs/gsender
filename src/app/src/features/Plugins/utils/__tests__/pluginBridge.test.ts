jest.mock("app/lib/controller", () => ({
	port: "COM-TEST",
	command: jest.fn(),
	addListener: jest.fn(),
	removeListener: jest.fn(),
}));
jest.mock("app/lib/fileupload", () => ({
	uploadGcodeFileToServer: jest.fn(async () => ({})),
}));
// Delegates to the real ImmutableStore rather than to a flat key/value fake:
// its set() deep-merges, so a write that removes a key behaves very differently
// from a plain assignment. A simplified fake would let such a write pass here
// while silently failing in the app.
jest.mock("app/store", () => {
	const ImmutableStore = require("app/lib/immutable-store").default;
	const store = new ImmutableStore({ workspace: { units: "mm" } });
	return {
		get: jest.fn((key: string | string[], fallback: unknown) =>
			store.get(key, fallback),
		),
		set: jest.fn((key: string | string[], value: unknown) =>
			store.set(key, value),
		),
		replace: jest.fn((key: string | string[], value: unknown) =>
			store.replace(key, value),
		),
		on: jest.fn(),
	};
});
jest.mock("app/store/redux", () => ({
	getState: jest.fn(() => ({ controller: {}, connection: {} })),
	subscribe: jest.fn(),
}));
jest.mock("app/constants", () => ({ VISUALIZER_PRIMARY: "primary" }));

import { toRuntimeCapabilities } from "../capabilities";
import {
	registerPluginWindow,
	unregisterPluginWindow,
} from "../plugin-permissions";
import controller from "app/lib/controller";
import {
	handlePluginBridgeMessage,
	releaseRuntimeParsersForSource,
} from "../pluginBridge";

const CHANNEL = "gsender:plugin-bridge";

const makeEvent = (
	source: object | null,
	request: { id: string; type: string; payload?: Record<string, unknown> },
) =>
	({
		data: { channel: CHANNEL, request },
		source,
		origin: "http://localhost",
	}) as unknown as MessageEvent;

describe("plugin bridge request gate", () => {
	const source = {} as MessageEventSource;

	afterEach(() => {
		unregisterPluginWindow(source);
	});

	it("allows a request type the plugin was granted", async () => {
		registerPluginWindow(
			source,
			// Exactly what a manifest read off disk produces: JSON arrays.
			toRuntimeCapabilities(
				JSON.parse('{"requestTypes":["workspace:get:state"],"topics":[]}'),
			),
			"com.sienci.test-plugin",
		);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, { id: "1", type: "workspace:get:state" }),
		);

		expect(response).toEqual({
			id: "1",
			ok: true,
			result: { units: "mm" },
		});
	});

	it("denies a request type the plugin was NOT granted", async () => {
		registerPluginWindow(
			source,
			toRuntimeCapabilities({ requestTypes: ["workspace:get:state"] }),
			"com.sienci.test-plugin",
		);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, { id: "2", type: "machine:command" }),
		);

		expect(response).toMatchObject({ id: "2", ok: false });
		expect(response?.error).toMatch(/not authorized/i);
	});

	it("denies an unregistered source outright", async () => {
		const response = await handlePluginBridgeMessage(
			makeEvent({} as MessageEventSource, {
				id: "3",
				type: "workspace:get:state",
			}),
		);

		expect(response).toMatchObject({ id: "3", ok: false });
		expect(response?.error).toMatch(/not authorized/i);
	});

	it("passes a granted viewer:* request through to the real handler (no primary visualizer mounted in this test env)", async () => {
		registerPluginWindow(
			source,
			toRuntimeCapabilities({
				requestTypes: ["viewer:screen-to-world"],
				topics: [],
			}),
		);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, { id: "4", type: "viewer:screen-to-world" }),
		);

		// The gate let it through — this is a domain error from the handler
		// (no primary GcodeViewer registered), not an authorization error.
		expect(response).toMatchObject({ id: "4", ok: false });
		expect(response?.error).not.toMatch(/not authorized/i);
		expect(response?.error).toMatch(/visualizer is not available/i);
	});

	it.each([
		"viewer:camera:set",
		"viewer:pick:arm",
		"viewer:overlay:set",
		"machine:busy:set",
	] as const)("denies '%s' when not granted", async (type) => {
		registerPluginWindow(
			source,
			toRuntimeCapabilities({ requestTypes: ["workspace:get:state"] }),
		);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, { id: type, type }),
		);

		expect(response).toMatchObject({ id: type, ok: false });
		expect(response?.error).toMatch(/not authorized/i);
	});
});

describe("plugin storage isolation", () => {
	const sourceA = {} as MessageEventSource;
	const sourceB = {} as MessageEventSource;

	const STORAGE_CAPABILITIES = toRuntimeCapabilities({
		requestTypes: [
			"storage:get",
			"storage:set",
			"storage:delete",
			"storage:get:all",
			"storage:set:all",
			"storage:clear",
		],
	});

	afterEach(() => {
		unregisterPluginWindow(sourceA);
		unregisterPluginWindow(sourceB);
	});

	it("round-trips a value under the calling plugin's own namespace", async () => {
		registerPluginWindow(sourceA, STORAGE_CAPABILITIES, "com.sienci.plugin-a");

		const setResponse = await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:set",
				payload: { key: "foo", value: 123 },
			}),
		);
		expect(setResponse).toMatchObject({ id: "1", ok: true });

		const getResponse = await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "2",
				type: "storage:get",
				payload: { key: "foo" },
			}),
		);
		expect(getResponse).toEqual({ id: "2", ok: true, result: 123 });
	});

	it("does not leak one plugin's storage to another plugin", async () => {
		registerPluginWindow(sourceA, STORAGE_CAPABILITIES, "com.sienci.plugin-a");
		registerPluginWindow(sourceB, STORAGE_CAPABILITIES, "com.sienci.plugin-b");

		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:set",
				payload: { key: "shared-key", value: "plugin-a-value" },
			}),
		);

		const responseFromB = await handlePluginBridgeMessage(
			makeEvent(sourceB, {
				id: "2",
				type: "storage:get",
				payload: { key: "shared-key", defaultValue: "default" },
			}),
		);

		expect(responseFromB).toEqual({ id: "2", ok: true, result: "default" });
	});

	it("returns the provided default value for a missing key", async () => {
		registerPluginWindow(sourceA, STORAGE_CAPABILITIES, "com.sienci.plugin-a");

		const response = await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:get",
				payload: { key: "missing", defaultValue: "fallback" },
			}),
		);

		expect(response).toEqual({ id: "1", ok: true, result: "fallback" });
	});

	it("removes the key from storage on delete", async () => {
		registerPluginWindow(
			sourceA,
			STORAGE_CAPABILITIES,
			"com.sienci.plugin-delete",
		);

		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:set",
				payload: { key: "foo", value: 123 },
			}),
		);
		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "2",
				type: "storage:set",
				payload: { key: "bar", value: "x" },
			}),
		);

		const deleteResponse = await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "3",
				type: "storage:delete",
				payload: { key: "foo" },
			}),
		);
		expect(deleteResponse).toMatchObject({ id: "3", ok: true });

		const getResponse = await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "4",
				type: "storage:get",
				payload: { key: "foo", defaultValue: "gone" },
			}),
		);
		expect(getResponse).toEqual({ id: "4", ok: true, result: "gone" });

		const getAllResponse = await handlePluginBridgeMessage(
			makeEvent(sourceA, { id: "5", type: "storage:get:all" }),
		);
		expect(getAllResponse).toEqual({
			id: "5",
			ok: true,
			result: { bar: "x" },
		});
	});

	it("replaces the whole namespace on setAll rather than merging", async () => {
		registerPluginWindow(
			sourceA,
			STORAGE_CAPABILITIES,
			"com.sienci.plugin-set-all",
		);

		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:set:all",
				payload: { value: { a: 1, b: 2 } },
			}),
		);
		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "2",
				type: "storage:set:all",
				payload: { value: { c: 3 } },
			}),
		);

		const response = await handlePluginBridgeMessage(
			makeEvent(sourceA, { id: "3", type: "storage:get:all" }),
		);
		expect(response).toEqual({ id: "3", ok: true, result: { c: 3 } });
	});

	it("empties the namespace on clear", async () => {
		registerPluginWindow(
			sourceA,
			STORAGE_CAPABILITIES,
			"com.sienci.plugin-clear",
		);

		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:set",
				payload: { key: "foo", value: 123 },
			}),
		);

		const clearResponse = await handlePluginBridgeMessage(
			makeEvent(sourceA, { id: "2", type: "storage:clear" }),
		);
		expect(clearResponse).toMatchObject({ id: "2", ok: true });

		const response = await handlePluginBridgeMessage(
			makeEvent(sourceA, { id: "3", type: "storage:get:all" }),
		);
		expect(response).toEqual({ id: "3", ok: true, result: {} });
	});

	it("clears only the calling plugin's namespace", async () => {
		registerPluginWindow(
			sourceA,
			STORAGE_CAPABILITIES,
			"com.sienci.plugin-clear-a",
		);
		registerPluginWindow(
			sourceB,
			STORAGE_CAPABILITIES,
			"com.sienci.plugin-clear-b",
		);

		await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:set",
				payload: { key: "kept", value: "a-value" },
			}),
		);
		await handlePluginBridgeMessage(
			makeEvent(sourceB, {
				id: "2",
				type: "storage:set",
				payload: { key: "kept", value: "b-value" },
			}),
		);

		await handlePluginBridgeMessage(
			makeEvent(sourceA, { id: "3", type: "storage:clear" }),
		);

		const responseFromB = await handlePluginBridgeMessage(
			makeEvent(sourceB, { id: "4", type: "storage:get:all" }),
		);
		expect(responseFromB).toEqual({
			id: "4",
			ok: true,
			result: { kept: "b-value" },
		});
	});

	it("denies storage requests without the storage permission", async () => {
		registerPluginWindow(
			sourceA,
			toRuntimeCapabilities({ requestTypes: ["workspace:get:state"] }),
			"com.sienci.plugin-a",
		);

		const response = await handlePluginBridgeMessage(
			makeEvent(sourceA, {
				id: "1",
				type: "storage:get",
				payload: { key: "foo" },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(response?.error).toMatch(/not authorized/i);
	});
});

describe("plugin parsers", () => {
	const source = {} as MessageEventSource;
	const other = {} as MessageEventSource;

	const grant = (
		win: MessageEventSource,
		pluginId: string,
		requestTypes: string[],
		topics: string[] = [],
	) =>
		registerPluginWindow(
			win,
			toRuntimeCapabilities({ requestTypes, topics }),
			pluginId,
		);

	beforeEach(() => {
		jest.clearAllMocks();
		controller.registerPluginParsers = jest.fn(async () => ({
			registered: ["probe"],
			errors: [],
		}));
		controller.unregisterPluginParsers = jest.fn(async () => ({ ok: true }));
		controller.pluginQuery = jest.fn(async () => ({ lines: ["ok"], ok: true }));
	});

	afterEach(() => {
		unregisterPluginWindow(source);
		unregisterPluginWindow(other);
	});

	it("denies parser registration without machine:parser:register", async () => {
		grant(source, "com.sienci.a", ["workspace:get:state"]);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:parser:register",
				payload: { spec: { id: "probe", match: { source: "^ok$" } } },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(response?.error).toMatch(/not authorized/i);
		expect(controller.registerPluginParsers).not.toHaveBeenCalled();
	});

	it("forwards a granted registration to the controller with an owner id", async () => {
		grant(source, "com.sienci.a", ["machine:parser:register"]);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:parser:register",
				payload: { spec: { id: "probe", match: { source: "^ok$" } } },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: true });
		const [ownerId, pluginId, specs] = (
			controller.registerPluginParsers as jest.Mock
		).mock.calls[0];
		// Owner id is per-mount, so a remount cannot inherit the previous
		// mount's server-side parsers.
		expect(ownerId).toMatch(/^com\.sienci\.a#\d+$/);
		expect(pluginId).toBe("com.sienci.a");
		expect(specs).toEqual([{ id: "probe", match: { source: "^ok$" } }]);
	});

	it("rejects a registration with no spec id", async () => {
		grant(source, "com.sienci.a", ["machine:parser:register"]);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:parser:register",
				payload: { spec: { match: { source: "^ok$" } } },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(controller.registerPluginParsers).not.toHaveBeenCalled();
	});

	it("denies a registration from an unregistered source", async () => {
		const response = await handlePluginBridgeMessage(
			makeEvent({} as MessageEventSource, {
				id: "1",
				type: "machine:parser:register",
				payload: { spec: { id: "probe", match: { source: "^ok$" } } },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(controller.registerPluginParsers).not.toHaveBeenCalled();
	});

	it("denies machine:query without the query permission", async () => {
		grant(source, "com.sienci.a", ["machine:parser:register"]);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:query",
				payload: { cmd: "$$" },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(controller.pluginQuery).not.toHaveBeenCalled();
	});

	it("forwards a granted query to the controller", async () => {
		grant(source, "com.sienci.a", ["machine:query"]);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:query",
				payload: { cmd: "$$", opts: { until: "ok" } },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: true });
		expect(controller.pluginQuery).toHaveBeenCalledWith("$$", { until: "ok" });
	});

	it("rejects a query with no command", async () => {
		grant(source, "com.sienci.a", ["machine:query"]);

		const response = await handlePluginBridgeMessage(
			makeEvent(source, { id: "1", type: "machine:query", payload: {} }),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(controller.pluginQuery).not.toHaveBeenCalled();
	});

	it("releases a source's runtime parsers when its iframe unmounts", async () => {
		grant(source, "com.sienci.a", ["machine:parser:register"]);
		await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:parser:register",
				payload: { spec: { id: "probe", match: { source: "^ok$" } } },
			}),
		);

		releaseRuntimeParsersForSource(source);

		expect(controller.unregisterPluginParsers).toHaveBeenCalledWith(
			expect.stringMatching(/^com\.sienci\.a#\d+$/),
		);
	});

	it("does not unregister anything for a source that registered none", () => {
		grant(source, "com.sienci.a", ["machine:parser:register"]);

		releaseRuntimeParsersForSource(source);

		expect(controller.unregisterPluginParsers).not.toHaveBeenCalled();
	});

	it("gives each mount of the same plugin a distinct owner id", async () => {
		grant(source, "com.sienci.a", ["machine:parser:register"]);
		grant(other, "com.sienci.a", ["machine:parser:register"]);

		const spec = { id: "probe", match: { source: "^ok$" } };
		await handlePluginBridgeMessage(
			makeEvent(source, { id: "1", type: "machine:parser:register", payload: { spec } }),
		);
		await handlePluginBridgeMessage(
			makeEvent(other, { id: "2", type: "machine:parser:register", payload: { spec } }),
		);

		const owners = (controller.registerPluginParsers as jest.Mock).mock.calls.map(
			([ownerId]) => ownerId,
		);
		expect(owners[0]).not.toBe(owners[1]);
	});
});

describe("machine:command", () => {
	const source = {} as MessageEventSource;

	beforeEach(() => {
		jest.clearAllMocks();
		controller.pluginCommand = jest.fn(async () => ({ ok: true }));
		registerPluginWindow(
			source,
			toRuntimeCapabilities({ requestTypes: ["machine:command"] }),
			"com.sienci.a",
		);
	});

	afterEach(() => {
		unregisterPluginWindow(source);
	});

	it("forwards a granted command to the controller", async () => {
		const response = await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:command",
				payload: { cmd: "gcode", args: ["$$"] },
			}),
		);

		expect(response).toMatchObject({ id: "1", ok: true });
		expect(controller.pluginCommand).toHaveBeenCalledWith("gcode", ["$$"]);
	});

	it("never routes through controller.command", async () => {
		// Regression guard. controller.command() settles by passing a callback
		// through the controller's args, where the `gcode` handler destructures
		// it as `context` and hands a function to feeder.feed() — so the promise
		// hangs and the feeder gets a bad context. Keep this off that path.
		await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:command",
				payload: { cmd: "gcode", args: ["$$"] },
			}),
		);

		expect(controller.command).not.toHaveBeenCalled();
	});

	it("defaults args to an empty array", async () => {
		await handlePluginBridgeMessage(
			makeEvent(source, {
				id: "1",
				type: "machine:command",
				payload: { cmd: "homing" },
			}),
		);

		expect(controller.pluginCommand).toHaveBeenCalledWith("homing", []);
	});

	it("rejects an empty command without touching the controller", async () => {
		const response = await handlePluginBridgeMessage(
			makeEvent(source, { id: "1", type: "machine:command", payload: {} }),
		);

		expect(response).toMatchObject({ id: "1", ok: false });
		expect(controller.pluginCommand).not.toHaveBeenCalled();
	});
});
