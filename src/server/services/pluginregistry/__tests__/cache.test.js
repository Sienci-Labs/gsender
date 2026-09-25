import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mockSettings = {
	pluginsDir: "",
	extraPluginsDirs: [],
	version: "1.6.2",
	// src/server/lib/logger.js resolves to this same mocked module and reads
	// settings.winston.level at require time.
	winston: { level: "error" },
};

jest.mock("../../../config/settings", () => mockSettings);

let installer;
let pluginRegistry;
let configstore;

let tmpRoot;
let pluginsDir;
let sourceDir;

const MANIFEST = "gsender-plugin.json";

// A minimal plugin that passes validateManifest: manifest + the ui/entry it
// points at. Mirrors the helper in install.test.js.
const writePlugin = (dir, overrides = {}) => {
	const manifest = {
		id: "com.sienci.demo",
		name: "Demo",
		description: "A demo plugin",
		version: "1.0.0",
		engine: ">=1.6.0",
		ui: {
			entry: "ui/index.html",
			contributions: [{ slot: "tools-page", route: "demo", label: "Demo" }],
		},
		...overrides,
	};

	fs.mkdirSync(path.join(dir, "ui"), { recursive: true });
	fs.writeFileSync(
		path.join(dir, MANIFEST),
		JSON.stringify(manifest, null, "\t"),
	);
	fs.writeFileSync(path.join(dir, "ui", "index.html"), "<html></html>");

	return manifest;
};

const install = async (source) => {
	const prepared = await installer.prepare(source);
	expect(prepared.ok).toBe(true);
	return installer.commit(prepared.sessionId);
};

beforeAll(() => {
	installer = require("../install").default;
	pluginRegistry = require("../index").default;
	configstore = require("../../configstore").default;
});

beforeEach(() => {
	tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-plugincache-"));
	pluginsDir = path.join(tmpRoot, "plugins");
	sourceDir = path.join(tmpRoot, "source", "demo-plugin");

	mockSettings.pluginsDir = pluginsDir;
	mockSettings.extraPluginsDirs = [];
	mockSettings.version = "1.6.2";

	fs.mkdirSync(pluginsDir, { recursive: true });
	fs.mkdirSync(sourceDir, { recursive: true });

	writePlugin(path.join(pluginsDir, "demo"));

	configstore.load(path.join(tmpRoot, "config.json"));
});

afterEach(() => {
	installer.__resetSessions();
	fs.rmSync(tmpRoot, { recursive: true, force: true });
	jest.restoreAllMocks();
});

describe("discoverPlugins() caching", () => {
	it("only walks the filesystem once across back-to-back calls", () => {
		const readdirSpy = jest.spyOn(fs, "readdirSync");

		pluginRegistry.discoverPlugins();
		const callsAfterFirst = readdirSpy.mock.calls.length;
		expect(callsAfterFirst).toBeGreaterThan(0);

		pluginRegistry.discoverPlugins();
		pluginRegistry.discoverPlugins();

		expect(readdirSpy.mock.calls.length).toBe(callsAfterFirst);
	});

	it("returns the plugin the first call found", () => {
		const [plugin] = pluginRegistry.discoverPlugins();
		expect(plugin.id).toBe("com.sienci.demo");
	});

	const expectsFreshWalk = async (mutate) => {
		const readdirSpy = jest.spyOn(fs, "readdirSync");

		pluginRegistry.discoverPlugins();
		const callsBefore = readdirSpy.mock.calls.length;

		await mutate();

		pluginRegistry.discoverPlugins();
		expect(readdirSpy.mock.calls.length).toBeGreaterThan(callsBefore);
	};

	it("re-walks after setPluginEnabled", async () => {
		await expectsFreshWalk(() => {
			pluginRegistry.setPluginEnabled("com.sienci.demo", false);
		});
	});

	it("re-walks after forgetPluginSettings", async () => {
		pluginRegistry.setPluginEnabled("com.sienci.demo", false);
		await expectsFreshWalk(() => {
			pluginRegistry.forgetPluginSettings("com.sienci.demo");
		});
	});

	it("re-walks after setUserPluginsDir", async () => {
		const userDir = path.join(tmpRoot, "user-plugins");
		await expectsFreshWalk(() => {
			pluginRegistry.setUserPluginsDir(userDir);
		});
	});

	it("re-walks after changeManifestPermissions", async () => {
		await expectsFreshWalk(() => {
			pluginRegistry.changeManifestPermissions(
				path.join(pluginsDir, "demo"),
				{ permissions: ["workspace:read"], capabilities: {} },
			);
		});
	});

	it("re-walks after an install commits", async () => {
		writePlugin(sourceDir, {
			id: "com.sienci.other",
			ui: {
				entry: "ui/index.html",
				contributions: [
					{ slot: "tools-page", route: "other", label: "Other" },
				],
			},
		});

		await expectsFreshWalk(async () => {
			const result = await install(sourceDir);
			expect(result.ok).toBe(true);
		});

		const ids = pluginRegistry.discoverPlugins().map((p) => p.id);
		expect(ids).toContain("com.sienci.other");
	});

	it("re-walks after an uninstall", async () => {
		await expectsFreshWalk(() => {
			const result = installer.uninstall("com.sienci.demo");
			expect(result.ok).toBe(true);
		});

		const ids = pluginRegistry.discoverPlugins().map((p) => p.id);
		expect(ids).not.toContain("com.sienci.demo");
	});

	it("disabling a plugin removes it from getPluginParserSpecs() on the next read — the controllers must never see a stale, still-enabled parser", () => {
		writePlugin(path.join(pluginsDir, "with-parser"), {
			id: "com.sienci.parser-demo",
			ui: {
				entry: "ui/index.html",
				contributions: [],
			},
			parsers: [{ id: "greeting", match: "^hello$" }],
		});

		const specsBefore = pluginRegistry.getPluginParserSpecs();
		expect(specsBefore.some((s) => s.pluginId === "com.sienci.parser-demo")).toBe(
			true,
		);

		pluginRegistry.setPluginEnabled("com.sienci.parser-demo", false);

		const specsAfter = pluginRegistry.getPluginParserSpecs();
		expect(specsAfter.some((s) => s.pluginId === "com.sienci.parser-demo")).toBe(
			false,
		);
	});

	it("does not expire from time alone — only explicit invalidation forces a re-walk", () => {
		jest.useFakeTimers();
		try {
			const readdirSpy = jest.spyOn(fs, "readdirSync");

			pluginRegistry.discoverPlugins();
			const callsBefore = readdirSpy.mock.calls.length;

			// Dropping a plugin folder in by hand while gSender keeps running
			// isn't a supported flow (plugins/README.md says to restart), so
			// there's no TTL forcing a re-read here — only the explicit
			// invalidation triggers covered by the other tests in this file do.
			jest.advanceTimersByTime(10 * 60 * 1000);

			pluginRegistry.discoverPlugins();
			expect(readdirSpy.mock.calls.length).toBe(callsBefore);
		} finally {
			jest.useRealTimers();
		}
	});
});
