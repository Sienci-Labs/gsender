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

import fs from "fs";
import path from "path";

import settings from "../../config/settings";
import config from "../configstore";
import logger from "../../lib/logger";

const log = logger("service:pluginregistry");

const MANIFEST_FILENAME = "gsender-plugin.json";

const getPluginsDirectory = () => settings.pluginsDir;

const ensurePluginsDirectory = () => {
	const dir = getPluginsDirectory();
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return dir;
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

	const uiDir = path.join(pluginPath, path.dirname(manifest.ui?.entry || ""));
	const entryPath = path.join(pluginPath, manifest.ui?.entry || "");
	if (manifest.ui?.entry && !fs.existsSync(entryPath)) {
		errors.push(`UI entry not found: ${manifest.ui.entry}`);
	}

	if (manifest.ui?.contributions && !Array.isArray(manifest.ui.contributions)) {
		errors.push('"ui.contributions" must be an array');
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
	if (Object.prototype.hasOwnProperty.call(pluginSettings, pluginId)) {
		return pluginSettings[pluginId]?.enabled !== false;
	}
	return true;
};

const setPluginEnabled = (pluginId, enabled) => {
	const pluginSettings = { ...getPluginSettings() };
	pluginSettings[pluginId] = { ...pluginSettings[pluginId], enabled };
	config.set("pluginSettings", pluginSettings);
};

const discoverPlugins = () => {
	const pluginsDir = ensurePluginsDirectory();
	let entries = [];

	try {
		entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
	} catch (err) {
		log.error(`Failed to read plugins directory: ${err.message}`);
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

		plugins.push({
			id: manifest.id,
			name: manifest.name,
			version: manifest.version,
			engine: manifest.engine || null,
			permissions: manifest.permissions || [],
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
		});
	});

	return plugins;
};

const getEnabledPlugins = () =>
	discoverPlugins().filter((p) => p.valid && p.enabled);

const getMountPointsFromPlugins = () => {
	return getEnabledPlugins()
		.filter((plugin) => fs.existsSync(plugin.uiServePath))
		.map((plugin) => ({
			route: plugin.mountRoute,
			target: plugin.uiServePath,
			pluginId: plugin.id,
		}));
};

export default {
	MANIFEST_FILENAME,
	getPluginsDirectory,
	ensurePluginsDirectory,
	discoverPlugins,
	getEnabledPlugins,
	getMountPointsFromPlugins,
	setPluginEnabled,
	isPluginEnabled,
	validateManifest,
};
