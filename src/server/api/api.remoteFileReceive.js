/*
 * Copyright (C) 2026 Sienci Labs Inc.
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
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER_ERROR } from "../constants";
import { listNetworkAddresses } from "../lib/network-interfaces";
import remoteFileReceive from "../services/remoteFileReceive";

export const fetch = async (req, res) => {
	const settings = remoteFileReceive.getSettings();
	const running = remoteFileReceive.isRunning();
	const addresses = await listNetworkAddresses();

	res.send({
		...settings,
		running,
		port: running ? remoteFileReceive.port : settings.port,
		token: running ? remoteFileReceive.getToken() : null,
		addresses,
		files: running ? remoteFileReceive.listIncomingFiles() : [],
	});
};

export const update = (req, res) => {
	const { enabled, port } = req.body;

	try {
		if (enabled) {
			const result = remoteFileReceive.start(port);
			res.send({ enabled: true, ...result });
		} else {
			remoteFileReceive.stop();
			res.send({ enabled: false });
		}
	} catch (err) {
		res.status(ERR_INTERNAL_SERVER_ERROR).send({
			msg: "Failed to update remote file receive settings",
		});
	}
};

export const regenerateToken = (req, res) => {
	if (!remoteFileReceive.isRunning()) {
		res
			.status(ERR_BAD_REQUEST)
			.send({ msg: "Remote file receive is not running" });
		return;
	}

	res.send({ token: remoteFileReceive.regenerateToken() });
};

export const listFiles = (req, res) => {
	res.send({ files: remoteFileReceive.listIncomingFiles() });
};

export const readFile = (req, res) => {
	const { name } = req.params;
	const gcode = remoteFileReceive.readIncomingFile(name);

	if (gcode === null) {
		res.status(404).send({ msg: "File not found" });
		return;
	}

	res.send({ name, gcode });
};

export const deleteFiles = (req, res) => {
	const { names } = req.body;

	if (!Array.isArray(names) || names.length === 0) {
		res.status(ERR_BAD_REQUEST).send({ msg: "No files specified" });
		return;
	}

	const deleted = remoteFileReceive.deleteIncomingFiles(names);
	res.send({ deleted });
};
