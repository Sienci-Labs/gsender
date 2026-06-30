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

import { ERR_BAD_REQUEST, ERR_NOT_FOUND } from "../constants";
import pluginRegistry from "../services/pluginregistry";

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
