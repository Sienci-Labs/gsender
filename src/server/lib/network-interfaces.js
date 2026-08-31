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
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import dgram from "dgram";
import os from "os";

// Adapter names that never carry traffic another device on the shop network can
// reach: hypervisors, container bridges, VPN/overlay networks and capture drivers.
const VIRTUAL_NAME =
	/vmware|virtualbox|vbox|hyper-?v|vethernet|wsl|docker|tailscale|zerotier|utun|npcap|loopback|bridge|veth|tun\d|tap\d/i;
const WIFI_NAME = /wi-?fi|wlan|wireless|airport/i;
const ETHERNET_NAME = /ethernet|^en\d|^eth\d|lan/i;

const KIND_LABELS = {
	wifi: "Wi-Fi",
	ethernet: "Ethernet",
	virtual: "Virtual adapter",
	loopback: "This computer only",
	unknown: "Network",
};

// Sort order within the dropdown - lower comes first.
const KIND_RANK = {
	wifi: 0,
	ethernet: 1,
	unknown: 2,
	virtual: 3,
	loopback: 4,
};

// Self-assigned addresses handed out when DHCP fails - the adapter is up but
// there is no working network behind it.
const isAPIPA = (address) => address.startsWith("169.254.");

const isPrivate = (address) =>
	/^192\.168\./.test(address) ||
	/^10\./.test(address) ||
	/^172\.(1[6-9]|2\d|3[01])\./.test(address);

const classify = (name, entry) => {
	if (entry.internal) {
		return "loopback";
	}
	if (VIRTUAL_NAME.test(name)) {
		return "virtual";
	}
	if (WIFI_NAME.test(name)) {
		return "wifi";
	}
	if (ETHERNET_NAME.test(name)) {
		return "ethernet";
	}
	return "unknown";
};

/*
 * Ask the operating system which local address it would use to reach the wider
 * internet - this is the address on whichever adapter holds the default route,
 * which in practice is the one a phone on the same network can reach.
 *
 * Connecting a UDP socket to an IP literal sends no packets and performs no DNS
 * lookup; the kernel only resolves the route, so this is instant and invisible
 * to firewalls. Resolves null when there is no route (offline machine).
 */
export const getDefaultRouteAddress = (timeout = 500) =>
	new Promise((resolve) => {
		let socket = null;
		let timer = null;

		const finish = (address) => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			if (socket) {
				try {
					socket.close();
				} catch (err) {
					// Already closed or never bound - nothing to clean up.
				}
				socket = null;
			}
			resolve(address);
		};

		try {
			socket = dgram.createSocket("udp4");
			socket.on("error", () => finish(null));
			timer = setTimeout(() => finish(null), timeout);
			socket.connect(53, "8.8.8.8", () => {
				try {
					finish(socket.address().address);
				} catch (err) {
					finish(null);
				}
			});
		} catch (err) {
			finish(null);
		}
	});

// Collect every IPv4 address on the machine, one entry per unique address,
// keeping the best-classified interface when the same address appears twice.
const collectAddresses = () => {
	const interfaces = os.networkInterfaces();
	const byAddress = new Map();

	for (const name of Object.keys(interfaces)) {
		for (const entry of interfaces[name] || []) {
			// Node <18 reports the family as a number, newer versions as a string.
			if (entry.family !== "IPv4" && entry.family !== 4) {
				continue;
			}

			const kind = classify(name, entry);
			const existing = byAddress.get(entry.address);
			if (existing && KIND_RANK[existing.kind] <= KIND_RANK[kind]) {
				continue;
			}

			byAddress.set(entry.address, {
				address: entry.address,
				iface: name,
				kind,
				label: KIND_LABELS[kind],
				usable:
					kind !== "loopback" && kind !== "virtual" && !isAPIPA(entry.address),
				recommended: false,
			});
		}
	}

	return [...byAddress.values()];
};

/*
 * Best guess at the address to host on when the default route probe comes up
 * empty - a shop machine on a LAN with no internet access, for instance.
 */
const pickFallback = (addresses) => {
	const candidates = addresses.filter((entry) => entry.usable);
	if (candidates.length === 0) {
		return null;
	}

	const score = (entry) => {
		let value = KIND_RANK[entry.kind];
		if (!isPrivate(entry.address)) {
			value += 10;
		} else if (/^192\.168\./.test(entry.address)) {
			value += 0;
		} else if (/^10\./.test(entry.address)) {
			value += 1;
		} else {
			value += 2;
		}
		return value;
	};

	return candidates.reduce((best, entry) =>
		score(entry) < score(best) ? entry : best,
	).address;
};

/*
 * Every IPv4 address on this machine, annotated for the wireless control
 * address picker and sorted so the address most likely to work comes first.
 */
export const listNetworkAddresses = async () => {
	const addresses = collectAddresses();

	const routed = await getDefaultRouteAddress();
	const recommended = addresses.some(
		(entry) => entry.address === routed && entry.usable,
	)
		? routed
		: pickFallback(addresses);

	for (const entry of addresses) {
		entry.recommended = entry.address === recommended;
	}

	return addresses.sort((a, b) => {
		if (a.recommended !== b.recommended) {
			return a.recommended ? -1 : 1;
		}
		if (a.usable !== b.usable) {
			return a.usable ? -1 : 1;
		}
		if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) {
			return KIND_RANK[a.kind] - KIND_RANK[b.kind];
		}
		return a.address.localeCompare(b.address);
	});
};

export default listNetworkAddresses;
