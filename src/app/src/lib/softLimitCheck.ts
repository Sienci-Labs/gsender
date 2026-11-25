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
 * Pure soft-limit envelope check: does the loaded file's bounding box, placed
 * at the current work zero, fit inside the machine's soft-limit travel?
 *
 * Kept free of store/redux imports so it can be unit tested directly; see
 * softLimitState.ts for the wrapper that reads live controller state.
 */

export type SoftLimitAxis = 'X' | 'Y' | 'Z';
export type SoftLimitDirection = '+' | '-';

export interface SoftLimitViolation {
    axis: SoftLimitAxis;
    direction: SoftLimitDirection;
    /** Distance (mm) the toolpath extends past the limit. */
    overBy: number;
}

export interface SoftLimitCheckInput {
    /** File bounding box in work coordinates (mm). */
    bbox: {
        min: { x: number; y: number; z: number };
        max: { x: number; y: number; z: number };
    };
    /** Work coordinate offset (mm): wpos = mpos - wco. */
    wco: { x: number; y: number; z: number };
    /** Max travel per axis ($130/$131/$132), mm. Sign is ignored. */
    maxTravel: { x: number; y: number; z: number };
    /** Homing direction invert mask ($23). */
    homingDirMask: number;
    /** Machine origin is forced to the home position (grbl HOMING_FORCE_SET_ORIGIN / grblHAL $22 bit 3). */
    forceSetOrigin: boolean;
}

// Ignore sub-hundredth overruns — float noise and controller rounding.
const EPSILON = 0.01;

const AXES: { key: 'x' | 'y' | 'z'; label: SoftLimitAxis; bit: number }[] = [
    { key: 'x', label: 'X', bit: 0 },
    { key: 'y', label: 'Y', bit: 1 },
    { key: 'z', label: 'Z', bit: 2 },
];

/**
 * Machine-coordinate travel envelope for one axis, mirroring grbl's
 * system_check_travel_limits(): without forced origin the envelope is always
 * [-max, 0]; with forced origin, axes homing toward negative ($23 bit set)
 * get [0, max] instead.
 */
export function getAxisMachineEnvelope(
    maxTravel: number,
    homesNegative: boolean,
    forceSetOrigin: boolean,
): { min: number; max: number } {
    const travel = Math.abs(maxTravel);
    if (forceSetOrigin && homesNegative) {
        return { min: 0, max: travel };
    }
    return { min: -travel, max: 0 };
}

export function computeSoftLimitViolations(
    input: SoftLimitCheckInput,
): SoftLimitViolation[] {
    const { bbox, wco, maxTravel, homingDirMask, forceSetOrigin } = input;
    const violations: SoftLimitViolation[] = [];

    AXES.forEach(({ key, label, bit }) => {
        const travel = Number(maxTravel[key]);
        if (!Number.isFinite(travel) || travel === 0) {
            return;
        }
        // eslint-disable-next-line no-bitwise
        const homesNegative = (Number(homingDirMask) & (1 << bit)) !== 0;
        const envelope = getAxisMachineEnvelope(
            travel,
            homesNegative,
            forceSetOrigin,
        );
        const offset = Number(wco[key]) || 0;
        const workMin = envelope.min - offset;
        const workMax = envelope.max - offset;

        const fileMin = Number(bbox.min[key]);
        const fileMax = Number(bbox.max[key]);

        if (Number.isFinite(fileMin) && fileMin < workMin - EPSILON) {
            violations.push({
                axis: label,
                direction: '-',
                overBy: workMin - fileMin,
            });
        }
        if (Number.isFinite(fileMax) && fileMax > workMax + EPSILON) {
            violations.push({
                axis: label,
                direction: '+',
                overBy: fileMax - workMax,
            });
        }
    });

    return violations;
}
