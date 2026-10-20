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

// grblHAL reports probe continuity with I/J/K letters in the Pn: field of both
// the regular (?/0x80) and complete (0x87) status reports:
//   - I/i: probe
//   - J/j: tool length sensor (TLS)
//   - K/k: alternate probe
// Capital means active, lowercase means no longer active. The state is sticky:
// a report without the letter (most regular reports) leaves it unchanged, so
// this returns only the keys the pin string actually mentions, to be merged
// over the previous state - see mergeProbeContinuity().
const PROBE_LETTERS = {
	I: "probe",
	J: "tls",
	K: "altProbe",
};

export const DEFAULT_PROBE_CONTINUITY = {
	probe: false,
	tls: false,
	altProbe: false,
};

export const getProbeContinuity = (pins = "") => {
	const update = {};
	Object.entries(PROBE_LETTERS).forEach(([letter, key]) => {
		if (pins.includes(letter)) {
			update[key] = true;
		} else if (pins.includes(letter.toLowerCase())) {
			update[key] = false;
		}
	});
	return update;
};

export const mergeProbeContinuity = (previous, update) => ({
	...DEFAULT_PROBE_CONTINUITY,
	...previous,
	...update,
});
