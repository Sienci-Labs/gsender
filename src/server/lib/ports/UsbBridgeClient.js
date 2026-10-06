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

// NDJSON client for the Android app's USB control channel (Kotlin side:
// android/.../pendant/usb/UsbControlChannel.kt). One JSON object per line,
// newline-framed, on a loopback TCP socket whose port the app passes as
// GSENDER_USB_CONTROL_PORT. Requests are correlated by an incrementing id;
// unsolicited lines with no "id" are "attached"/"detached"/"permission_denied"
// events, re-emitted as EventEmitter events of the same name.

import { EventEmitter } from "events";
import net from "net";
import logger from "../logger";

const log = logger("usb-bridge-client");

class UsbBridgeClient extends EventEmitter {
	constructor(port) {
		super();
		this.port = port;
		this.socket = null;
		this.buffer = "";
		this.nextId = 1;
		this.pending = new Map();
		this.connecting = null;
	}

	connect() {
		if (this.socket) {
			return Promise.resolve();
		}
		if (this.connecting) {
			return this.connecting;
		}
		this.connecting = new Promise((resolve, reject) => {
			const socket = net.connect({ host: "127.0.0.1", port: this.port });
			socket.setNoDelay(true);

			const onError = (err) => {
				this.connecting = null;
				reject(err);
			};
			socket.once("error", onError);
			socket.once("connect", () => {
				socket.removeListener("error", onError);
				socket.on("data", (chunk) => this._onData(chunk));
				socket.on("close", () => this._onClose());
				socket.on("error", (err) =>
					log.error(`USB control channel error: ${err}`),
				);
				this.socket = socket;
				this.connecting = null;
				resolve();
			});
		});
		return this.connecting;
	}

	_onClose() {
		this.socket = null;
		this.buffer = "";
		for (const { reject } of this.pending.values()) {
			reject(new Error("USB control channel closed"));
		}
		this.pending.clear();
	}

	_onData(chunk) {
		this.buffer += chunk.toString("utf8");
		let idx = this.buffer.indexOf("\n");
		while (idx >= 0) {
			const line = this.buffer.slice(0, idx);
			this.buffer = this.buffer.slice(idx + 1);
			if (line.trim()) {
				this._onLine(line);
			}
			idx = this.buffer.indexOf("\n");
		}
	}

	_onLine(line) {
		let msg;
		try {
			msg = JSON.parse(line);
		} catch (err) {
			log.error(`Malformed USB control message: ${line}`);
			return;
		}

		if (msg.event) {
			this.emit(msg.event, msg);
			return;
		}

		const pending = this.pending.get(msg.id);
		if (!pending) {
			return;
		}
		this.pending.delete(msg.id);
		if (msg.ok) {
			pending.resolve(msg);
		} else {
			pending.reject(new Error(msg.error || "usb_bridge_error"));
		}
	}

	request(op, fields = {}) {
		return this.connect().then(
			() =>
				new Promise((resolve, reject) => {
					const id = this.nextId++;
					this.pending.set(id, { resolve, reject });
					this.socket.write(
						`${JSON.stringify({ v: 1, id, op, ...fields })}\n`,
					);
				}),
		);
	}

	list() {
		return this.request("list").then((msg) => msg.ports || []);
	}

	open(path, settings) {
		return this.request("open", { path, ...settings });
	}

	close(path) {
		return this.request("close", { path });
	}
}

let singleton = null;

// Lazily created so importing this module has no effect until it's actually
// used - harmless to bundle into the desktop build too.
function getUsbBridgeClient() {
	if (!singleton) {
		singleton = new UsbBridgeClient(Number(process.env.GSENDER_USB_CONTROL_PORT));
	}
	return singleton;
}

export { getUsbBridgeClient };
export default UsbBridgeClient;
