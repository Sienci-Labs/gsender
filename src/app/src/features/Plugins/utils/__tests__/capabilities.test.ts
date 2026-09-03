import { requestTypesMap, topicsMap } from "../../types";
import {
	buildGrantFromScan,
	mergeManifestParserGrant,
	toRuntimeCapabilities,
} from "../capabilities";

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

describe("buildGrantFromScan — viewer topic", () => {
	it("grants the 'viewer' push topic for a 'viewer' import", () => {
		const { wire } = buildGrantFromScan(["viewer"]);
		expect(wire.topics).toEqual(["viewer"]);
	});

	it("grants the 'viewer' push topic for a 'useVisualizerPick' import", () => {
		const { wire } = buildGrantFromScan(["useVisualizerPick"]);
		expect(wire.topics).toEqual(["viewer"]);
	});

	it("grants machine:busy:set when importing the 'gsender' aggregate client", () => {
		const { wire } = buildGrantFromScan(["gsender"]);
		expect(wire.requestTypes).toContain("machine:busy:set");
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

describe("parser permissions", () => {
	it("grants parse permissions for the parser SDK functions", () => {
		const { permissions, wire } = buildGrantFromScan([
			"registerParser",
			"onParsed",
		]);

		expect(permissions).toContain("machine:parse");
		expect(wire.requestTypes).toContain("machine:parser:register");
		expect(wire.topics).toContain("parser");
	});

	it("treats query as a separate, stronger grant than parse", () => {
		const { permissions, wire } = buildGrantFromScan(["query"]);

		expect(permissions).toEqual(
			expect.arrayContaining(["machine:query", "machine:parse"]),
		);
		expect(wire.requestTypes).toContain("machine:query");
	});

	it("does not grant parser access from unrelated imports", () => {
		const { permissions, wire } = buildGrantFromScan(["workspace"]);

		expect(permissions).not.toContain("machine:parse");
		expect(wire.requestTypes).not.toContain("machine:query");
		expect(wire.topics).not.toContain("parser");
	});

	it("gives onLine the register/unregister types its anonymous parser needs", () => {
		const { wire } = buildGrantFromScan(["onLine"]);

		expect(wire.requestTypes).toEqual(
			expect.arrayContaining([
				"machine:parser:register",
				"machine:parser:unregister",
			]),
		);
		expect(wire.topics).toContain("parser");
	});
});

describe("mergeManifestParserGrant", () => {
	const empty = {
		permissions: [] as any,
		wire: { requestTypes: [], topics: [] } as any,
	};

	it("adds parse access for manifest-declared parsers the scan cannot see", () => {
		const merged = mergeManifestParserGrant(empty, [{ id: "probe" }]);

		expect(merged.permissions).toContain("machine:parse");
		expect(merged.wire.topics).toContain("parser");
	});

	it("leaves the grant untouched when there are no parsers", () => {
		expect(mergeManifestParserGrant(empty, [])).toBe(empty);
		expect(mergeManifestParserGrant(empty, undefined)).toBe(empty);
		expect(mergeManifestParserGrant(empty, "nope")).toBe(empty);
	});

	it("does not duplicate an already-granted permission", () => {
		const granted = {
			permissions: ["machine:parse"] as any,
			wire: { requestTypes: [], topics: ["parser"] } as any,
		};
		const merged = mergeManifestParserGrant(granted, [{ id: "probe" }]);

		expect(
			merged.permissions.filter((p: string) => p === "machine:parse"),
		).toHaveLength(1);
		expect(merged.wire.topics.filter((t: string) => t === "parser")).toHaveLength(
			1,
		);
	});
});

// The request-type and topic unions are duplicated between the host's types.ts
// and the SDK's bridge.ts, and drift between them is silent. This at least
// catches a map entry that names a type the host union never declared.
describe("wire type drift guard", () => {
	it("only maps request types the host union declares", () => {
		const declared = new Set<string>([
			"machine:get:context",
			"machine:command",
			"machine:parser:register",
			"machine:parser:unregister",
			"machine:query",
			"machine:busy:set",
			"workspace:get:state",
			"redux:get:state",
			"gcode:load:to:visualizer",
			"viewer:screen-to-world",
			"viewer:world-to-screen",
			"viewer:camera:set",
			"viewer:camera:lock-rotate",
			"viewer:pick:arm",
			"viewer:pick:disarm",
			"viewer:overlay:set",
			"storage:get",
			"storage:set",
			"storage:delete",
			"storage:get:all",
			"storage:set:all",
			"storage:clear",
		]);

		for (const types of requestTypesMap.values()) {
			for (const type of types) {
				expect(declared.has(type)).toBe(true);
			}
		}
	});

	it("only maps topics the host union declares", () => {
		const declared = new Set(["workspace", "redux", "parser", "viewer"]);
		for (const topic of topicsMap.values()) {
			expect(declared.has(topic)).toBe(true);
		}
	});
});
