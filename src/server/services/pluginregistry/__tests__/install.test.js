import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import JSZip from "jszip";

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
// points at, plus a Vite-shaped bundle for the permission scanner to read.
const writePlugin = (dir, overrides = {}, { bundle } = {}) => {
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

	fs.mkdirSync(path.join(dir, "ui", "assets"), { recursive: true });
	fs.writeFileSync(
		path.join(dir, MANIFEST),
		JSON.stringify(manifest, null, "\t"),
	);
	fs.writeFileSync(
		path.join(dir, "ui", "index.html"),
		'<html><body><script type="module" src="./assets/index-abc.js"></script></body></html>',
	);
	fs.writeFileSync(
		path.join(dir, "ui", "assets", "index-abc.js"),
		bundle ??
			'import { machine } from "@sienci/gsender-plugin-sdk";\nmachine();\n',
	);

	return manifest;
};

const zipDirectory = async (dir, zipPath, { prefix = "" } = {}) => {
	const zip = new JSZip();

	const walk = (current, relative) => {
		fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
			const full = path.join(current, entry.name);
			const rel = relative ? `${relative}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				walk(full, rel);
			} else {
				zip.file(`${prefix}${rel}`, fs.readFileSync(full));
			}
		});
	};

	walk(dir, "");
	fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));
	return zipPath;
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
	tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-plugininstall-"));
	pluginsDir = path.join(tmpRoot, "plugins");
	sourceDir = path.join(tmpRoot, "source", "demo-plugin");

	mockSettings.pluginsDir = pluginsDir;
	mockSettings.extraPluginsDirs = [];
	mockSettings.version = "1.6.2";

	fs.mkdirSync(pluginsDir, { recursive: true });
	fs.mkdirSync(sourceDir, { recursive: true });

	configstore.load(path.join(tmpRoot, "config.json"));
});

afterEach(() => {
	installer.__resetSessions();
	fs.rmSync(tmpRoot, { recursive: true, force: true });
	jest.restoreAllMocks();
});

describe("prepare - source validation", () => {
	it("rejects a path that does not exist", async () => {
		const result = await installer.prepare(path.join(tmpRoot, "nope"));

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/Could not find/);
	});

	it("rejects a file that is not a zip", async () => {
		const file = path.join(tmpRoot, "notes.txt");
		fs.writeFileSync(file, "hello");

		const result = await installer.prepare(file);

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/folder or a \.zip/);
	});

	it("rejects a folder with no manifest", async () => {
		const empty = path.join(tmpRoot, "empty");
		fs.mkdirSync(empty);

		const result = await installer.prepare(empty);

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/No gsender-plugin\.json found/);
	});

	it("reports manifest errors instead of installing", async () => {
		writePlugin(sourceDir, { id: undefined, version: undefined });

		const result = await installer.prepare(sourceDir);

		expect(result.ok).toBe(false);
		expect(result.manifestErrors).toEqual(
			expect.arrayContaining([
				expect.stringContaining('"id"'),
				expect.stringContaining('"version"'),
			]),
		);
	});

	it("leaves no staging behind when preparation fails", async () => {
		writePlugin(sourceDir, { id: undefined });

		await installer.prepare(sourceDir);

		const staging = path.join(pluginsDir, ".gsender-staging");
		const leftovers = fs.existsSync(staging) ? fs.readdirSync(staging) : [];
		expect(leftovers).toEqual([]);
	});
});

describe("prepare - archives", () => {
	it("installs from a zip whose manifest sits at the root", async () => {
		writePlugin(sourceDir);
		const zip = await zipDirectory(sourceDir, path.join(tmpRoot, "demo.zip"));

		const result = await install(zip);

		expect(result.ok).toBe(true);
		expect(
			fs.existsSync(path.join(pluginsDir, "com.sienci.demo", MANIFEST)),
		).toBe(true);
	});

	it("installs from a zip that wraps the plugin in a single folder", async () => {
		writePlugin(sourceDir);
		const zip = await zipDirectory(sourceDir, path.join(tmpRoot, "demo.zip"), {
			prefix: "demo-plugin/",
		});

		const result = await install(zip);

		expect(result.ok).toBe(true);
		expect(
			fs.existsSync(path.join(pluginsDir, "com.sienci.demo", MANIFEST)),
		).toBe(true);
	});

	it("refuses an entry that escapes the install directory (zip slip)", async () => {
		const zip = new JSZip();
		zip.file(MANIFEST, "{}");
		zip.file("../../evil.js", "pwned");
		const zipPath = path.join(tmpRoot, "evil.zip");
		fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

		const result = await installer.prepare(zipPath);

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/escapes the install directory/);
		expect(fs.existsSync(path.join(tmpRoot, "evil.js"))).toBe(false);
	});

	it("refuses an absolute entry path", async () => {
		const zip = new JSZip();
		zip.file("/etc/passwd", "pwned");
		const zipPath = path.join(tmpRoot, "absolute.zip");
		fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

		const result = await installer.prepare(zipPath);

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/escapes the install directory/);
	});

	it("reports a corrupt archive in plain language", async () => {
		const zipPath = path.join(tmpRoot, "broken.zip");
		fs.writeFileSync(zipPath, Buffer.from("this is not a zip file"));

		const result = await installer.prepare(zipPath);

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/corrupt or not a zip/);
	});

	it("refuses an archive holding more than one plugin", async () => {
		const zip = new JSZip();
		zip.file(`one/${MANIFEST}`, "{}");
		zip.file(`two/${MANIFEST}`, "{}");
		const zipPath = path.join(tmpRoot, "two.zip");
		fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

		const result = await installer.prepare(zipPath);

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/one at a time/);
	});
});

describe("prepare - version comparison", () => {
	const prepareAgainstInstalled = async (installedVersion, incomingVersion) => {
		writePlugin(sourceDir, { version: installedVersion });
		await install(sourceDir);

		writePlugin(sourceDir, { version: incomingVersion });
		return installer.prepare(sourceDir);
	};

	it("reports a first-time install as new", async () => {
		writePlugin(sourceDir);

		const result = await installer.prepare(sourceDir);

		expect(result.plan.kind).toBe("new");
		expect(result.plan.installedVersion).toBeNull();
	});

	it("reports a higher version as an update", async () => {
		const result = await prepareAgainstInstalled("1.0.0", "1.2.0");

		expect(result.plan.kind).toBe("update");
		expect(result.plan.installedVersion).toBe("1.0.0");
		expect(result.plan.incomingVersion).toBe("1.2.0");
	});

	it("reports a lower version as a downgrade", async () => {
		const result = await prepareAgainstInstalled("1.2.0", "1.0.0");

		expect(result.plan.kind).toBe("downgrade");
	});

	it("reports the same version as a reinstall", async () => {
		const result = await prepareAgainstInstalled("1.2.0", "1.2.0");

		expect(result.plan.kind).toBe("reinstall");
	});

	it("reports unknown when either version is not semver", async () => {
		const result = await prepareAgainstInstalled("1.0.0", "spring-release");

		expect(result.plan.kind).toBe("unknown");
		expect(result.plan.incomingVersion).toBe("spring-release");
	});

	it("matches on manifest id, not folder name", async () => {
		writePlugin(sourceDir, { version: "1.0.0" });
		await install(sourceDir);

		// Same plugin, delivered from a differently named folder.
		const renamed = path.join(tmpRoot, "source", "totally-different-name");
		fs.mkdirSync(renamed, { recursive: true });
		writePlugin(renamed, { version: "2.0.0" });

		const result = await installer.prepare(renamed);

		expect(result.plan.kind).toBe("update");
		expect(result.plan.targetDir).toBe(
			path.join(pluginsDir, "com.sienci.demo"),
		);
	});
});

describe("prepare - engine compatibility", () => {
	it("passes when the app satisfies the declared range", async () => {
		writePlugin(sourceDir, { engine: ">=1.6.0" });

		const { plan } = await installer.prepare(sourceDir);

		expect(plan.engine).toMatchObject({ checked: true, satisfied: true });
	});

	it("warns but does not block when the app is too old", async () => {
		writePlugin(sourceDir, { engine: ">=99.0.0" });

		const result = await installer.prepare(sourceDir);

		expect(result.ok).toBe(true);
		expect(result.plan.engine).toMatchObject({
			checked: true,
			satisfied: false,
		});
	});

	it("copes with an EDGE-suffixed app version", async () => {
		mockSettings.version = "1.6.2-EDGE.4";
		writePlugin(sourceDir, { engine: ">=1.6.0" });

		const { plan } = await installer.prepare(sourceDir);

		expect(plan.engine).toMatchObject({
			checked: true,
			satisfied: true,
			appVersion: "1.6.2",
		});
	});

	it("skips the check when the range is unreadable", async () => {
		writePlugin(sourceDir, { engine: "whenever you like" });

		const { plan } = await installer.prepare(sourceDir);

		expect(plan.engine).toMatchObject({ checked: false, unreadable: true });
	});
});

describe("prepare - permissions", () => {
	it("derives permissions from the bundle's SDK imports", async () => {
		writePlugin(
			sourceDir,
			{},
			{
				bundle:
					'import { storage, useWorkspaceState } from "@sienci/gsender-plugin-sdk";\n',
			},
		);

		const { plan } = await installer.prepare(sourceDir);

		expect(plan.scanned).toBe(true);
		expect(plan.permissions).toEqual(
			expect.arrayContaining(["storage", "workspace:read"]),
		);
		expect(plan.capabilities.topics).toContain("workspace");
		expect(plan.unverifiable).toBe(false);
	});

	it("flags a plugin whose SDK use cannot be verified", async () => {
		writePlugin(
			sourceDir,
			{},
			{
				bundle: 'const sdk = await import("@sienci/gsender-plugin-sdk");\n',
			},
		);

		const { plan } = await installer.prepare(sourceDir);

		expect(plan.unverifiable).toBe(true);
	});

	it("grants nothing when no bundle can be found", async () => {
		writePlugin(sourceDir);
		fs.rmSync(path.join(sourceDir, "ui", "assets"), {
			recursive: true,
			force: true,
		});

		const { plan } = await installer.prepare(sourceDir);

		expect(plan.scanned).toBe(false);
		expect(plan.unverifiable).toBe(true);
		expect(plan.permissions).toEqual([]);
	});
});

describe("commit", () => {
	it("writes the granted permissions into the installed manifest", async () => {
		writePlugin(
			sourceDir,
			{},
			{
				bundle: 'import { storage } from "@sienci/gsender-plugin-sdk";\n',
			},
		);

		await install(sourceDir);

		const installed = JSON.parse(
			fs.readFileSync(
				path.join(pluginsDir, "com.sienci.demo", MANIFEST),
				"utf8",
			),
		);
		expect(installed.permissions).toEqual(["storage"]);
		expect(installed.capabilities.requestTypes).toContain("storage:get");
	});

	it("never modifies the folder the user picked", async () => {
		writePlugin(
			sourceDir,
			{},
			{
				bundle: 'import { storage } from "@sienci/gsender-plugin-sdk";\n',
			},
		);
		const before = fs.readFileSync(path.join(sourceDir, MANIFEST), "utf8");

		await install(sourceDir);

		expect(fs.readFileSync(path.join(sourceDir, MANIFEST), "utf8")).toBe(
			before,
		);
	});

	it("replaces the previous version and removes its files", async () => {
		writePlugin(sourceDir, { version: "1.0.0" });
		fs.writeFileSync(path.join(sourceDir, "ui", "stale.txt"), "old");
		await install(sourceDir);

		const target = path.join(pluginsDir, "com.sienci.demo");
		expect(fs.existsSync(path.join(target, "ui", "stale.txt"))).toBe(true);

		fs.rmSync(path.join(sourceDir, "ui", "stale.txt"));
		writePlugin(sourceDir, { version: "2.0.0" });
		const result = await install(sourceDir);

		expect(result.replaced).toBe(true);
		expect(result.restartRequired).toBe(true);
		expect(fs.existsSync(path.join(target, "ui", "stale.txt"))).toBe(false);
		expect(
			JSON.parse(fs.readFileSync(path.join(target, MANIFEST), "utf8")).version,
		).toBe("2.0.0");
	});

	it("leaves no staging behind after a successful install", async () => {
		writePlugin(sourceDir);

		await install(sourceDir);

		const staging = path.join(pluginsDir, ".gsender-staging");
		const leftovers = fs.existsSync(staging) ? fs.readdirSync(staging) : [];
		expect(leftovers).toEqual([]);
	});

	it("restores the previous version when the swap fails", async () => {
		writePlugin(sourceDir, { version: "1.0.0" });
		await install(sourceDir);

		const target = path.join(pluginsDir, "com.sienci.demo");
		writePlugin(sourceDir, { version: "2.0.0" });
		const prepared = await installer.prepare(sourceDir);

		// Fail the move of the staged copy into place, after the previous
		// version has already been set aside. Keyed on the source so the
		// rollback's own rename back into place still works.
		const realRename = fs.renameSync;
		jest.spyOn(fs, "renameSync").mockImplementation((from, to) => {
			if (String(from).includes(".gsender-staging")) {
				throw Object.assign(new Error("EPERM: operation not permitted"), {
					code: "EPERM",
				});
			}
			return realRename(from, to);
		});

		const result = installer.commit(prepared.sessionId);

		expect(result.ok).toBe(false);
		expect(result.restored).toBe(true);
		expect(result.error).toMatch(/Install failed/);

		jest.restoreAllMocks();

		// The user is left with a working 1.0.0, not a half-written 2.0.0.
		expect(fs.existsSync(path.join(target, MANIFEST))).toBe(true);
		expect(
			JSON.parse(fs.readFileSync(path.join(target, MANIFEST), "utf8")).version,
		).toBe("1.0.0");
	});

	it("cleans up staging when the swap fails", async () => {
		writePlugin(sourceDir);
		const prepared = await installer.prepare(sourceDir);

		jest.spyOn(fs, "renameSync").mockImplementation(() => {
			throw Object.assign(new Error("EPERM"), { code: "EPERM" });
		});
		installer.commit(prepared.sessionId);
		jest.restoreAllMocks();

		const staging = path.join(pluginsDir, ".gsender-staging");
		const leftovers = fs.existsSync(staging) ? fs.readdirSync(staging) : [];
		expect(leftovers).toEqual([]);
	});

	it("rejects an unknown or expired session", () => {
		const result = installer.commit("not-a-session");

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/expired/);
	});

	it("can only be committed once", async () => {
		writePlugin(sourceDir);
		const prepared = await installer.prepare(sourceDir);

		expect(installer.commit(prepared.sessionId).ok).toBe(true);
		expect(installer.commit(prepared.sessionId).ok).toBe(false);
	});
});

describe("cancel", () => {
	it("removes the staged copy", async () => {
		writePlugin(sourceDir);
		const prepared = await installer.prepare(sourceDir);

		const staging = path.join(pluginsDir, ".gsender-staging");
		expect(fs.readdirSync(staging)).toHaveLength(1);

		installer.cancel(prepared.sessionId);

		expect(fs.readdirSync(staging)).toEqual([]);
	});

	it("is a no-op for an unknown session", () => {
		expect(installer.cancel("nope").ok).toBe(true);
	});
});

describe("uninstall", () => {
	it("removes the plugin and forgets its enabled state", async () => {
		writePlugin(sourceDir);
		await install(sourceDir);
		pluginRegistry.setPluginEnabled("com.sienci.demo", false);

		const result = installer.uninstall("com.sienci.demo");

		expect(result.ok).toBe(true);
		expect(result.restartRequired).toBe(true);
		expect(fs.existsSync(path.join(pluginsDir, "com.sienci.demo"))).toBe(false);
		expect(configstore.get("pluginSettings")).not.toHaveProperty(
			"com.sienci.demo",
		);
	});

	it("reports a plugin that is not installed", () => {
		const result = installer.uninstall("com.sienci.missing");

		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/not found/);
	});

	it("leaves no backup directory behind", async () => {
		writePlugin(sourceDir);
		await install(sourceDir);

		installer.uninstall("com.sienci.demo");

		const backups = path.join(pluginsDir, ".gsender-backup");
		const leftovers = fs.existsSync(backups) ? fs.readdirSync(backups) : [];
		expect(leftovers).toEqual([]);
	});
});

describe("interaction with plugin discovery", () => {
	it("does not treat staging or backup directories as plugins", async () => {
		writePlugin(sourceDir);
		await installer.prepare(sourceDir);
		fs.mkdirSync(path.join(pluginsDir, ".gsender-backup", "leftover"), {
			recursive: true,
		});

		expect(pluginRegistry.discoverPlugins()).toEqual([]);
	});

	it("warns when a copy in another root will shadow the install", async () => {
		const bundledDir = path.join(tmpRoot, "bundled", "demo");
		fs.mkdirSync(bundledDir, { recursive: true });
		writePlugin(bundledDir, { version: "1.0.0" });
		mockSettings.extraPluginsDirs = [path.join(tmpRoot, "bundled")];

		writePlugin(sourceDir, { version: "2.0.0" });
		const { plan } = await installer.prepare(sourceDir);

		expect(plan.shadowedBy).toBe(path.join(tmpRoot, "bundled"));
		// Still installs into the user directory rather than overwriting the
		// bundled copy.
		expect(plan.targetDir).toBe(path.join(pluginsDir, "com.sienci.demo"));
	});
});
