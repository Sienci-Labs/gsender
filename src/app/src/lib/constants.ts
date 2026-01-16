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

export const modifierKeys = ['shift', 'alt', 'ctrl', 'meta'];

export const MAX_TERMINAL_INPUT_ARRAY_SIZE = 300;

export const TOUCHPLATE_TYPE_STANDARD = 'Standard Block';
export const TOUCHPLATE_TYPE_AUTOZERO = 'AutoZero';
export const TOUCHPLATE_TYPE_ZERO = 'Z Probe';
export const TOUCHPLATE_TYPE_3D = '3D Probe';
export const TOUCHPLATE_TYPE_BITZERO = 'BitZero';
export const TOUCHPLATE_TYPES = {
    TOUCHPLATE_TYPE_STANDARD: 'Standard Block',
    TOUCHPLATE_TYPE_AUTOZERO: 'AutoZero',
    TOUCHPLATE_TYPE_ZERO: 'Z Probe',
    TOUCHPLATE_TYPE_3D: '3D Probe',
    TOUCHPLATE_TYPE_BITZERO: 'BitZero',
};

export const PROBE_TYPE_AUTO = 'Auto';
export const PROBE_TYPE_TIP = 'Tip';
export const PROBE_TYPE_DIAMETER = 'Diameter';
export const PROBE_TYPES = {
    PROBE_TYPE_AUTO: 'Auto',
    PROBE_TYPE_TIP: 'Tip',
    PROBE_TYPE_DIAMETER: 'Diameter',
};

export const END_MILL = 'End Mill';
export const DRILL = 'Drill';
