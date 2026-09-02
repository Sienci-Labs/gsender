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
import pluginRegistry from "../services/pluginregistry";
import pluginInstaller from "../services/pluginregistry/install";

const log = logger("api:plugins");

// Tell open clients the plugin list changed so they refetch. cncengine is
// required lazily because importing it at module scope drags the whole
// controller stack (serialport, shortid) into everything that imports this
// file, tests included.
const notifyPluginsChanged = (payload) => {
	try {
		require("../services/cncengine").default.emit("plugins:changed", payload);
	} catch (err) {
		log.error(`Failed to notify clients of plugin changes: ${err.message}`);
	}
};

export const fetch = (_req, res) => {
	const plugins = pluginRegistry.discoverPlugins().map((plugin) => ({
		id: plugin.id,
		name: plugin.name,
		version: plugin.version,
		description: plugin.description,
		engine: plugin.engine,
		capabilities: plugin.capabilities,
		permissions: plugin.permissions,
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

	res.send({
		id,
		enabled,
		msg: enabled ? "Plugin enabled" : "Plugin disabled",
		restartRequired: true,
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
		if (!pluginRegistry.isWithinAllowedRoots(resolved)) {
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

// ---------------------------------------------------------------------------
// Guided install
// ---------------------------------------------------------------------------

// Stage the plugin and report back everything the review step shows: version
// change, permissions, engine compatibility. Nothing under the live plugins
// directory is touched until installCommit.
export const installPrepare = async (req, res) => {
	const { sourcePath } = req.body || {};

	try {
		const result = await pluginInstaller.prepare(sourcePath);
		if (!result.ok) {
			return res.status(ERR_BAD_REQUEST).send(result);
		}
		res.send(result);
	} catch (err) {
		log.error(`Failed to prepare plugin install: ${err.message}`);
		res.status(ERR_INTERNAL_SERVER_ERROR).send({
			ok: false,
			error: `Something went wrong preparing the install: ${err.message}`,
		});
	}
};

export const installCommit = (req, res) => {
	const { sessionId } = req.body || {};

	if (typeof sessionId !== "string") {
		return res.status(ERR_BAD_REQUEST).send({
			ok: false,
			error: '"sessionId" must be a string',
		});
	}

	try {
		const result = pluginInstaller.commit(sessionId);
		if (!result.ok) {
			return res.status(ERR_INTERNAL_SERVER_ERROR).send(result);
		}
		notifyPluginsChanged({ pluginId: result.pluginId });
		res.send(result);
	} catch (err) {
		log.error(`Failed to install plugin: ${err.message}`);
		res.status(ERR_INTERNAL_SERVER_ERROR).send({
			ok: false,
			error: `Something went wrong installing the plugin: ${err.message}`,
		});
	}
};

export const installCancel = (req, res) => {
	const { sessionId } = req.body || {};
	res.send(pluginInstaller.cancel(sessionId));
};

export const uninstall = (req, res) => {
	const { id } = req.params;

	try {
		const result = pluginInstaller.uninstall(id);
		if (!result.ok) {
			return res.status(ERR_NOT_FOUND).send(result);
		}
		notifyPluginsChanged({ pluginId: id });
		res.send(result);
	} catch (err) {
		log.error(`Failed to uninstall plugin ${id}: ${err.message}`);
		res.status(ERR_INTERNAL_SERVER_ERROR).send({
			ok: false,
			error: `Something went wrong removing the plugin: ${err.message}`,
		});
	}
};
