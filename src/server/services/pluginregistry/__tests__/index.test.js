import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mockSettings = {
	pluginsDir: "",
	extraPluginsDirs: [],
	// src/server/lib/logger.js resolves to this same mocked module (both
	// import "config/settings") and reads settings.winston.level at require
	// time, so it needs to be present here too, not just the fields this
	// suite cares about.
	winston: { level: "error" },
};

jest.mock("../../../config/settings", () => mockSettings);

let pluginRegistry;
let configstore;

let tmpRoot;
let defaultPluginsDir;

beforeAll(() => {
	pluginRegistry = require("../index").default;
	configstore = require("../../configstore").default;
});

beforeEach(() => {
	tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-pluginregistry-"));
	defaultPluginsDir = path.join(tmpRoot, "default-plugins");
	mockSettings.pluginsDir = defaultPluginsDir;
	mockSettings.extraPluginsDirs = [];

	// Isolate configstore's persisted state per test instead of touching the
	// real user config file.
	configstore.load(path.join(tmpRoot, "config.json"));
});

afterEach(() => {
	fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe("getUserPluginsDir / setUserPluginsDir", () => {
	it("defaults to an empty string when nothing has been set", () => {
		expect(pluginRegistry.getUserPluginsDir()).toBe("");
	});

	it("persists a trimmed directory and creates it on disk", () => {
		const dir = path.join(tmpRoot, "  custom-plugins  ").trim();
		const withWhitespace = `  ${dir}  `;

		const saved = pluginRegistry.setUserPluginsDir(withWhitespace);

		expect(saved).toBe(dir);
		expect(pluginRegistry.getUserPluginsDir()).toBe(dir);
		expect(fs.existsSync(dir)).toBe(true);
	});

	it("survives being read back after a fresh configstore reload (persisted, not in-memory only)", () => {
		const dir = path.join(tmpRoot, "custom-plugins");
		pluginRegistry.setUserPluginsDir(dir);

		configstore.reload();

		expect(pluginRegistry.getUserPluginsDir()).toBe(dir);
	});

	it("clears the setting when set back to an empty string", () => {
		const dir = path.join(tmpRoot, "custom-plugins");
		pluginRegistry.setUserPluginsDir(dir);
		expect(pluginRegistry.getUserPluginsDir()).toBe(dir);

		pluginRegistry.setUserPluginsDir("");

		expect(pluginRegistry.getUserPluginsDir()).toBe("");
	});

	it("normalizes non-string input to an empty string instead of throwing", () => {
		const saved = pluginRegistry.setUserPluginsDir(undefined);

		expect(saved).toBe("");
		expect(pluginRegistry.getUserPluginsDir()).toBe("");
	});
});

describe("getPluginDirectories", () => {
	it("returns only the default pluginsDir when no user directory is set", () => {
		expect(pluginRegistry.getPluginDirectories()).toEqual([
			path.resolve(defaultPluginsDir),
		]);
	});

	it("is additive: setting a user directory keeps the default directory in the scan list", () => {
		const customDir = path.join(tmpRoot, "custom-plugins");
		pluginRegistry.setUserPluginsDir(customDir);

		const dirs = pluginRegistry.getPluginDirectories();

		expect(dirs).toContain(path.resolve(customDir));
		expect(dirs).toContain(path.resolve(defaultPluginsDir));
		expect(dirs).toHaveLength(2);
	});

	it("combines dev-only extraPluginsDirs, the user directory, and the default directory", () => {
		const extraDir = path.join(tmpRoot, "extra-plugins");
		const customDir = path.join(tmpRoot, "custom-plugins");
		mockSettings.extraPluginsDirs = [extraDir];
		pluginRegistry.setUserPluginsDir(customDir);

		const dirs = pluginRegistry.getPluginDirectories();

		expect(dirs).toEqual([
			path.resolve(extraDir),
			path.resolve(customDir),
			path.resolve(defaultPluginsDir),
		]);
	});

	it("dedupes when the user directory resolves to the same path as the default", () => {
		pluginRegistry.setUserPluginsDir(defaultPluginsDir);

		const dirs = pluginRegistry.getPluginDirectories();

		expect(dirs).toEqual([path.resolve(defaultPluginsDir)]);
	});
});
