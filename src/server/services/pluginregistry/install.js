/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

// Guided plugin install: stage -> validate -> review -> atomic swap.
//
// Nothing under the live plugins directory is touched until commit(), and the
// swap keeps a backup of the previous version so a failure part-way through
// leaves the user with a working plugin rather than a half-written one. The
// source folder or zip the user picked is never modified.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import JSZip from "jszip";
import semver from "semver";

import settings from "../../config/settings";
import logger from "../../lib/logger";
import { normalizeCapabilities } from "./capabilities";
import { buildGrantFromScan, SDK_SCAN_SPECIFIERS } from "./grants";
import registry from "./index";
import { scanPluginForSdkUsage } from "./pluginSecurity";

const log = logger("service:pluginregistry:install");

const STAGING_DIRNAME = ".gsender-staging";
const BACKUP_DIRNAME = ".gsender-backup";

// Abandoned sessions (wizard closed, app crashed mid-install) are swept on the
// next prepare() so staging never accumulates.
const SESSION_TTL_MS = 30 * 60 * 1000;

// Zip bomb guards.
const MAX_ZIP_ENTRIES = 20000;
const MAX_ZIP_BYTES = 512 * 1024 * 1024;

// Scanner sentinels meaning we could not statically determine what the plugin
// uses. Either one makes the derived permission list untrustworthy.
const UNVERIFIABLE_SENTINELS = ["*require-whole-module*", "*namespace-import*"];

const sessions = new Map();

const asStringArray = (value) =>
	Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

const union = (...lists) => [...new Set(lists.flat())];

// What the plugin says about itself, as opposed to what the bundle scan can
// prove. Plugins that bundle the SDK rather than leaving it external produce
// nothing for the scanner to read, so the manifest is all we have to go on.
const readDeclaredGrant = (manifest) => ({
	permissions: asStringArray(manifest.permissions),
	capabilities: normalizeCapabilities(manifest.capabilities),
});

const createLog = () => {
	const entries = [];
	const push = (level, message) => {
		entries.push({ level, message, at: new Date().toISOString() });
		if (level === "error") {
			log.error(message);
		} else {
			log.debug(message);
		}
	};
	return {
		entries,
		info: (message) => push("info", message),
		warn: (message) => push("warn", message),
		error: (message) => push("error", message),
	};
};

const fail = (installLog, message, extra = {}) => {
	installLog.error(message);
	return { ok: false, error: message, log: installLog.entries, ...extra };
};

// Where new plugins land. The user-configured directory wins when set; the
// caller never gets to choose. The old importPlugin took this from the request
// body, which let the renderer write anywhere on disk.
const getDestinationRoot = () =>
	registry.getUserPluginsDir() || registry.getPluginsDirectory();

const getStagingRoot = (destRoot) => path.join(destRoot, STAGING_DIRNAME);
const getBackupRoot = (destRoot) => path.join(destRoot, BACKUP_DIRNAME);

// Plugin folder names come from the manifest id, not the source folder name, so
// updating from a differently-named zip still lands on the same directory.
const sanitizeDirName = (id) =>
	String(id)
		.replace(/[^A-Za-z0-9._-]/g, "-")
		.replace(/^[.-]+/, "")
		.slice(0, 128) || "plugin";

const rmrf = (target) => {
	try {
		fs.rmSync(target, { recursive: true, force: true });
	} catch (err) {
		log.error(`Failed to remove ${target}: ${err.message}`);
	}
};

const sweepStaleSessions = () => {
	const now = Date.now();

	sessions.forEach((session, id) => {
		if (now - session.createdAt > SESSION_TTL_MS) {
			rmrf(session.stagingDir);
			sessions.delete(id);
		}
	});

	// Also clear staging left behind by a crash, which has no session entry.
	const stagingRoot = getStagingRoot(getDestinationRoot());
	let entries = [];
	try {
		entries = fs.readdirSync(stagingRoot, { withFileTypes: true });
	} catch {
		return;
	}

	entries.forEach((entry) => {
		if (!entry.isDirectory() || sessions.has(entry.name)) {
			return;
		}
		const dir = path.join(stagingRoot, entry.name);
		try {
			if (now - fs.statSync(dir).mtimeMs > SESSION_TTL_MS) {
				rmrf(dir);
			}
		} catch {
			// Racing with another sweep; nothing to do.
		}
	});
};

// ---------------------------------------------------------------------------
// Archive extraction
// ---------------------------------------------------------------------------

// True when `name` would escape `root` once resolved - the zip-slip check.
const escapesRoot = (root, name) => {
	if (path.isAbsolute(name) || /^[A-Za-z]:/.test(name)) {
		return true;
	}
	const resolved = path.resolve(root, name);
	const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
	return resolved !== root && !resolved.startsWith(rootWithSep);
};

const S_IFMT = 0xf000;
const S_IFLNK = 0xa000;
const isSymlinkEntry = (entry) =>
	Boolean(entry.unixPermissions) &&
	(entry.unixPermissions & S_IFMT) === S_IFLNK;

const extractZip = async (zipPath, targetDir, installLog) => {
	let zip;
	try {
		zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
	} catch (err) {
		throw new Error(
			`Could not read the zip file - it may be corrupt or not a zip (${err.message})`,
		);
	}

	const entries = Object.values(zip.files);
	if (entries.length === 0) {
		throw new Error("The zip file is empty");
	}
	if (entries.length > MAX_ZIP_ENTRIES) {
		throw new Error(
			`The zip file contains too many entries (${entries.length}, limit ${MAX_ZIP_ENTRIES})`,
		);
	}

	let written = 0;
	let skipped = 0;

	for (const entry of entries) {
		// Normalise separators before any path check; zips may use either.
		const name = entry.name.replace(/\\/g, "/");

		if (escapesRoot(targetDir, name)) {
			throw new Error(
				`The zip file contains an entry that escapes the install directory: "${entry.name}"`,
			);
		}
		if (isSymlinkEntry(entry)) {
			skipped += 1;
			continue;
		}

		const destination = path.resolve(targetDir, name);

		if (entry.dir) {
			fs.mkdirSync(destination, { recursive: true });
			continue;
		}

		const content = await entry.async("nodebuffer");
		written += content.length;
		if (written > MAX_ZIP_BYTES) {
			throw new Error(
				`The zip file expands to more than ${Math.round(
					MAX_ZIP_BYTES / (1024 * 1024),
				)}MB`,
			);
		}

		fs.mkdirSync(path.dirname(destination), { recursive: true });
		fs.writeFileSync(destination, content);
	}

	installLog.info(
		`Extracted ${entries.length} entries (${Math.round(written / 1024)}KB)`,
	);
	if (skipped > 0) {
		installLog.warn(`Skipped ${skipped} symlink entries in the archive`);
	}
};

// A zip commonly wraps the plugin in a single folder. Accept both layouts by
// dropping one level when the manifest is not at the root.
const resolvePluginRoot = (stagingDir) => {
	const manifestName = registry.MANIFEST_FILENAME;

	if (fs.existsSync(path.join(stagingDir, manifestName))) {
		return { pluginRoot: stagingDir };
	}

	const candidates = fs
		.readdirSync(stagingDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
		.map((entry) => path.join(stagingDir, entry.name))
		.filter((dir) => fs.existsSync(path.join(dir, manifestName)));

	if (candidates.length === 1) {
		return { pluginRoot: candidates[0] };
	}
	if (candidates.length > 1) {
		return {
			error: `Found ${candidates.length} plugins here. Please install one at a time.`,
		};
	}
	return {
		error: `No ${manifestName} found. Make sure this is a gSender plugin - the folder or zip must contain ${manifestName}.`,
	};
};

// ---------------------------------------------------------------------------
// Bundle discovery (replaces the ui/assets probe that used to live in main.js)
// ---------------------------------------------------------------------------

const listJsFiles = (dir) => {
	const found = [];
	const queue = [dir];

	while (queue.length > 0) {
		const current = queue.pop();
		let entries = [];
		try {
			entries = fs.readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}
		entries.forEach((entry) => {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
					queue.push(full);
				}
			} else if (path.extname(entry.name).toLowerCase() === ".js") {
				found.push(full);
			}
		});
	}

	return found;
};

// Vite output puts the entry at ui/assets/index-<hash>.js, but plain-JS plugins
// do not follow that layout. Prefer the Vite shape, then anything the HTML
// entry references, then any script under ui/.
const resolveBundlePath = (pluginRoot, manifest) => {
	const uiDir = path.join(pluginRoot, "ui");
	if (!fs.existsSync(uiDir)) {
		return null;
	}

	const jsFiles = listJsFiles(uiDir);
	if (jsFiles.length === 0) {
		return null;
	}

	const assetsIndex = jsFiles.find(
		(file) =>
			path.basename(path.dirname(file)) === "assets" &&
			path.basename(file).startsWith("index"),
	);
	if (assetsIndex) {
		return assetsIndex;
	}

	const entry = manifest.ui?.entry
		? path.join(pluginRoot, manifest.ui.entry)
		: null;
	if (entry && fs.existsSync(entry) && entry.toLowerCase().endsWith(".html")) {
		try {
			const html = fs.readFileSync(entry, "utf8");
			const referenced = [...html.matchAll(/src\s*=\s*["']([^"']+\.js)["']/gi)]
				.map((match) => path.resolve(path.dirname(entry), match[1]))
				.find((file) => jsFiles.includes(file));
			if (referenced) {
				return referenced;
			}
		} catch {
			// Fall through to the generic pick below.
		}
	}

	return (
		jsFiles.find((file) => path.basename(file).startsWith("index")) ??
		jsFiles[0]
	);
};

// ---------------------------------------------------------------------------
// Version + engine comparison
// ---------------------------------------------------------------------------

// "new" | "update" | "downgrade" | "reinstall" | "unknown"
const classifyVersions = (installedVersion, incomingVersion) => {
	if (!installedVersion) {
		return "new";
	}
	const from = semver.valid(installedVersion);
	const to = semver.valid(incomingVersion);
	if (!from || !to) {
		return "unknown";
	}
	if (semver.gt(to, from)) {
		return "update";
	}
	if (semver.lt(to, from)) {
		return "downgrade";
	}
	return "reinstall";
};

// settings.version can carry an EDGE suffix, so coerce before range-checking.
const checkEngine = (engine) => {
	if (!engine) {
		return { checked: false, satisfied: true, range: null };
	}
	if (!semver.validRange(engine)) {
		return { checked: false, satisfied: true, unreadable: true, range: engine };
	}
	const appVersion = semver.coerce(settings.version);
	if (!appVersion) {
		return { checked: false, satisfied: true, unreadable: true, range: engine };
	}
	return {
		checked: true,
		satisfied: semver.satisfies(appVersion, engine),
		appVersion: appVersion.version,
		range: engine,
	};
};

// ---------------------------------------------------------------------------
// prepare
// ---------------------------------------------------------------------------

export const prepare = async (sourcePath) => {
	const installLog = createLog();

	if (typeof sourcePath !== "string" || sourcePath.trim() === "") {
		return fail(installLog, "No plugin folder or zip file was selected");
	}

	const source = path.resolve(sourcePath);
	let sourceStat;
	try {
		sourceStat = fs.statSync(source);
	} catch {
		return fail(installLog, `Could not find "${source}"`);
	}

	const isZip =
		sourceStat.isFile() && path.extname(source).toLowerCase() === ".zip";
	if (!sourceStat.isDirectory() && !isZip) {
		return fail(
			installLog,
			"Select a plugin folder or a .zip file containing one",
		);
	}

	sweepStaleSessions();

	const destRoot = getDestinationRoot();
	if (!destRoot) {
		return fail(installLog, "No plugins directory is configured");
	}
	registry.ensurePluginsDirectory();

	const sessionId = crypto.randomUUID();
	const stagingDir = path.join(getStagingRoot(destRoot), sessionId);

	try {
		fs.mkdirSync(stagingDir, { recursive: true });

		if (isZip) {
			installLog.info(`Extracting ${path.basename(source)}`);
			await extractZip(source, stagingDir, installLog);
		} else {
			installLog.info(`Copying ${path.basename(source)}`);
			fs.cpSync(source, stagingDir, { recursive: true });
		}
	} catch (err) {
		rmrf(stagingDir);
		return fail(installLog, err.message);
	}

	const { pluginRoot, error: layoutError } = resolvePluginRoot(stagingDir);
	if (layoutError) {
		rmrf(stagingDir);
		return fail(installLog, layoutError);
	}
	installLog.info(`Found ${registry.MANIFEST_FILENAME}`);

	const manifest = registry.readManifest(pluginRoot);
	if (!manifest) {
		rmrf(stagingDir);
		return fail(
			installLog,
			`${registry.MANIFEST_FILENAME} is not valid JSON and could not be read`,
		);
	}

	const manifestErrors = registry.validateManifest(manifest, pluginRoot);
	if (manifestErrors.length > 0) {
		rmrf(stagingDir);
		return fail(installLog, "This plugin's manifest is not valid", {
			manifestErrors,
		});
	}
	installLog.info(`Manifest is valid: ${manifest.name} v${manifest.version}`);

	// Two sources of truth: what the manifest declares, and what a static scan
	// of the built bundle can actually prove. We grant the union and tell the
	// user which is which - granting only the scan would strip the capabilities
	// of any plugin that bundles the SDK instead of leaving it external, which
	// silently breaks it.
	const declared = readDeclaredGrant(manifest);
	const bundlePath = resolveBundlePath(pluginRoot, manifest);

	let verifiedPermissions = [];
	let scannedCapabilities = {
		requestTypes: [],
		topics: [],
		allowedFunctions: [],
	};
	let unverifiable = false;
	let scanned = false;

	if (!bundlePath) {
		installLog.warn("No JavaScript bundle found under ui/ to inspect");
		unverifiable = true;
	} else {
		const result = scanPluginForSdkUsage(bundlePath, SDK_SCAN_SPECIFIERS);
		if (!result || result.err || !Array.isArray(result.capabilities)) {
			installLog.warn(
				`Could not scan ${path.relative(pluginRoot, bundlePath)} for SDK usage`,
			);
			unverifiable = true;
		} else {
			scanned = true;
			const grant = buildGrantFromScan(result.capabilities);
			verifiedPermissions = grant.permissions;
			scannedCapabilities = grant.capabilities;
			unverifiable =
				Boolean(result.hasDynamicImport) ||
				result.capabilities.some((name) =>
					UNVERIFIABLE_SENTINELS.includes(name),
				);
			installLog.info(
				`Scanned ${path.relative(pluginRoot, bundlePath)}: ${verifiedPermissions.length} permission(s) confirmed in the code`,
			);
		}
	}

	const permissions = union(verifiedPermissions, declared.permissions);
	const capabilities = {
		requestTypes: union(
			scannedCapabilities.requestTypes,
			declared.capabilities.requestTypes,
		),
		topics: union(scannedCapabilities.topics, declared.capabilities.topics),
		allowedFunctions: union(
			scannedCapabilities.allowedFunctions,
			declared.capabilities.allowedFunctions,
		),
	};

	// Asked for by the manifest but not corroborated by the code we could read.
	const declaredOnlyPermissions = declared.permissions.filter(
		(permission) => !verifiedPermissions.includes(permission),
	);

	if (declaredOnlyPermissions.length > 0) {
		installLog.warn(
			`Declared but not confirmed in the bundle: ${declaredOnlyPermissions.join(", ")}`,
		);
	}
	if (unverifiable) {
		installLog.warn(
			"This plugin's use of the gSender SDK cannot be fully verified",
		);
	}

	// Compare against what is already installed, matched on manifest id.
	const installed = registry
		.discoverPlugins()
		.find((plugin) => plugin.id === manifest.id);

	const kind = classifyVersions(installed?.version, manifest.version);
	const engine = checkEngine(manifest.engine);

	if (engine.checked && !engine.satisfied) {
		installLog.warn(
			`Plugin targets gSender ${manifest.engine}, this is ${engine.appVersion}`,
		);
	}

	// Where the swap will land. An existing copy inside the destination root is
	// replaced in place, even if its folder name differs from the id.
	const inDestRoot =
		Boolean(installed) &&
		path.resolve(installed.sourceDir) === path.resolve(destRoot);
	const targetDir = inDestRoot
		? installed.pluginPath
		: path.join(destRoot, sanitizeDirName(manifest.id));

	// Discovery order is [extraPluginsDirs, userPluginsDir, pluginsDir] and the
	// first match wins, so a bundled or repo copy shadows what we install.
	const shadowedBy = installed && !inDestRoot ? installed.sourceDir : null;
	if (shadowedBy) {
		installLog.warn(
			`Another copy of ${manifest.id} is already loaded from ${shadowedBy} and will take priority`,
		);
	}

	sessions.set(sessionId, {
		createdAt: Date.now(),
		stagingDir,
		pluginRoot,
		targetDir,
		destRoot,
		manifest,
		permissions,
		capabilities,
	});

	return {
		ok: true,
		sessionId,
		log: installLog.entries,
		plan: {
			kind,
			plugin: {
				id: manifest.id,
				name: manifest.name,
				description: manifest.description || "",
				version: manifest.version,
				engine: manifest.engine || null,
				contributions: manifest.ui?.contributions || [],
			},
			installedVersion: installed?.version ?? null,
			incomingVersion: manifest.version,
			permissions,
			verifiedPermissions,
			declaredOnlyPermissions,
			capabilities,
			scanned,
			unverifiable,
			engine,
			shadowedBy,
			sourcePath: source,
			targetDir,
		},
	};
};

// ---------------------------------------------------------------------------
// commit
// ---------------------------------------------------------------------------

export const commit = (sessionId) => {
	const installLog = createLog();
	const session = sessions.get(sessionId);

	if (!session) {
		return fail(
			installLog,
			"This install session has expired. Please start again.",
		);
	}

	const { stagingDir, pluginRoot, targetDir, destRoot, manifest } = session;

	if (!registry.isWithinAllowedRoots(targetDir)) {
		sessions.delete(sessionId);
		rmrf(stagingDir);
		return fail(
			installLog,
			"Refusing to install outside the plugins directory",
		);
	}

	// Permissions are written into the staged copy, so the folder the user
	// picked is never modified.
	const permissionError = registry.changeManifestPermissions(pluginRoot, {
		permissions: session.permissions,
		capabilities: session.capabilities,
	});
	if (permissionError) {
		sessions.delete(sessionId);
		rmrf(stagingDir);
		return fail(
			installLog,
			`Failed to write permissions into the plugin manifest: ${permissionError.message}`,
		);
	}
	installLog.info("Wrote granted permissions to the manifest");

	const hadPrevious = fs.existsSync(targetDir);
	const backupDir = path.join(
		getBackupRoot(destRoot),
		`${sanitizeDirName(manifest.id)}-${Date.now()}`,
	);
	let backedUp = false;

	try {
		if (hadPrevious) {
			fs.mkdirSync(path.dirname(backupDir), { recursive: true });
			fs.renameSync(targetDir, backupDir);
			backedUp = true;
			installLog.info("Moved the previous version aside");
		}

		fs.mkdirSync(path.dirname(targetDir), { recursive: true });
		try {
			fs.renameSync(pluginRoot, targetDir);
		} catch (err) {
			// Staging and target land on different volumes when the user points
			// userPluginsDir at another drive.
			if (err.code !== "EXDEV") {
				throw err;
			}
			fs.cpSync(pluginRoot, targetDir, { recursive: true });
		}
		installLog.info(`Installed to ${targetDir}`);
	} catch (err) {
		// Roll back: drop whatever we managed to write, then put the previous
		// version back so the user is left with a working plugin.
		rmrf(targetDir);
		let restored = false;
		if (backedUp) {
			try {
				fs.renameSync(backupDir, targetDir);
				restored = true;
			} catch (restoreErr) {
				installLog.error(
					`Could not restore the previous version from ${backupDir}: ${restoreErr.message}`,
				);
			}
		}
		sessions.delete(sessionId);
		rmrf(stagingDir);
		return fail(installLog, `Install failed: ${err.message}`, {
			restored,
			backupDir: backedUp && !restored ? backupDir : null,
		});
	}

	if (backedUp) {
		rmrf(backupDir);
	}
	rmrf(stagingDir);
	sessions.delete(sessionId);

	installLog.info("Done - restart gSender to load the plugin");

	return {
		ok: true,
		log: installLog.entries,
		pluginId: manifest.id,
		targetDir,
		replaced: hadPrevious,
		restartRequired: true,
	};
};

// ---------------------------------------------------------------------------
// cancel / uninstall
// ---------------------------------------------------------------------------

export const cancel = (sessionId) => {
	const session = sessions.get(sessionId);
	if (!session) {
		return { ok: true, msg: "No such session" };
	}
	rmrf(session.stagingDir);
	sessions.delete(sessionId);
	return { ok: true, msg: "Install cancelled" };
};

export const uninstall = (pluginId) => {
	const installLog = createLog();
	const plugin = registry
		.discoverPlugins()
		.find((candidate) => candidate.id === pluginId);

	if (!plugin) {
		return fail(installLog, `Plugin not found: ${pluginId}`);
	}
	if (!registry.isWithinAllowedRoots(plugin.pluginPath)) {
		return fail(
			installLog,
			"Refusing to remove a plugin outside the plugins directory",
		);
	}

	const backupDir = path.join(
		getBackupRoot(plugin.sourceDir),
		`${sanitizeDirName(pluginId)}-${Date.now()}`,
	);

	try {
		fs.mkdirSync(path.dirname(backupDir), { recursive: true });
		fs.renameSync(plugin.pluginPath, backupDir);
	} catch (err) {
		return fail(installLog, `Could not remove the plugin: ${err.message}`);
	}

	rmrf(backupDir);
	registry.forgetPluginSettings(pluginId);
	installLog.info(`Removed ${plugin.name} from ${plugin.pluginPath}`);

	return {
		ok: true,
		log: installLog.entries,
		pluginId,
		restartRequired: true,
	};
};

// Exposed for tests so an aborted case cannot leak staging between runs.
export const __resetSessions = () => {
	sessions.forEach((session) => rmrf(session.stagingDir));
	sessions.clear();
};

export default { prepare, commit, cancel, uninstall, __resetSessions };
