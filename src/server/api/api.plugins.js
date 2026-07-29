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

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import {
	ERR_BAD_REQUEST,
	ERR_INTERNAL_SERVER_ERROR,
	ERR_NOT_FOUND,
} from "../constants";
import logger from "../lib/logger";
import pluginRegistry from "../services/pluginregistry";

const log = logger("api:plugins");

export const fetch = (req, res) => {
	const plugins = pluginRegistry.discoverPlugins().map((plugin) => ({
		id: plugin.id,
		name: plugin.name,
		version: plugin.version,
		engine: plugin.engine,
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

	let target = pluginsDir;

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
