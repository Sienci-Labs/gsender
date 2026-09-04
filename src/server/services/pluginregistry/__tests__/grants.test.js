import { buildGrantFromScan, mergeManifestParserGrant } from "../grants";

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

describe("parser permissions", () => {
	it("grants parse permissions for the parser SDK functions", () => {
		const { permissions, capabilities } = buildGrantFromScan([
			"registerParser",
			"onParsed",
		]);

		expect(permissions).toContain("machine:parse");
		expect(capabilities.requestTypes).toContain("machine:parser:register");
		expect(capabilities.topics).toContain("parser");
	});

	it("treats query as a separate, stronger grant than parse", () => {
		const { permissions, capabilities } = buildGrantFromScan(["query"]);

		expect(permissions).toEqual(
			expect.arrayContaining(["machine:query", "machine:parse"]),
		);
		expect(capabilities.requestTypes).toContain("machine:query");
	});

	it("does not grant parser access from unrelated imports", () => {
		const { permissions, capabilities } = buildGrantFromScan(["workspace"]);

		expect(permissions).not.toContain("machine:parse");
		expect(capabilities.requestTypes).not.toContain("machine:query");
		expect(capabilities.topics).not.toContain("parser");
	});

	it("gives onLine the register/unregister types its anonymous parser needs", () => {
		const { capabilities } = buildGrantFromScan(["onLine"]);

		expect(capabilities.requestTypes).toEqual(
			expect.arrayContaining([
				"machine:parser:register",
				"machine:parser:unregister",
			]),
		);
		expect(capabilities.topics).toContain("parser");
	});
});

describe("mergeManifestParserGrant", () => {
	const empty = {
		permissions: [],
		capabilities: { requestTypes: [], topics: [] },
	};

	it("adds parse access for manifest-declared parsers the scan cannot see", () => {
		const merged = mergeManifestParserGrant(empty, [{ id: "probe" }]);

		expect(merged.permissions).toContain("machine:parse");
		expect(merged.capabilities.topics).toContain("parser");
	});

	it("leaves the grant untouched when there are no parsers", () => {
		expect(mergeManifestParserGrant(empty, [])).toBe(empty);
		expect(mergeManifestParserGrant(empty, undefined)).toBe(empty);
		expect(mergeManifestParserGrant(empty, "nope")).toBe(empty);
	});

	it("does not duplicate an already-granted permission", () => {
		const granted = {
			permissions: ["machine:parse"],
			capabilities: { requestTypes: [], topics: ["parser"] },
		};
		const merged = mergeManifestParserGrant(granted, [{ id: "probe" }]);

		expect(
			merged.permissions.filter((p) => p === "machine:parse"),
		).toHaveLength(1);
		expect(
			merged.capabilities.topics.filter((t) => t === "parser"),
		).toHaveLength(1);
	});
});
