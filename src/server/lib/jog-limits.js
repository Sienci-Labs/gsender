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

import { determineMaxMovement, getAxisMaximumLocation } from "./homing";

// Fixed decimal places used when reporting travel limits, matching the
// precision the jog handlers have always used.
const FIXED = 2;

// Small margin so rounding in the firmware can never push a jog past the
// soft limit boundary. 1mm is not noticeable at jogging distances.
export const TRAVEL_OFFSET = 1;

/**
 * Remaining travel on a single axis before the soft limit is reached.
 *
 * This is the unified replacement for the two `calculateAxisValue` copies that
 * lived in GrblController and GrblHalController. Those two differed only in the
 * sign of their OFFSET constant, which cancels out everywhere except the
 * `position === 0` case - where the Grbl version dropped the safety margin
 * entirely. We keep the grblHAL behaviour, which applies the margin uniformly.
 *
 * @param {number} direction  1 or -1
 * @param {number} position   absolute machine position on this axis (mm)
 * @param {number} maxTravel  the axis max travel ($13x) (mm)
 * @returns {number} signed remaining travel in mm
 */
export function axisTravelLimit({
	direction,
	position,
	maxTravel,
	offset = TRAVEL_OFFSET,
}) {
	const travel = Number(maxTravel);

	if (position === 0) {
		return Number(((travel - offset) * direction).toFixed(FIXED));
	}

	if (direction === 1) {
		return Number((position - offset).toFixed(FIXED));
	}

	return Number((-1 * (travel - position - offset)).toFixed(FIXED));
}

/**
 * Convert the reported machine position into millimetres.
 *
 * Returns a *copy* - the controller's live status object must never be mutated
 * here, since doing so corrupts the reported position until the next status
 * report arrives.
 *
 * @param {object} mpos      machine position as reported by the firmware
 * @param {boolean} inInches true when the firmware reports in inches ($13 = 1)
 */
export function normalizeMposToMetric(mpos = {}, inInches = false) {
	return Object.keys(mpos).reduce((acc, axis) => {
		const value = Number(mpos[axis]);
		acc[axis] = inInches ? Number((value * 25.4).toFixed(FIXED)) : value;
		return acc;
	}, {});
}

/**
 * Signed remaining travel per axis for a jog in the given direction.
 *
 * Every axis is `Infinity` when soft limits are not in play, which is what lets
 * the jog streamer run indefinitely instead of fabricating an arbitrarily large
 * single move. The A axis is always unbounded - it has no max travel setting,
 * and the previous Grbl implementation neglected it entirely, so a continuous A
 * jog with soft limits enabled moved exactly 1mm and stopped.
 *
 * @param {object}  direction         { X, Y, Z, A } each 1 or -1 (or absent)
 * @param {object}  settings          the raw $$ map
 * @param {object}  mpos              machine position (not mutated)
 * @param {boolean} homingFlagSet     whether machine zero is known
 * @param {boolean} softLimitsEnabled Grbl: $20==='1'; grblHAL: $20==='1' && $40==='0'
 * @returns {object} { X, Y, Z, A } signed remaining travel in mm
 */
export function computeTravelBudget({
	direction = {},
	settings = {},
	mpos = {},
	homingFlagSet = false,
	softLimitsEnabled = false,
}) {
	const budget = { X: Infinity, Y: Infinity, Z: Infinity, A: Infinity };

	if (!softLimitsEnabled) {
		return budget;
	}

	const { $13, $23 } = settings;
	const $130 = Number(settings.$130);
	const $131 = Number(settings.$131);
	const $132 = Number(settings.$132);

	const position = normalizeMposToMetric(mpos, $13 === "1");

	const maxTravel = { X: $130, Y: $131, Z: $132 };

	if (homingFlagSet) {
		const [xMaxLoc, yMaxLoc] = getAxisMaximumLocation($23);
		const maxLocation = { X: xMaxLoc, Y: yMaxLoc };

		["X", "Y"].forEach((axis) => {
			if (!direction[axis]) {
				return;
			}
			budget[axis] = Number(
				determineMaxMovement(
					Math.abs(position[axis.toLowerCase()]),
					Math.sign(direction[axis]),
					maxLocation[axis],
					maxTravel[axis],
				),
			);
		});
	} else {
		["X", "Y"].forEach((axis) => {
			if (!direction[axis]) {
				return;
			}
			budget[axis] = axisTravelLimit({
				direction: Math.sign(direction[axis]),
				position: Math.abs(position[axis.toLowerCase()]),
				maxTravel: maxTravel[axis],
			});
		});
	}

	// Z is bounded by $132 regardless of the homing flag - its limit switch is
	// at the top of travel on every supported machine.
	if (direction.Z) {
		budget.Z = axisTravelLimit({
			direction: Math.sign(direction.Z),
			position: Math.abs(position.z),
			maxTravel: maxTravel.Z,
		});
	}

	return budget;
}
