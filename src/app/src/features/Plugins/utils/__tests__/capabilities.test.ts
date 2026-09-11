import { toRuntimeCapabilities } from "../capabilities";

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
