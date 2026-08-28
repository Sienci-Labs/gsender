jest.mock("app/lib/controller", () => ({
	port: "COM-TEST",
	command: jest.fn(),
	addListener: jest.fn(),
	removeListener: jest.fn(),
}));
jest.mock("app/lib/fileupload", () => ({
	uploadGcodeFileToServer: jest.fn(async () => ({})),
}));
jest.mock("app/store", () => ({
	get: jest.fn((key: string, fallback: unknown) =>
		key === "workspace" ? { units: "mm" } : fallback,
	),
	on: jest.fn(),
}));
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
import { handlePluginBridgeMessage } from "../pluginBridge";

const CHANNEL = "gsender:plugin-bridge";

const makeEvent = (
	source: object | null,
	request: { id: string; type: string },
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
