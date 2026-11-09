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

// Desktop side of Send to Pendant: finds pendants advertising
// _gsender-pendant._tcp on the LAN and keeps the keys they've issued us.
//
// The desktop never listens on the LAN for this - pairing works by the
// desktop claiming a nonce the pendant scanned off our QR code (or the
// pendant's on-screen code) against the pendant's own receiver.
import axios from "axios";
import crypto from "crypto";
import os from "os";
import logger from "../../lib/logger";
import CNCEngine from "../cncengine";
import config from "../configstore";
import { SERVICE_TYPE } from "../remoteFileReceive/advertiser";

const log = logger("service:pendantDiscovery");

const CONFIG_KEY = "pendantPairing";
const IDLE_STOP_MS = 2 * 60 * 1000;
const QR_TTL_MS = 2 * 60 * 1000;
const CLAIM_TIMEOUT_MS = 3000;
const PROBE_TIMEOUT_MS = 1500;
const SCAN_INTERVAL_MS = 15000;
const DEFAULT_PORT = 8010;

const pickIPv4 = (service) => {
	const ipv4 = (service.addresses || []).find((addr) =>
		/^\d{1,3}(\.\d{1,3}){3}$/.test(addr),
	);
	return ipv4 || service.referer?.address || null;
};

// Every other address on this computer's /24 networks, on the default
// receiver port. Used when mDNS finds nothing: another app on this computer
// (e.g. gCAM) can be bound to 5353 and receive the tablet's unicast replies
// instead of us, and plenty of tablets and mesh routers drop multicast.
const subnetTargets = () => {
	const targets = [];
	for (const addresses of Object.values(os.networkInterfaces())) {
		for (const addr of addresses || []) {
			if (addr.family !== "IPv4" || addr.internal) {
				continue;
			}
			const prefix = addr.address.split(".").slice(0, 3).join(".");
			for (let i = 1; i < 255; i++) {
				const host = `${prefix}.${i}`;
				if (host !== addr.address) {
					targets.push({ host, port: DEFAULT_PORT });
				}
			}
		}
	}
	return targets;
};

const probeStatus = async ({ host, port }) => {
	try {
		const res = await axios.get(`http://${host}:${port}/pendant/status`, {
			timeout: PROBE_TIMEOUT_MS,
		});
		const status = res.data;
		if (status?.status !== "ready" || !status.deviceId) {
			return null;
		}
		return {
			id: status.deviceId,
			name: status.deviceName || "Pendant",
			host,
			port,
		};
	} catch {
		return null;
	}
};

class PendantDiscovery {
	bonjour = null;

	browser = null;

	scanning = null;

	lastScanAt = 0;

	idleTimer = null;

	discovered = new Map();

	activeQr = null;

	getDesktopId() {
		const key = `${CONFIG_KEY}.desktopId`;
		let id = config.get(key, null);
		if (!id) {
			id = crypto.randomUUID();
			config.set(key, id);
		}
		return id;
	}

	getDesktopName() {
		return os.hostname();
	}

	getPaired() {
		return config.get(`${CONFIG_KEY}.tablets`, {});
	}

	savePaired(tablets) {
		config.set(`${CONFIG_KEY}.tablets`, tablets);
	}

	// Starts browsing if needed and pushes the idle shutdown back. Browsing
	// only runs while someone has the Send to Pendant dialog open.
	touch() {
		if (!this.browser) {
			this.startBrowsing();
		}
		clearTimeout(this.idleTimer);
		this.idleTimer = setTimeout(() => this.stopBrowsing(), IDLE_STOP_MS);
	}

	startBrowsing() {
		try {
			const { Bonjour } = require("bonjour-service");
			this.bonjour = new Bonjour(undefined, (err) => {
				log.warn(`mDNS error: ${err?.message || err}`);
			});
			this.browser = this.bonjour.find({ type: SERVICE_TYPE });
			this.browser.on("up", (service) => this.handleUp(service));
			this.browser.on("down", (service) => this.handleDown(service));
			log.info(`Browsing for ${SERVICE_TYPE}`);
		} catch (err) {
			log.warn(`mDNS discovery unavailable: ${err.message}`);
			this.bonjour = null;
			this.browser = null;
		}
	}

	stopBrowsing() {
		clearTimeout(this.idleTimer);
		this.idleTimer = null;
		if (this.browser) {
			this.browser.stop();
			this.browser = null;
		}
		if (this.bonjour) {
			this.bonjour.destroy();
			this.bonjour = null;
		}
		this.discovered.clear();
	}

	handleUp(service) {
		const id = service.txt?.id;
		const host = pickIPv4(service);
		if (!id || !host) {
			return;
		}
		// The advertised instance name carries an id suffix for uniqueness;
		// strip it for display.
		const name = String(service.name || "Pendant").replace(
			/\s\([0-9a-f]{4}\)$/i,
			"",
		);
		this.remember({ id, name, host, port: service.port }, false);
		this.emitList();
	}

	remember({ id, name, host, port }, viaScan) {
		this.discovered.set(id, { id, name, host, port, viaScan });

		// Follow a paired tablet to its new address after a DHCP change.
		const paired = this.getPaired();
		if (
			paired[id] &&
			(paired[id].lastHost !== host || paired[id].lastPort !== port)
		) {
			paired[id] = { ...paired[id], lastHost: host, lastPort: port };
			this.savePaired(paired);
		}
	}

	// Fallback discovery: asks every address on the local /24 for the
	// receiver's status page. Throttled; resolves once the sweep finishes.
	scan() {
		if (this.scanning || Date.now() - this.lastScanAt < SCAN_INTERVAL_MS) {
			return this.scanning ?? Promise.resolve();
		}
		this.lastScanAt = Date.now();
		this.scanning = Promise.all(subnetTargets().map(probeStatus))
			.then((results) => {
				const found = new Map();
				for (const tablet of results) {
					if (tablet) {
						found.set(tablet.id, tablet);
					}
				}
				for (const [id, entry] of this.discovered) {
					if (entry.viaScan && !found.has(id)) {
						this.discovered.delete(id);
					}
				}
				// mDNS results win; they carry the advertised port.
				for (const tablet of found.values()) {
					const existing = this.discovered.get(tablet.id);
					if (!existing || existing.viaScan) {
						this.remember(tablet, true);
					}
				}
				this.emitList();
			})
			.finally(() => {
				this.scanning = null;
			});
		return this.scanning;
	}

	// Checks each paired tablet at its last known address. mDNS alone can
	// leave a reachable tablet looking offline (e.g. after a restart while
	// another app owns the 5353 replies), and that's one request per tablet.
	async probePaired() {
		const paired = this.getPaired();
		const results = await Promise.all(
			Object.entries(paired)
				.filter(([, entry]) => entry.lastHost)
				.map(async ([id, entry]) => ({
					id,
					host: entry.lastHost,
					tablet: await probeStatus({
						host: entry.lastHost,
						port: entry.lastPort || DEFAULT_PORT,
					}),
				})),
		);
		for (const { id, host, tablet } of results) {
			const existing = this.discovered.get(id);
			if (tablet?.id === id) {
				if (!existing || existing.viaScan) {
					this.remember(tablet, true);
				}
			} else if (existing?.viaScan && existing.host === host) {
				// Only drop it if a scan hasn't since found it somewhere else.
				this.discovered.delete(id);
			}
		}
		this.emitList();
	}

	// What the Send to Pendant dialog polls: keeps mDNS alive and verifies
	// paired tablets over HTTP, pushing updates via pendant:discovered.
	discover() {
		this.touch();
		void this.probePaired();
		if (![...this.discovered.values()].some((t) => !t.viaScan)) {
			void this.scan();
		}
		return this.list();
	}

	handleDown(service) {
		const id = service.txt?.id;
		if (id && this.discovered.delete(id)) {
			this.emitList();
		}
	}

	emitList() {
		CNCEngine.emit("pendant:discovered", this.list());
	}

	// Paired tablets (online or not) plus any discovered, unpaired ones. Keys
	// are included because the renderer uploads to the tablet directly; this
	// is only ever served on the loopback-only app origin.
	list() {
		const paired = this.getPaired();
		const tablets = Object.entries(paired).map(([id, entry]) => {
			const live = this.discovered.get(id);
			return {
				id,
				name: live?.name || entry.name,
				host: live?.host || entry.lastHost,
				port: live?.port || entry.lastPort,
				key: entry.key,
				paired: true,
				online: Boolean(live),
			};
		});
		for (const [id, { viaScan, ...live }] of this.discovered) {
			if (!paired[id]) {
				tablets.push({ ...live, paired: false, online: true });
			}
		}
		return {
			desktopId: this.getDesktopId(),
			browsing: Boolean(this.browser),
			tablets,
		};
	}

	createQr() {
		const nonce = crypto.randomBytes(16).toString("base64url");
		const desktopId = this.getDesktopId();
		const desktopName = this.getDesktopName();
		void this.scan();
		this.activeQr ={ nonce, expiresAt: Date.now() + QR_TTL_MS };
		const params = new URLSearchParams({
			v: "1",
			n: nonce,
			d: desktopId,
			name: desktopName,
		});
		return {
			nonce,
			expiresAt: this.activeQr.expiresAt,
			payload: `gsender-pendant://pair?${params.toString()}`,
		};
	}

	async claimAt(host, port, body) {
		const res = await axios.post(
			`http://${host}:${port}/pendant/pair/claim`,
			body,
			{ timeout: CLAIM_TIMEOUT_MS },
		);
		const { key, deviceId, deviceName } = res.data || {};
		if (!key || !deviceId) {
			throw new Error("Malformed pairing response");
		}
		const paired = this.getPaired();
		paired[deviceId] = {
			name: deviceName || "Pendant",
			key,
			lastHost: host,
			lastPort: port,
			pairedAt: Date.now(),
		};
		this.savePaired(paired);
		this.emitList();
		return { id: deviceId, name: paired[deviceId].name, host, port };
	}

	// QR flow: tries the active nonce against every discovered tablet (and an
	// optional manually entered address). Resolves to the paired tablet, or
	// null if nobody has scanned it yet.
	async claimNonce(nonce, manual) {
		if (
			!this.activeQr ||
			this.activeQr.nonce !== nonce ||
			this.activeQr.expiresAt <= Date.now()
		) {
			const err = new Error("Pairing QR has expired");
			err.status = 410;
			throw err;
		}
		// Nothing answered mDNS: keep sweeping the subnet while the QR is up.
		if (![...this.discovered.values()].some((t) => !t.viaScan)) {
			void this.scan();
		}
		const body = {
			nonce,
			desktopId: this.getDesktopId(),
			desktopName: this.getDesktopName(),
		};
		const targets = [...this.discovered.values()].map(({ host, port }) => ({
			host,
			port,
		}));
		if (manual?.host) {
			targets.push(manual);
		}
		const results = await Promise.allSettled(
			targets.map(({ host, port }) => this.claimAt(host, port, body)),
		);
		const hit = results.find((r) => r.status === "fulfilled");
		if (hit) {
			this.activeQr = null;
			return hit.value;
		}
		return null;
	}

	// Manual flow: exchanges the tablet's on-screen code for a key.
	claimCode(host, port, code) {
		return this.claimAt(host, port, {
			code,
			desktopId: this.getDesktopId(),
			desktopName: this.getDesktopName(),
		});
	}

	forget(id) {
		const paired = this.getPaired();
		if (!paired[id]) {
			return false;
		}
		delete paired[id];
		this.savePaired(paired);
		this.emitList();
		return true;
	}
}

const pendantDiscovery = new PendantDiscovery();

export default pendantDiscovery;
