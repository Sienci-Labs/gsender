import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import JSZip from "jszip";

const mockSettings = {
	pluginsDir: "",
	extraPluginsDirs: [],
	version: "1.7.0",
	winston: { level: "error" },
};

jest.mock("../../../config/settings", () => mockSettings);

// The plugins shipped in this repo, with real Vite output under ui/assets.
const REPO_PLUGINS = path.resolve(__dirname, "../../../../../plugins");

let installer;
let configstore;
let tmpRoot;
let pluginsDir;

beforeAll(() => {
	installer = require("../install").default;
	configstore = require("../../configstore").default;
});

beforeEach(() => {
	tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-realplugin-"));
	pluginsDir = path.join(tmpRoot, "plugins");
	mockSettings.pluginsDir = pluginsDir;
	mockSettings.extraPluginsDirs = [];
	fs.mkdirSync(pluginsDir, { recursive: true });
	configstore.load(path.join(tmpRoot, "config.json"));
});

afterEach(() => {
	installer.__resetSessions();
	fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// Guards the real-world path the old flow got wrong: it hardcoded
// ui/assets/index-*.js in the Electron main process and blew up on anything
// else. These run against actual built plugins, not hand-made fixtures.
describe("installing plugins shipped in this repo", () => {
	it("derives storage-test's permissions from its real bundle", async () => {
		const result = await installer.prepare(
			path.join(REPO_PLUGINS, "storage-test"),
		);

		expect(result.ok).toBe(true);
		expect(result.plan.plugin.id).toBe("com.sienci.storage-test");
		expect(result.plan.kind).toBe("new");
		expect(result.plan.scanned).toBe(true);
		expect(result.plan.permissions).toContain("storage");
		expect(result.plan.capabilities.requestTypes).toContain("storage:get");

		// This plugin bundles the SDK rather than leaving it external, so the
		// scan cannot see the import. The grant has to come from the manifest,
		// and the user is told it was not confirmed in the code.
		expect(result.plan.verifiedPermissions).toEqual([]);
		expect(result.plan.declaredOnlyPermissions).toContain("storage");
	});

	it("derives example-hello's permissions from its real bundle", async () => {
		const result = await installer.prepare(
			path.join(REPO_PLUGINS, "example-hello"),
		);

		expect(result.ok).toBe(true);
		expect(result.plan.scanned).toBe(true);
		expect(result.plan.permissions).toContain("workspace:read");
		// This one keeps the SDK external, so the scan corroborates the grant
		// rather than having to take the manifest's word for it.
		expect(result.plan.verifiedPermissions).toContain("workspace:read");
		expect(result.plan.declaredOnlyPermissions).not.toContain("workspace:read");
	});

	it("installs a real plugin and records what it granted", async () => {
		const prepared = await installer.prepare(
			path.join(REPO_PLUGINS, "storage-test"),
		);
		const committed = installer.commit(prepared.sessionId);

		expect(committed.ok).toBe(true);

		const installedManifest = JSON.parse(
			fs.readFileSync(
				path.join(pluginsDir, "com.sienci.storage-test", "gsender-plugin.json"),
				"utf8",
			),
		);
		// Regression guard: installing must not strip the capabilities the
		// plugin declared just because the scan could not corroborate them.
		expect(installedManifest.permissions).toContain("storage");
		expect(installedManifest.capabilities.requestTypes).toEqual(
			expect.arrayContaining([
				"storage:get",
				"storage:set",
				"storage:delete",
				"storage:clear",
			]),
		);
		// The folder is named from the manifest id.
		expect(fs.existsSync(path.join(pluginsDir, "storage-test"))).toBe(false);
	});

	it("installs the same plugin from a zip of its folder", async () => {
		const source = path.join(REPO_PLUGINS, "storage-test");
		const zip = new JSZip();

		// Skip node_modules — this mirrors how a plugin would actually be shared.
		const walk = (dir, relative) => {
			fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
				if (entry.name === "node_modules") {
					return;
				}
				const full = path.join(dir, entry.name);
				const rel = relative ? `${relative}/${entry.name}` : entry.name;
				if (entry.isDirectory()) {
					walk(full, rel);
				} else {
					zip.file(rel, fs.readFileSync(full));
				}
			});
		};
		walk(source, "");

		const zipPath = path.join(tmpRoot, "storage-test.zip");
		fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

		const prepared = await installer.prepare(zipPath);
		expect(prepared.ok).toBe(true);
		expect(prepared.plan.plugin.id).toBe("com.sienci.storage-test");
		expect(prepared.plan.permissions).toContain("storage");

		expect(installer.commit(prepared.sessionId).ok).toBe(true);
		expect(
			fs.existsSync(
				path.join(pluginsDir, "com.sienci.storage-test", "ui", "index.html"),
			),
		).toBe(true);
	});
});
