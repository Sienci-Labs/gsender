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

// Advertises the remote file receiver over mDNS/DNS-SD as
// _gsender-pendant._tcp so desktops can find it without typing an IP.
//
// On Android, Node can't reliably own multicast (it needs a MulticastLock and
// competes with the system mdnsd), so instead we print a marker line that
// NodeService.kt picks up and hands to NsdManager. Everywhere else
// bonjour-service publishes directly.
import logger from "../../lib/logger";

const log = logger("service:remoteFileReceive:advertiser");

export const SERVICE_TYPE = "gsender-pendant";
const ANDROID_MARKER = "GSENDER_PENDANT_ADVERTISE";

const isAndroid = () => process.env.GSENDER_PLATFORM === "android";

class Advertiser {
	bonjour = null;

	service = null;

	publish({ port, id, name }) {
		this.unpublish();

		if (isAndroid()) {
			// Written straight to stdout - the logger may be redirected or
			// reformatted, and NodeService matches on the line prefix.
			process.stdout.write(
				`${ANDROID_MARKER} port=${port} id=${id} name=${encodeURIComponent(name)}\n`,
			);
			return;
		}

		try {
			// Required lazily so a missing optional dependency only disables
			// discovery rather than the whole receiver.
			const { Bonjour } = require("bonjour-service");
			this.bonjour = new Bonjour(undefined, (err) => {
				log.warn(`mDNS error: ${err?.message || err}`);
			});
			this.service = this.bonjour.publish({
				// Instance names must be unique on the LAN; the id suffix keeps
				// two tablets of the same model apart.
				name: `${name} (${id.slice(0, 4)})`,
				type: SERVICE_TYPE,
				port,
				txt: { id, v: "1" },
			});
			this.service.on("error", (err) => {
				log.warn(`mDNS publish failed: ${err?.message || err}`);
			});
			log.info(`Advertising ${SERVICE_TYPE} on port ${port}`);
		} catch (err) {
			log.warn(`mDNS advertising unavailable: ${err.message}`);
			this.bonjour = null;
			this.service = null;
		}
	}

	unpublish() {
		if (isAndroid()) {
			process.stdout.write(`${ANDROID_MARKER} off\n`);
			return;
		}
		if (this.bonjour) {
			const bonjour = this.bonjour;
			this.bonjour = null;
			this.service = null;
			bonjour.unpublishAll(() => bonjour.destroy());
		}
	}
}

const advertiser = new Advertiser();

export default advertiser;
