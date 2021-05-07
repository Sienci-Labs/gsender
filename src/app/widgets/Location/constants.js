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

import constants from 'namespace-constants';

// Modal
export const {
    MODAL_NONE,
    MODAL_SETTINGS
} = constants('widgets/Axes', [
    'MODAL_NONE',
    'MODAL_SETTINGS'
]);

// Axes
export const DEFAULT_AXES = ['x', 'y', 'z'];

export const PRIMARY_COLOR = '#3e85c7'; // Light Blue
export const BORDER_COLOR = '#9CA3AF';
export const SECONDARY_COLOR = '#9ca3af'; // Grey (for disabled look)

export const XY_MAX = 300;
export const XY_MIN = 0.01;
export const Z_MAX = 30;
export const Z_MIN = 0.01;
export const FEEDRATE_MAX = 50000;
export const FEEDRATE_MIN = 50;
