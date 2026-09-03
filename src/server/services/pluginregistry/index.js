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

import fs from "node:fs";
import path from "node:path";

import settings from "../../config/settings";
import logger from "../../lib/logger";
import { validateParserSpecs } from "../../lib/plugin-parsers";
import config from "../configstore";
import { normalizeCapabilities } from "./capabilities";
import { scanPluginForSdkUsage } from "./pluginSecurity";

const log = logger("service:pluginregistry");

const MANIFEST_FILENAME = "gsender-plugin.json";

// Across every enabled plugin. Each plugin is separately capped at
// MAX_PARSERS_PER_PLUGIN by validateParserSpecs.
const MAX_TOTAL_PARSERS = 64;

const normalizePermissions = (permissions) =>
	Array.isArray(permissions)
		? permissions.filter((item) => typeof item === "string")
		: [];

/**
 * Validates a manifest's "parsers" block.
 *
 * Deliberately non-fatal: a bad regex reports an error but leaves the plugin
 * valid and mounted. One malformed parser should not take a working UI offline.
 *
 * The specs are kept in their raw (serializable) form here — the controller
 * compiles them into a PluginParserChain when a port opens. Compiling now would
 * mean holding RegExp objects in the registry that nothing can use yet.
 */
const normalizeParsers = (manifest, pluginId) => {
	const raw = manifest?.parsers;
	if (raw === undefined || raw === null) {
		return { parsers: [], parserErrors: [] };
	}

	const { errors } = validateParserSpecs(raw, {
		pluginId,
		ownerId: `manifest:${pluginId}`,
		origin: "manifest",
	});

	// Keep only the specs that compiled cleanly, matched back by id.
	const failed = new Set(errors.map(({ id }) => id));
	const parsers = (Array.isArray(raw) ? raw : []).filter(
		(spec, index) => !failed.has(spec?.id ? String(spec.id) : `#${index}`),
	);

	return {
		parsers,
		parserErrors: errors.map(({ id, error }) => `parser "${id}": ${error}`),
	};
};

const getPluginsDirectory = () => settings.pluginsDir;

const ensurePluginsDirectory = () => {
	const dir = getPluginsDirectory();
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return dir;
};

const getUserPluginsDir = () => config.get("userPluginsDir", "");

const setUserPluginsDir = (dir) => {
	const value = typeof dir === "string" ? dir.trim() : "";
	config.set("userPluginsDir", value);
	if (value) {
		fs.mkdirSync(value, { recursive: true });
	}
	return value;
};

const getPluginDirectories = () => {
	const extra = Array.isArray(settings.extraPluginsDirs)
		? settings.extraPluginsDirs
		: [];
	// The user-chosen directory is additive alongside the default pluginsDir
	const ordered = [...extra, getUserPluginsDir(), getPluginsDirectory()];

	const seen = new Set();
	const dirs = [];
	ordered.forEach((dir) => {
		if (!dir) {
			return;
		}
		const resolved = path.resolve(dir);
		if (seen.has(resolved)) {
			return;
		}
		seen.add(resolved);
		dirs.push(resolved);
	});

	return dirs;
};

const readManifest = (pluginPath) => {
	const manifestPath = path.join(pluginPath, MANIFEST_FILENAME);
	if (!fs.existsSync(manifestPath)) {
		return null;
	}

	try {
		const raw = fs.readFileSync(manifestPath, "utf8");
		return JSON.parse(raw);
	} catch (err) {
		log.error(`Failed to parse manifest at ${manifestPath}: ${err.message}`);
		return null;
	}
};

const validateManifest = (manifest, pluginPath) => {
	const errors = [];

	if (!manifest || typeof manifest !== "object") {
		return ["Manifest must be a JSON object"];
	}
	if (!manifest.id || typeof manifest.id !== "string") {
		errors.push('Missing or invalid "id"');
	}
	if (!manifest.name || typeof manifest.name !== "string") {
		errors.push('Missing or invalid "name"');
	}
	if (!manifest.version || typeof manifest.version !== "string") {
		errors.push('Missing or invalid "version"');
	}
	if (!manifest.ui?.entry || typeof manifest.ui.entry !== "string") {
		errors.push('Missing or invalid "ui.entry"');
	}

	// const uiDir = path.join(pluginPath, path.dirname(manifest.ui?.entry || ""));
	const entryPath = path.join(pluginPath, manifest.ui?.entry || "");
	if (manifest.ui?.entry && !fs.existsSync(entryPath)) {
		errors.push(`UI entry not found: ${manifest.ui.entry}`);
	}

	if (manifest.ui?.contributions && !Array.isArray(manifest.ui.contributions)) {
		errors.push('"ui.contributions" must be an array');
	}

	// Only the wrong SHAPE invalidates the plugin. Problems with individual
	// parser specs are collected into parserErrors instead, so one bad regex
	// cannot un-mount an otherwise working plugin.
	if (
		manifest.parsers !== undefined &&
		manifest.parsers !== null &&
		!Array.isArray(manifest.parsers)
	) {
		errors.push('"parsers" must be an array');
	}

	return errors;
};

const getMountSlug = (manifest) => {
	const contributions = manifest.ui?.contributions || [];
	const toolsPage = contributions.find(
		(c) => c.slot === "tools-page" && c.route,
	);
	if (toolsPage?.route) {
		return String(toolsPage.route).replace(/^\//, "");
	}

	const id = manifest.id || "plugin";
	const segments = id.split(".");
	return segments[segments.length - 1] || id;
};

const getPluginSettings = () => config.get("pluginSettings", {});

const isPluginEnabled = (pluginId) => {
	const pluginSettings = getPluginSettings();
	if (Object.hasOwn(pluginSettings, pluginId)) {
		return pluginSettings[pluginId]?.enabled !== false;
	}
	return true;
};

const setPluginEnabled = (pluginId, enabled) => {
	const pluginSettings = { ...getPluginSettings() };
	pluginSettings[pluginId] = { ...pluginSettings[pluginId], enabled };
	config.set("pluginSettings", pluginSettings);
};

const discoverPluginsInDir = (pluginsDir) => {
	let entries = [];

	try {
		entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
	} catch (err) {
		if (err.code !== "ENOENT") {
			log.error(
				`Failed to read plugins directory ${pluginsDir}: ${err.message}`,
			);
		}
		return [];
	}

	const plugins = [];

	entries.forEach((entry) => {
		if (!entry.isDirectory()) {
			return;
		}

		const pluginPath = path.join(pluginsDir, entry.name);
		const manifest = readManifest(pluginPath);

		if (!manifest) {
			return;
		}

		const errors = validateManifest(manifest, pluginPath);
		const mountSlug = getMountSlug(manifest);
		const mountRoute = `/plugins/${mountSlug}`;
		const enabled = isPluginEnabled(manifest.id);
		const uiServePath = path.join(pluginPath, "ui");
		const { parsers, parserErrors } = normalizeParsers(manifest, manifest.id);

		plugins.push({
			id: manifest.id,
			name: manifest.name,
			version: manifest.version,
			description: manifest.description || "",
			engine: manifest.engine || null,
			capabilities: normalizeCapabilities(manifest.capabilities),
			permissions: normalizePermissions(manifest.permissions),
			parsers,
			parserErrors,
			enabled,
			valid: errors.length === 0,
			errors,
			mountSlug,
			mountRoute,
			uiUrl: `${mountRoute}/index.html`,
			entry: manifest.ui.entry,
			contributions: manifest.ui.contributions || [],
			pluginPath,
			uiServePath,
			sourceDir: pluginsDir,
		});
	});

	return plugins;
};

const discoverPlugins = () => {
	ensurePluginsDirectory();
	const dirs = getPluginDirectories();

	const seenIds = new Set();
	const seenSlugs = new Set();
	const plugins = [];

	dirs.forEach((dir) => {
		discoverPluginsInDir(dir).forEach((plugin) => {
			if (seenIds.has(plugin.id)) {
				log.debug(
					`Skipping duplicate plugin id "${plugin.id}" from ${dir} (already loaded)`,
				);
				return;
			}
			if (seenSlugs.has(plugin.mountSlug)) {
				log.debug(
					`Skipping plugin "${plugin.id}" from ${dir}: mount slug "${plugin.mountSlug}" already in use`,
				);
				return;
			}
			seenIds.add(plugin.id);
			seenSlugs.add(plugin.mountSlug);
			plugins.push(plugin);
		});
	});

	return plugins;
};

const getEnabledPlugins = () =>
	discoverPlugins().filter((p) => p.valid && p.enabled);

/**
 * Every manifest-declared parser spec across every enabled, valid plugin, each
 * tagged with the plugin that owns it. This is what a controller reads when a
 * port opens, so disabling a plugin removes its parsers on the next rebuild
 * with no extra bookkeeping.
 */
const getPluginParserSpecs = () => {
	const specs = getEnabledPlugins().flatMap((plugin) =>
		(plugin.parsers || []).map((spec) => ({ ...spec, pluginId: plugin.id })),
	);

	if (specs.length > MAX_TOTAL_PARSERS) {
		log.warn(
			`${specs.length} plugin parsers declared; keeping the first ${MAX_TOTAL_PARSERS}`,
		);
		return specs.slice(0, MAX_TOTAL_PARSERS);
	}

	return specs;
};

const getMountPointsFromPlugins = () => {
	return getEnabledPlugins()
		.filter((plugin) => fs.existsSync(plugin.uiServePath))
		.map((plugin) => ({
			route: plugin.mountRoute,
			target: plugin.uiServePath,
			pluginId: plugin.id,
		}));
};

// HMR for plugins
let watchers = [];
let watchDebounce = null;

const stopWatchingPlugins = () => {
	watchers.forEach((watcher) => {
		try {
			watcher.close();
		} catch {
			// ignore
		}
	});
	watchers = [];
	if (watchDebounce) {
		clearTimeout(watchDebounce);
		watchDebounce = null;
	}
};

const watchPlugins = (onChange, { debounceMs = 200 } = {}) => {
	stopWatchingPlugins();

	const notify = (dir, filename) => {
		if (watchDebounce) {
			clearTimeout(watchDebounce);
		}
		watchDebounce = setTimeout(() => {
			watchDebounce = null;
			try {
				onChange({ dir, filename });
			} catch (err) {
				log.error(`Plugin watch handler failed: ${err.message}`);
			}
		}, debounceMs);
	};

	const addWatch = (target, { recursive }) => {
		if (!fs.existsSync(target)) {
			return;
		}
		try {
			const watcher = fs.watch(target, { recursive }, (_event, filename) =>
				notify(target, filename),
			);
			watchers.push(watcher);
		} catch (_err) {
			// Recursive watch isn't available on some platforms/Node versions.
			try {
				const watcher = fs.watch(target, (_event, filename) =>
					notify(target, filename),
				);
				watchers.push(watcher);
			} catch (innerErr) {
				log.error(`Failed to watch ${target}: ${innerErr.message}`);
			}
		}
	};

	// Shallow-watch the roots so adding/removing a plugin folder is detected.
	getPluginDirectories().forEach((dir) => {
		addWatch(dir, { recursive: false });
	});

	// Deep-watch each served `ui/` directory — this is exactly what the iframe
	// loads, so it covers both source (vanilla) and built (Vite) plugins without
	// watching node_modules or pre-build source.
	const uiDirs = discoverPlugins()
		.filter((plugin) => plugin.valid)
		.map((plugin) => plugin.uiServePath);

	uiDirs.forEach((uiDir) => {
		addWatch(uiDir, { recursive: true });
	});

	log.info(
		`Watching ${uiDirs.length} plugin UI director${uiDirs.length === 1 ? "y" : "ies"} for changes`,
	);

	return stopWatchingPlugins;
};

const readImportedManifest = (pluginPath) => {
	const manifest = readManifest(pluginPath);
	if (!manifest) {
		return null;
	}

	const errors = validateManifest(manifest, pluginPath);
	const { parsers, parserErrors } = normalizeParsers(manifest, manifest.id);
	const plugin = {
		id: manifest.id,
		name: manifest.name,
		version: manifest.version,
		engine: manifest.engine || null,
		capabilities: normalizeCapabilities(manifest.capabilities),
		permissions: normalizePermissions(manifest.permissions),
		// Surfaced in the permissions dialog: manifest parsers involve no SDK
		// import, so the bundle scan cannot see them and the user would otherwise
		// approve raw-stream access without being shown what is being watched.
		parsers,
		parserErrors,
		valid: errors.length === 0,
		errors,
		entry: manifest.ui.entry,
		contributions: manifest.ui.contributions || [],
		pluginPath,
	};

	return {
		isValid: true,
		plugin,
	};
};

const changeManifestPermissions = (pluginPath, capabilities) => {
	const manifest = readManifest(pluginPath);
	if (!manifest) {
		log.error("no manifest");
		return null;
	}

	const newManifest = {
		...manifest,
		capabilities: normalizeCapabilities(capabilities),
	};

	const manifestPath = path.join(pluginPath, MANIFEST_FILENAME);
	try {
		fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, "\t"));
		return 0;
	} catch (err) {
		log.error(`Failed to write manifest at ${manifestPath}: ${err.message}`);
		return err;
	}
};

const scanPlugin = scanPluginForSdkUsage;

const pluginImport = (pluginsDir, pluginPath) => {
	try {
		const importPath = path.join(pluginsDir, path.basename(pluginPath));
		log.debug(importPath);
		fs.cpSync(pluginPath, importPath, {
			recursive: true,
		});
		return 0;
	} catch (err) {
		log.error(`Failed to import plugin at ${pluginsDir}: ${err.message}`);
		return err;
	}
};

export default {
	MANIFEST_FILENAME,
	getPluginsDirectory,
	getPluginDirectories,
	getUserPluginsDir,
	setUserPluginsDir,
	ensurePluginsDirectory,
	discoverPlugins,
	getEnabledPlugins,
	getPluginParserSpecs,
	getMountPointsFromPlugins,
	setPluginEnabled,
	isPluginEnabled,
	validateManifest,
	watchPlugins,
	stopWatchingPlugins,
	readImportedManifest,
	changeManifestPermissions,
	scanPlugin,
	pluginImport,
};
