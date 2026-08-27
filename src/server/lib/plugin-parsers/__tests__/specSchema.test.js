import {
	MAX_PARSERS_PER_PLUGIN,
	compileParserSpec,
	validateParserSpecs,
} from "../specSchema.js";

const ctx = { pluginId: "demo", ownerId: "manifest:demo", origin: "manifest" };

const compile = (spec) => compileParserSpec(spec, ctx);

describe("compileParserSpec", () => {
	it("compiles a minimal line parser with defaults", () => {
		const { parser, errors } = compile({ id: "probe", match: "^\\[PRB:" });

		expect(errors).toEqual([]);
		expect(parser).toMatchObject({
			pluginId: "demo",
			parserId: "probe",
			origin: "manifest",
			mode: "line",
			whenWorkflow: "any",
			maxLines: 64,
			timeoutMs: 2000,
			strict: false,
			restartOnBegin: false,
			emitPartial: true,
			ignoreStatusReports: true,
		});
		expect(parser.match.test("[PRB:1,2,3:1]")).toBe(true);
	});

	it("accepts a { source, flags } matcher", () => {
		const { parser } = compile({
			id: "msg",
			match: { source: "^\\[msg:", flags: "i" },
		});
		expect(parser.match.test("[MSG:hello]")).toBe(true);
	});

	it("strips the stateful g/y flags and warns", () => {
		const { parser, warnings } = compile({
			id: "msg",
			match: { source: "^ok$", flags: "gi" },
		});

		expect(parser.match.flags).toBe("i");
		expect(warnings.join(" ")).toMatch(/g\/y flags were ignored/);
	});

	it.each([
		[undefined, "missing"],
		["", "empty"],
		["has spaces", "spaces"],
		["a".repeat(65), "too long"],
	])("rejects the id %p (%s)", (id) => {
		const { parser, errors } = compile({ id, match: "^ok$" });
		expect(parser).toBeNull();
		expect(errors.join(" ")).toMatch(/"id"/);
	});

	it("rejects a line parser with no match", () => {
		const { parser, errors } = compile({ id: "x" });
		expect(parser).toBeNull();
		expect(errors.join(" ")).toMatch(/needs a "match"/);
	});

	it("rejects a block parser with no begin", () => {
		const { parser, errors } = compile({ id: "x", mode: "block", end: "^ok$" });
		expect(parser).toBeNull();
		expect(errors.join(" ")).toMatch(/needs a "begin"/);
	});

	it("rejects a block parser with neither end nor until", () => {
		const { parser, errors } = compile({
			id: "x",
			mode: "block",
			begin: "^\\$",
		});
		expect(parser).toBeNull();
		expect(errors.join(" ")).toMatch(/"end" pattern or "until"/);
	});

	it("rejects a catastrophic matcher", () => {
		const { parser, errors } = compile({ id: "x", match: "(a+)+$" });
		expect(parser).toBeNull();
		expect(errors.join(" ")).toMatch(/rejected/);
	});

	it("clamps maxLines and timeout to their caps", () => {
		const { parser } = compile({
			id: "x",
			mode: "block",
			begin: "^\\$",
			end: "^ok$",
			maxLines: 99_999,
			timeout: 10 ** 9,
		});
		expect(parser.maxLines).toBe(500);
		expect(parser.timeoutMs).toBe(30_000);
	});

	it("warns that until is unsound unless gated to idle", () => {
		const { parser, warnings } = compile({
			id: "x",
			mode: "block",
			begin: "^\\$",
			until: "ok",
		});
		expect(parser).not.toBeNull();
		expect(warnings.join(" ")).toMatch(/can terminate early while a job is running/);
	});

	it("does not warn when until is gated to idle", () => {
		const { warnings } = compile({
			id: "x",
			mode: "block",
			begin: "^\\$",
			until: "ok",
			whenWorkflow: "idle",
		});
		expect(warnings).toEqual([]);
	});

	it("rejects a non-object spec", () => {
		expect(compile("nope").parser).toBeNull();
		expect(compile(null).parser).toBeNull();
	});
});

describe("validateParserSpecs", () => {
	it("returns nothing for an absent parsers key", () => {
		expect(validateParserSpecs(undefined, ctx).parsers).toEqual([]);
		expect(validateParserSpecs(null, ctx).errors).toEqual([]);
	});

	it("errors when parsers is not an array", () => {
		const { errors } = validateParserSpecs({ id: "x" }, ctx);
		expect(errors[0].error).toMatch(/must be an array/);
	});

	it("rejects duplicate ids but keeps the first", () => {
		const { parsers, errors } = validateParserSpecs(
			[
				{ id: "dup", match: "^a$" },
				{ id: "dup", match: "^b$" },
			],
			ctx,
		);
		expect(parsers).toHaveLength(1);
		expect(errors[0].error).toMatch(/duplicate/);
	});

	it("keeps the good parsers when one is bad", () => {
		const { parsers, errors } = validateParserSpecs(
			[
				{ id: "good", match: "^a$" },
				{ id: "bad", match: "(a+)+$" },
			],
			ctx,
		);
		expect(parsers.map((p) => p.parserId)).toEqual(["good"]);
		expect(errors).toHaveLength(1);
	});

	it("enforces the per-plugin parser cap", () => {
		const specs = Array.from({ length: MAX_PARSERS_PER_PLUGIN + 3 }, (_, i) => ({
			id: `p${i}`,
			match: "^ok$",
		}));
		const { parsers, errors } = validateParserSpecs(specs, ctx);
		expect(parsers).toHaveLength(MAX_PARSERS_PER_PLUGIN);
		expect(errors).toHaveLength(3);
		expect(errors[0].error).toMatch(/limit of/);
	});
});
