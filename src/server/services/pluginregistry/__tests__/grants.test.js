import { buildGrantFromScan } from "../grants";

describe("buildGrantFromScan", () => {
	it("maps scanned SDK import names to capability arrays and display permissions", () => {
		const { permissions, capabilities } = buildGrantFromScan([
			"gcode",
			"useWorkspaceState",
		]);

		expect(capabilities).toEqual({
			requestTypes: ["gcode:load:to:visualizer"],
			topics: ["workspace"],
			allowedFunctions: ["gcode", "useWorkspaceState"],
		});
		expect(permissions).toEqual(
			expect.arrayContaining(["visualizer:load", "workspace:read"]),
		);
	});

	it("survives a JSON round-trip losslessly (no Sets reach the manifest)", () => {
		const { capabilities } = buildGrantFromScan(["gcode", "useWorkspaceState"]);

		expect(JSON.parse(JSON.stringify(capabilities))).toEqual(capabilities);
		expect(capabilities.requestTypes.length).toBeGreaterThan(0);
	});

	it("handles the whole-module sentinel and ignores unknown names", () => {
		const { permissions, capabilities } = buildGrantFromScan([
			"*require-whole-module*",
			"somethingUnknown",
		]);

		// The sentinel grants every request type but is not itself a function.
		expect(capabilities.requestTypes).toEqual(
			expect.arrayContaining(["machine:command", "gcode:load:to:visualizer"]),
		);
		expect(capabilities.allowedFunctions).not.toContain(
			"*require-whole-module*",
		);
		// Unknown names must not leak undefined into the permission list.
		expect(permissions).not.toContain(undefined);
	});

	it("grants the viewer push topic for a 'viewer' import", () => {
		expect(buildGrantFromScan(["viewer"]).capabilities.topics).toEqual([
			"viewer",
		]);
	});

	it("grants the viewer push topic for a 'useVisualizerPick' import", () => {
		expect(
			buildGrantFromScan(["useVisualizerPick"]).capabilities.topics,
		).toEqual(["viewer"]);
	});

	it("grants machine:busy:set when importing the 'gsender' aggregate client", () => {
		expect(buildGrantFromScan(["gsender"]).capabilities.requestTypes).toContain(
			"machine:busy:set",
		);
	});

	it("grants nothing for malformed input rather than throwing", () => {
		for (const raw of [undefined, null, {}, "gcode", [42, null]]) {
			const { permissions, capabilities } = buildGrantFromScan(raw);
			expect(permissions).toEqual([]);
			expect(capabilities.requestTypes).toEqual([]);
		}
	});
});
