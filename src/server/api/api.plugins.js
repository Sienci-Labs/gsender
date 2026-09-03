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

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
	ERR_BAD_REQUEST,
	ERR_INTERNAL_SERVER_ERROR,
	ERR_NOT_FOUND,
} from "../constants";
import logger from "../lib/logger";
import cncengine from "../services/cncengine";
import pluginRegistry from "../services/pluginregistry";

const log = logger("api:plugins");

export const fetch = (_req, res) => {
	const plugins = pluginRegistry.discoverPlugins().map((plugin) => ({
		id: plugin.id,
		name: plugin.name,
		version: plugin.version,
		description: plugin.description,
		engine: plugin.engine,
		capabilities: plugin.capabilities,
		enabled: plugin.enabled,
		valid: plugin.valid,
		errors: plugin.errors,
		mountSlug: plugin.mountSlug,
		mountRoute: plugin.mountRoute,
		uiUrl: plugin.uiUrl,
		contributions: plugin.contributions,
	}));

	res.send({
		pluginsDir: pluginRegistry.getPluginsDirectory(),
		userPluginsDir: pluginRegistry.getUserPluginsDir(),
		plugins,
	});
};

export const update = (req, res) => {
	const { id } = req.params;
	const { enabled } = req.body || {};

	if (typeof enabled !== "boolean") {
		return res.status(ERR_BAD_REQUEST).send({
			msg: 'Request body must include boolean "enabled"',
		});
	}

	const plugin = pluginRegistry.discoverPlugins().find((p) => p.id === id);

	if (!plugin) {
		return res.status(ERR_NOT_FOUND).send({
			msg: `Plugin not found: ${id}`,
		});
	}

	pluginRegistry.setPluginEnabled(id, enabled);

	// Manifest parsers are owned by the registry, so a live controller needs to
	// be told to rebuild its chain — otherwise a disabled plugin keeps watching
	// (and an enabled one stays silent) until the next reconnect.
	cncengine.reloadPluginParsers();

	res.send({
		id,
		enabled,
		msg: enabled ? "Plugin enabled" : "Plugin disabled",
		restartRequired: true,
	});
};

// Determine whether `target` lives inside one of the allowed plugin roots.
const isWithinAllowedRoots = (target) => {
	const roots = pluginRegistry
		.getPluginDirectories()
		.map((dir) => path.resolve(dir));

	return roots.some((root) => {
		// The root itself is allowed, as is anything beneath it. The trailing
		// separator prevents a sibling like "/plugins-evil" matching "/plugins".
		const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
		return target === root || target.startsWith(rootWithSep);
	});
};

// Open a filesystem path in the OS file manager (Explorer/Finder/xdg-open).
const revealInFileManager = (target) => {
	const platform = process.platform;

	if (platform === "win32") {
		// explorer exits with code 1 even on success, so we don't await its exit
		// status; spawning it is enough to open the window.
		spawn("explorer.exe", [target], { detached: true }).unref();
		return;
	}

	if (platform === "darwin") {
		spawn("open", [target], { detached: true }).unref();
		return;
	}

	// Linux and other *nix desktops.
	spawn("xdg-open", [target], { detached: true }).unref();
};

export const openDirectory = (req, res) => {
	const { pluginPath } = req.body || {};
	const pluginsDir = pluginRegistry.getPluginsDirectory();
	const userPluginsDir = pluginRegistry.getUserPluginsDir();

	const resolvedPluginsDir = userPluginsDir || pluginsDir || "";

	let target = resolvedPluginsDir;

	if (pluginPath) {
		if (typeof pluginPath !== "string") {
			return res.status(ERR_BAD_REQUEST).send({
				msg: '"pluginPath" must be a string',
			});
		}

		const resolved = path.resolve(pluginPath);
		if (!isWithinAllowedRoots(resolved)) {
			return res.status(ERR_BAD_REQUEST).send({
				msg: "Requested path is outside the plugins directory",
			});
		}
		target = resolved;
	}

	pluginRegistry.ensurePluginsDirectory();

	if (!fs.existsSync(target)) {
		return res.status(ERR_NOT_FOUND).send({
			msg: `Directory not found: ${target}`,
		});
	}

	try {
		revealInFileManager(target);
	} catch (err) {
		log.error(`Failed to open directory ${target}: ${err.message}`);
		return res.status(ERR_INTERNAL_SERVER_ERROR).send({
			msg: `Failed to open directory: ${err.message}`,
		});
	}

	res.send({ msg: "Opened directory", path: target });
};

export const readImportedManifest = (req, res) => {
	const { pluginPath } = req.body;

	try {
		if (typeof pluginPath !== "string") {
			log.error("plugin path not string");
			return res.status(ERR_BAD_REQUEST).send({
				msg: '"pluginPath" must be a string',
			});
		}

		if (!fs.existsSync(pluginPath)) {
			log.error("directory not found");
			return res.status(ERR_NOT_FOUND).send({
				msg: `Directory not found: ${pluginPath}`,
			});
		}

		const result = pluginRegistry.readImportedManifest(pluginPath);
		if (!result) {
			log.error("manifest not found");
			return res.status(ERR_NOT_FOUND).send({ msg: "Manifest not found" });
		}
		res.send({ msg: "Manifest read", ...result });
	} catch (err) {
		log.error(err);
		res.status(ERR_INTERNAL_SERVER_ERROR).send({ msg: err });
	}
};

export const writePermissions = (req, res) => {
	const { pluginPath, capabilities } = req.body;

	try {
		if (typeof pluginPath !== "string") {
			return res.status(ERR_BAD_REQUEST).send({
				msg: '"pluginPath" must be a string',
			});
		}

		if (!fs.existsSync(pluginPath)) {
			return res.status(ERR_NOT_FOUND).send({
				msg: `Directory not found: ${pluginPath}`,
			});
		}

		const error = pluginRegistry.changeManifestPermissions(
			pluginPath,
			capabilities,
		);
		if (error) {
			return res
				.status(ERR_INTERNAL_SERVER_ERROR)
				.send({ msg: "Error writing manifest", error });
		}
		res.status(200).send({ msg: "Permissions written" });
	} catch (err) {
		log.error(err);
		res
			.status(ERR_INTERNAL_SERVER_ERROR)
			.send({ msg: "Error writing manifest", error: err });
	}
};

export const scanPluginForSDKUsage = (req, res) => {
	const { indexFile, sdks } = req.body;
	const result = pluginRegistry.scanPlugin(indexFile, sdks);
	if (result.err) {
		return res.status(ERR_NOT_FOUND).send({
			msg: "Error scanning manifest for sdk usage",
			error: result.err,
		});
	}
	res.send({ msg: "Scanned for sdk usage", ...result });
};

export const updateSettings = (req, res) => {
	const { pluginsDir } = req.body || {};

	if (pluginsDir !== undefined && typeof pluginsDir !== "string") {
		return res.status(ERR_BAD_REQUEST).send({
			msg: '"pluginsDir" must be a string',
		});
	}

	try {
		const previousUserPluginsDir = pluginRegistry.getUserPluginsDir();
		const saved = pluginRegistry.setUserPluginsDir(pluginsDir || "");
		res.send({
			msg: "Plugin settings updated",
			userPluginsDir: saved,
			previousUserPluginsDir,
			restartRequired: true,
		});
	} catch (err) {
		log.error(err);
		res.status(ERR_INTERNAL_SERVER_ERROR).send({
			msg: `Failed to update plugin settings: ${err.message}`,
		});
	}
};

export const importPlugin = (req, res) => {
	const { pluginsDir, directory } = req.body;
	const error = pluginRegistry.pluginImport(pluginsDir, directory);
	if (error) {
		return res
			.status(ERR_INTERNAL_SERVER_ERROR)
			.send({ msg: "Failed to import plugin", error });
	}
	// A newly imported plugin may declare parsers; pick them up without waiting
	// for a reconnect.
	cncengine.reloadPluginParsers();

	res.send({ msg: "Successfully imported plugin" });
};
