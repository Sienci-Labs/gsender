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

import { ERR_BAD_REQUEST } from "../constants";
import pendantDiscovery from "../services/pendantDiscovery";

// Starts (or keeps alive) LAN browsing and returns what's known so far.
export const discover = (req, res) => {
	pendantDiscovery.touch();
	res.send(pendantDiscovery.list());
};

export const createQr = (req, res) => {
	pendantDiscovery.touch();
	res.send(pendantDiscovery.createQr());
};

// Body is either { nonce, host?, port? } (QR flow, polled by the dialog) or
// { host, port, code } (manual flow).
export const claim = async (req, res) => {
	const { nonce, code, host, port } = req.body || {};
	const portNumber = Number(port) || undefined;

	try {
		if (nonce) {
			const tablet = await pendantDiscovery.claimNonce(
				nonce,
				host ? { host, port: portNumber || 8010 } : null,
			);
			res.send({ paired: Boolean(tablet), tablet });
			return;
		}
		if (host && portNumber && code) {
			const tablet = await pendantDiscovery.claimCode(host, portNumber, code);
			res.send({ paired: true, tablet });
			return;
		}
		res.status(ERR_BAD_REQUEST).send({ msg: "Missing pairing details" });
	} catch (err) {
		const status = err.status || err.response?.status;
		if (status === 410) {
			res.status(410).send({ msg: err.message });
		} else if (status === 404) {
			res.status(401).send({ msg: "Incorrect pairing code" });
		} else if (status === 429) {
			res.status(429).send({ msg: "Too many pairing attempts - wait a minute" });
		} else {
			res.status(502).send({
				msg: `Could not reach the tablet${host ? ` at ${host}:${portNumber}` : ""}`,
			});
		}
	}
};

export const listTablets = (req, res) => {
	res.send(pendantDiscovery.list());
};

export const forgetTablet = (req, res) => {
	const { id } = req.params;

	if (!pendantDiscovery.forget(id)) {
		res.status(404).send({ msg: "Tablet not found" });
		return;
	}

	res.send({ forgotten: id });
};
