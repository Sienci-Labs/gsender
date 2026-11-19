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

/**
 * Builds the `settings` object exposed to macros, keyed by EEPROM number
 * ("$130") so macros can use settings.$130 ($130 is a valid identifier, so
 * no nested brackets are needed inside [...] expressions). Firmware reports
 * every value as a string; numeric ones are converted so arithmetic like
 * [settings.$130 - 5] works instead of string-concatenating on `+`.
 * Non-numeric values (e.g. grblHAL hostname/IP settings) stay as strings.
 */
const getMacroSettings = (firmwareSettings = {}) => {
	const result = {};
	Object.entries(firmwareSettings || {}).forEach(([key, value]) => {
		const trimmed = typeof value === "string" ? value.trim() : value;
		const num = Number(trimmed);
		result[key] =
			trimmed !== "" && trimmed !== null && !Number.isNaN(num) ? num : value;
	});
	return result;
};

export default getMacroSettings;
