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

// Active State
export const ACTIVE_STATE_IDLE = "Idle";
export const ACTIVE_STATE_RUN = "Run";
export const ACTIVE_STATE_HOLD = "Hold";
export const ACTIVE_STATE_DOOR = "Door";
export const ACTIVE_STATE_HOME = "Home";
export const ACTIVE_STATE_SLEEP = "Sleep";
export const ACTIVE_STATE_ALARM = "Alarm";
export const ACTIVE_STATE_CHECK = "Check";

// Modal groups shared by Grbl and grblHAL.
export const MODAL_GROUPS = {
	motion: {
		// Motion Mode (Defaults to G0)
		group: "motion",
		modes: ["G0", "G1", "G2", "G3", "G38.2", "G38.3", "G38.4", "G38.5", "G80"],
	},
	wcs: {
		// Work Coordinate System Select (Defaults to G54)
		group: "wcs",
		modes: ["G54", "G55", "G56", "G57", "G58", "G59"],
	},
	plane: {
		// Plane Select (Defaults to G17)
		group: "plane",
		modes: ["G17", "G18", "G19"],
	},
	units: {
		// Units Mode (Defaults to G21)
		group: "units",
		modes: ["G20", "G21"],
	},
	distance: {
		// Distance Mode (Defaults to G90)
		group: "distance",
		modes: ["G90", "G91"],
	},
	feedrate: {
		// Feed Rate Mode (Defaults to G94)
		group: "feedrate",
		modes: ["G93", "G94"],
	},
	program: {
		// Program Mode (Defaults to M0)
		group: "program",
		modes: ["M0", "M1", "M2", "M30"],
	},
	spindle: {
		// Spindle State (Defaults to M5)
		group: "spindle",
		modes: ["M3", "M4", "M5"],
	},
	coolant: {
		// Coolant State (Defaults to M9)
		group: "coolant",
		modes: ["M7", "M8", "M9"],
	},
};

// Alarms
// https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv
export const ALARMS = [
	{
		code: 1,
		message: "Hard limit",
		description:
			"Hard limit has been triggered. Machine position is likely lost due to sudden halt. Re-homing is highly recommended.",
	},
	{
		code: 2,
		message: "Soft limit",
		description:
			"Soft limit alarm. G-code motion target exceeds machine travel. Machine position retained. Alarm may be safely unlocked.",
	},
	{
		code: 3,
		message: "Abort during cycle",
		description:
			"Reset while in motion. Machine position is likely lost due to sudden halt. Re-homing is highly recommended.",
	},
	{
		code: 4,
		message: "Probe fail",
		description:
			"Probe fail. Probe is not in the expected initial state before starting probe cycle when G38.2 and G38.3 is not triggered and G38.4 and G38.5 is triggered.",
	},
	{
		code: 5,
		message: "Probe fail",
		description:
			"Probe fail. Probe did not contact the workpiece within the programmed travel for G38.2 and G38.4.",
	},
	{
		code: 6,
		message: "Homing fail",
		description: "Homing fail. The active homing cycle was reset.",
	},
	{
		code: 7,
		message: "Homing fail",
		description: "Homing fail. Safety door was opened during homing cycle.",
	},
	{
		code: 8,
		message: "Homing fail",
		description:
			"Homing fail. Pull off travel failed to clear limit switch. Try increasing pull-off setting or check wiring.",
	},
	{
		code: 9,
		message: "Homing fail",
		description:
			"Homing fail. Could not find limit switch within search distances. Try increasing max travel, decreasing pull-off distance, or check wiring.",
	},
];

export const HOMING_ALARM = {
	code: "Homing",
	message: "Homing required",
	description:
		"Homing must be run if limit switches and homing cycle is enabled in EEPROM",
};

export const SETTINGS_INPUT_TYPES = {
	NUMBER: "number",
	AXIS_MASK: "axis-mask",
	MASK_STATUS_REPORT: "mask-status-report",
	SWITCH: "switch",
};
