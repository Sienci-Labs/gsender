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

// Normalize the value by bringing it within the range.
// If value is greater than max, max will be returned.
// If value is less than min, min will be returned.
// Otherwise, value is returned unaltered. Both ends of this range are inclusive.
export const limit = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

// Returns true if value is within the range, false otherwise.
// It defaults to inclusive on both ends of the range, but that can be changed by
// setting minExclusive and/or maxExclusive to a truthy value.
export const test = (
    value: number,
    min: number,
    max: number,
    minExclusive: number,
    maxExclusive: number,
): boolean => {
    return !(
        value < min ||
        value > max ||
        (maxExclusive && value === max) ||
        (minExclusive && value === min)
    );
};

export default {
    limit,
    test,
};
