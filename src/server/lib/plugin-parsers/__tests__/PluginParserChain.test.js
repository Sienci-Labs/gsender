import PluginParserChain from "../PluginParserChain.js";

const silentLog = { error: () => {}, warn: () => {}, info: () => {} };

const makeChain = (workflowState = "idle") => {
	const emitted = [];
	const chain = new PluginParserChain({
		emit: (name, payload) => emitted.push({ name, payload }),
		getWorkflowState: () => workflowState,
		log: silentLog,
	});
	const matches = () =>
		emitted.filter((e) => e.name === "plugin:parser:match").map((e) => e.payload);
	const errors = () =>
		emitted.filter((e) => e.name === "plugin:parser:error").map((e) => e.payload);
	return { chain, emitted, matches, errors };
};

const manifest = (specs) =>
	specs.map((spec) => ({ pluginId: "demo", ...spec }));

afterEach(() => {
	jest.useRealTimers();
});

describe("line parsers", () => {
	it("emits a match with named and numbered groups", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(
			manifest([
				{ id: "probe", match: String.raw`^\[PRB:(?<x>[-\d.]+),(?<y>[-\d.]+)` },
			]),
		);

		chain.feed("[PRB:1.000,2.000,3.000:1]");

		expect(matches()).toHaveLength(1);
		expect(matches()[0]).toMatchObject({
			pluginId: "demo",
			parserId: "probe",
			mode: "line",
			seq: 1,
			line: "[PRB:1.000,2.000,3.000:1]",
			lines: ["[PRB:1.000,2.000,3.000:1]"],
			groups: { x: "1.000", y: "2.000" },
			captures: ["1.000", "2.000"],
			complete: true,
			reason: "match",
		});
	});

	it("ignores lines that do not match", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(manifest([{ id: "p", match: "^ok$" }]));

		chain.feed("<Idle|MPos:0,0,0>");
		chain.feed("error:9");

		expect(matches()).toHaveLength(0);
	});

	it("increments seq per parser so identical payloads stay distinguishable", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(manifest([{ id: "p", match: "^ok$" }]));

		chain.feed("ok");
		chain.feed("ok");

		expect(matches().map((m) => m.seq)).toEqual([1, 2]);
	});
});

describe("block parsers", () => {
	const settingsBlock = (overrides = {}) =>
		manifest([
			{
				id: "settings",
				mode: "block",
				begin: String.raw`^\$\d+=`,
				match: String.raw`^\$(?<key>\d+)=(?<value>.*)$`,
				until: "ok",
				whenWorkflow: "idle",
				...overrides,
			},
		]);

	it("accumulates a multi-line block and terminates on until", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(settingsBlock());

		chain.feed("$0=10");
		chain.feed("$1=25");
		chain.feed("$2=0");
		expect(matches()).toHaveLength(0); // still open

		chain.feed("ok");

		expect(matches()).toHaveLength(1);
		const match = matches()[0];
		expect(match.complete).toBe(true);
		expect(match.reason).toBe("until");
		expect(match.lines).toEqual(["$0=10", "$1=25", "$2=0", "ok"]);
		expect(match.entries.map((e) => e.groups)).toEqual([
			{ key: "0", value: "10" },
			{ key: "1", value: "25" },
			{ key: "2", value: "0" },
		]);
	});

	it("drops an interleaved status report without terminating or counting it", () => {
		// grblHAL polls status every 250ms, so one lands inside essentially every
		// multi-line response. This is the case that would corrupt a naive block.
		const { chain, matches } = makeChain();
		chain.setManifestParsers(settingsBlock());

		chain.feed("$0=10");
		chain.feed("<Idle|MPos:0.000,0.000,0.000|FS:0,0>");
		chain.feed("$1=25");
		chain.feed("ok");

		expect(matches()[0].lines).toEqual(["$0=10", "$1=25", "ok"]);
	});

	it("terminates on an explicit end pattern", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(
			manifest([
				{
					id: "tools",
					mode: "block",
					begin: String.raw`^\[TOOLTABLE:START\]`,
					end: String.raw`^\[TOOLTABLE:END\]`,
				},
			]),
		);

		chain.feed("[TOOLTABLE:START]");
		chain.feed("[TOOL:1|end mill]");
		chain.feed("[TOOLTABLE:END]");

		expect(matches()[0]).toMatchObject({ complete: true, reason: "end" });
		expect(matches()[0].lines).toHaveLength(3);
	});

	it("closes a one-line block when begin also terminates it", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(
			manifest([
				{ id: "b", mode: "block", begin: "^ok$", end: "^ok$" },
			]),
		);

		chain.feed("ok");

		expect(matches()).toHaveLength(1);
		expect(matches()[0].lines).toEqual(["ok"]);
	});

	it("flushes a partial block when maxLines is reached", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(settingsBlock({ maxLines: 3 }));

		chain.feed("$0=1");
		chain.feed("$1=2");
		chain.feed("$2=3");

		expect(matches()[0]).toMatchObject({ complete: false, reason: "maxLines" });
	});

	it("restarts the block when begin matches again", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(
			manifest([
				{
					id: "b",
					mode: "block",
					begin: String.raw`^\[START\]`,
					end: String.raw`^\[END\]`,
					restartOnBegin: true,
				},
			]),
		);

		chain.feed("[START]");
		chain.feed("body one");
		chain.feed("[START]");
		chain.feed("body two");
		chain.feed("[END]");

		expect(matches()).toHaveLength(2);
		expect(matches()[0]).toMatchObject({ complete: false, reason: "restart" });
		expect(matches()[1]).toMatchObject({ complete: true, reason: "end" });
		expect(matches()[1].lines).toEqual(["[START]", "body two", "[END]"]);
	});

	it("aborts a strict block on an unexpected line", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(settingsBlock({ strict: true }));

		chain.feed("$0=10");
		chain.feed("[MSG:something unrelated]");

		expect(matches()[0]).toMatchObject({ complete: false, reason: "strict" });
	});

	it("drops a partial block entirely when emitPartial is false", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(settingsBlock({ maxLines: 2, emitPartial: false }));

		chain.feed("$0=1");
		chain.feed("$1=2");

		expect(matches()).toHaveLength(0);
	});

	it("flushes an expired block on sweep", () => {
		jest.useFakeTimers();
		const { chain, matches } = makeChain();
		chain.setManifestParsers(settingsBlock({ timeout: 1000 }));

		chain.feed("$0=10");
		expect(matches()).toHaveLength(0);

		jest.advanceTimersByTime(1500);

		expect(matches()[0]).toMatchObject({ complete: false, reason: "timeout" });
		expect(matches()[0].lines).toEqual(["$0=10"]);
	});
});

describe("workflow gating", () => {
	it("skips an idle-gated parser while a job is running", () => {
		const { chain, matches } = makeChain("running");
		chain.setManifestParsers(
			manifest([{ id: "p", match: "^ok$", whenWorkflow: "idle" }]),
		);

		chain.feed("ok");

		expect(matches()).toHaveLength(0);
	});

	it("runs an ungated parser regardless of workflow", () => {
		const { chain, matches } = makeChain("running");
		chain.setManifestParsers(manifest([{ id: "p", match: "^ok$" }]));

		chain.feed("ok");

		expect(matches()).toHaveLength(1);
	});
});

describe("registration lifetime", () => {
	it("replaces manifest parsers without touching runtime ones", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(manifest([{ id: "m", match: "^ok$" }]));
		chain.registerRuntime("demo#1", "demo", [{ id: "r", match: "^ok$" }]);

		chain.setManifestParsers(manifest([{ id: "m2", match: "^ok$" }]));
		chain.feed("ok");

		expect(matches().map((m) => m.parserId).sort()).toEqual(["m2", "r"]);
	});

	it("unregisters every runtime parser for one owner", () => {
		const { chain, matches } = makeChain();
		chain.registerRuntime("demo#1", "demo", [{ id: "a", match: "^ok$" }]);
		chain.registerRuntime("other#1", "other", [{ id: "b", match: "^ok$" }]);

		chain.unregisterRuntime("demo#1");
		chain.feed("ok");

		expect(matches().map((m) => m.parserId)).toEqual(["b"]);
	});

	it("refuses to unregister a manifest parser as a runtime one", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(manifest([{ id: "m", match: "^ok$" }]));

		chain.unregisterRuntime("manifest:demo", "m");
		chain.feed("ok");

		expect(matches()).toHaveLength(1);
	});

	it("reports invalid specs without registering them", () => {
		const { chain, errors } = makeChain();
		const result = chain.registerRuntime("demo#1", "demo", [
			{ id: "bad", match: "(a+)+$" },
		]);

		expect(result.registered).toEqual([]);
		expect(result.errors).toHaveLength(1);
		chain.setManifestParsers(manifest([{ id: "worse", match: "(a+)+$" }]));
		expect(errors()[0]).toMatchObject({ reason: "invalid-spec" });
	});

	it("flushes open blocks on reset so a subscriber never hangs", () => {
		const { chain, matches } = makeChain();
		chain.setManifestParsers(
			manifest([
				{ id: "b", mode: "block", begin: String.raw`^\$`, end: "^ok$" },
			]),
		);

		chain.feed("$0=10");
		chain.reset("close");

		expect(matches()[0]).toMatchObject({ complete: false, reason: "close" });
	});
});

describe("abuse resistance", () => {
	it("rate limits a parser that matches everything", () => {
		const { chain, matches, errors } = makeChain();
		chain.setManifestParsers(manifest([{ id: "greedy", match: "^" }]));

		for (let i = 0; i < 100; i += 1) {
			chain.feed(`line ${i}`);
		}

		expect(matches().length).toBeLessThanOrEqual(20);
		expect(errors().some((e) => e.reason === "rate-limited")).toBe(true);
	});

	it("reports rate limiting only once per window", () => {
		const { chain, errors } = makeChain();
		chain.setManifestParsers(manifest([{ id: "greedy", match: "^" }]));

		for (let i = 0; i < 100; i += 1) {
			chain.feed(`line ${i}`);
		}

		expect(errors().filter((e) => e.reason === "rate-limited")).toHaveLength(1);
	});

	it("quarantines a parser that matches too slowly and stops running it", () => {
		const { chain, matches, errors } = makeChain();
		chain.setManifestParsers(manifest([{ id: "slow", match: "^ok$" }]));

		const parser = chain.parsers[0];
		// Simulate the time budget being blown rather than trying to author a
		// genuinely catastrophic regex (the safety screen would reject one).
		chain.chargeTime(parser, 100);

		chain.feed("ok");

		expect(parser.quarantined).toBe(true);
		expect(matches()).toHaveLength(0);
		expect(errors()[0]).toMatchObject({ reason: "quarantined" });
	});

	it("never throws out of feed(), even if a parser blows up", () => {
		const { chain } = makeChain();
		chain.setManifestParsers(manifest([{ id: "p", match: "^ok$" }]));
		chain.parsers[0].match = {
			exec: () => {
				throw new Error("boom");
			},
			test: () => {
				throw new Error("boom");
			},
		};

		expect(() => chain.feed("ok")).not.toThrow();
	});
});

describe("beginCapture (machine.query)", () => {
	it("collects lines until the terminator", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok", onDone });

		chain.feed("[VER:1.1f.20240101:]");
		chain.feed("[OPT:VNS,35,1024]");
		chain.feed("ok");

		expect(onDone).toHaveBeenCalledTimes(1);
		expect(onDone.mock.calls[0][0]).toMatchObject({
			lines: ["[VER:1.1f.20240101:]", "[OPT:VNS,35,1024]", "ok"],
			ok: true,
			complete: true,
			reason: "until",
		});
	});

	it("excludes status reports by default", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok", onDone });

		chain.feed("<Idle|MPos:0,0,0>");
		chain.feed("ok");

		expect(onDone.mock.calls[0][0].lines).toEqual(["ok"]);
	});

	it("includes status reports when asked", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok", includeStatusReports: true, onDone });

		chain.feed("<Idle|MPos:0,0,0>");
		chain.feed("ok");

		expect(onDone.mock.calls[0][0].lines).toHaveLength(2);
	});

	it("reports an error response", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok-or-error", onDone });

		chain.feed("error:2");

		expect(onDone.mock.calls[0][0]).toMatchObject({
			ok: false,
			error: "error:2",
			complete: true,
		});
	});

	it("terminates on a regex until", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: /^\[DONE\]$/, onDone });

		chain.feed("working");
		chain.feed("[DONE]");

		expect(onDone.mock.calls[0][0].reason).toBe("until");
	});

	it("settles on timeout rather than hanging", () => {
		jest.useFakeTimers();
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok", timeout: 1000, onDone });

		chain.feed("partial");
		jest.advanceTimersByTime(1500);

		expect(onDone.mock.calls[0][0]).toMatchObject({
			complete: false,
			reason: "timeout",
		});
	});

	it("settles on reset so a disconnect never leaves a caller waiting", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok", onDone });

		chain.reset("close");

		expect(onDone.mock.calls[0][0]).toMatchObject({
			complete: false,
			reason: "close",
		});
	});

	it("settles exactly once", () => {
		const { chain } = makeChain();
		const onDone = jest.fn();
		chain.beginCapture({ until: "ok", onDone });

		chain.feed("ok");
		chain.feed("ok");
		chain.reset("close");

		expect(onDone).toHaveBeenCalledTimes(1);
	});
});
