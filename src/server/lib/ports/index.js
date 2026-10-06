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

import AndroidPortProvider from "./AndroidPortProvider";
import DesktopPortProvider from "./DesktopPortProvider";

// Runtime branch, not a build-time alias: NodeService.kt only sets
// GSENDER_USB_CONTROL_PORT on Android, so this is the same server.js bundle
// deciding which transport to use based on where it's actually running.
function getPortProvider() {
	return process.env.GSENDER_USB_CONTROL_PORT
		? AndroidPortProvider
		: DesktopPortProvider;
}

export { getPortProvider };
