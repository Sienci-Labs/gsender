import { buildGrantFromScan, toRuntimeCapabilities } from "../capabilities";

describe("buildGrantFromScan", () => {
	it("maps scanned SDK import names to wire arrays and display permissions", () => {
		const { permissions, wire } = buildGrantFromScan([
			"gcode",
			"useWorkspaceState",
		]);

		expect(wire).toEqual({
			requestTypes: ["gcode:load:to:visualizer"],
			topics: ["workspace"],
			allowedFunctions: ["gcode", "useWorkspaceState"],
		});
		expect(permissions).toEqual(
			expect.arrayContaining(["visualizer:load", "workspace:read"]),
		);
	});

	it("survives a JSON round-trip losslessly (Sets never reach the wire)", () => {
		const { wire } = buildGrantFromScan(["gcode", "useWorkspaceState"]);
		expect(JSON.parse(JSON.stringify(wire))).toEqual(wire);
		expect(wire.requestTypes.length).toBeGreaterThan(0);
	});

	it("handles the whole-module sentinel and ignores unknown names", () => {
		const { permissions, wire } = buildGrantFromScan([
			"*require-whole-module*",
			"somethingUnknown",
		]);

		// The sentinel grants every request type but is not itself a function.
		expect(wire.requestTypes).toEqual(
			expect.arrayContaining(["machine:command", "gcode:load:to:visualizer"]),
		);
		expect(wire.allowedFunctions).not.toContain("*require-whole-module*");
		// Unknown names must not leak undefined into the permission list.
		expect(permissions).not.toContain(undefined);
	});
});

describe("toRuntimeCapabilities", () => {
	it("builds Sets from wire arrays", () => {
		const capabilities = toRuntimeCapabilities({
			requestTypes: ["workspace:get:state"],
			topics: ["workspace"],
		});
		expect(capabilities.requestTypes.has("workspace:get:state")).toBe(true);
		expect(capabilities.topics.has("workspace")).toBe(true);
		expect(capabilities.requestTypes.has("machine:command")).toBe(false);
	});

	it("degrades malformed input to empty Sets instead of crashing the bridge gate", () => {
		// {} is what a JSON-serialized Set looks like; [] is the legacy shape.
		for (const raw of [undefined, null, {}, [], { requestTypes: {} }]) {
			const capabilities = toRuntimeCapabilities(raw);
			expect(capabilities.requestTypes.has("machine:command")).toBe(false);
			expect(capabilities.topics.has("workspace")).toBe(false);
		}
	});
});
