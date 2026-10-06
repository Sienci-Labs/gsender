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

import { getUsbBridgeClient } from "./UsbBridgeClient";

// Normalizes the Kotlin control channel's port shape to what CNCEngine.js's
// "list" handler already expects from SerialPort.list() on desktop:
// {path, manufacturer, vendorId, productId}. "path" is opaque
// (usb:<vid>:<pid>:<android deviceName>); open()/close() pass it straight
// back to the control channel unchanged.
function list() {
	return getUsbBridgeClient()
		.list()
		.then((ports) =>
			ports.map((p) => ({
				path: p.path,
				manufacturer: p.manufacturer,
				vendorId: p.vendorId,
				productId: p.productId,
			})),
		);
}

export default { list };
