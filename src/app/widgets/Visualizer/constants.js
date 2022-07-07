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

export const {
    MODAL_WATCH_DIRECTORY,
    NOTIFICATION_PROGRAM_ERROR,
    NOTIFICATION_M0_PROGRAM_PAUSE,
    NOTIFICATION_M1_PROGRAM_PAUSE,
    NOTIFICATION_M2_PROGRAM_END,
    NOTIFICATION_M30_PROGRAM_END,
    NOTIFICATION_M6_TOOL_CHANGE,
    NOTIFICATION_M109_SET_EXTRUDER_TEMPERATURE,
    NOTIFICATION_M190_SET_HEATED_BED_TEMPERATURE
} = constants('widgets/Visualizer', [
    'MODAL_WATCH_DIRECTORY',
    'NOTIFICATION_PROGRAM_ERROR',
    'NOTIFICATION_M0_PROGRAM_PAUSE',
    'NOTIFICATION_M1_PROGRAM_PAUSE',
    'NOTIFICATION_M2_PROGRAM_END',
    'NOTIFICATION_M30_PROGRAM_END',
    'NOTIFICATION_M6_TOOL_CHANGE',
    'NOTIFICATION_M109_SET_EXTRUDER_TEMPERATURE',
    'NOTIFICATION_M190_SET_HEATED_BED_TEMPERATURE'
]);

export const CAMERA_MODE_PAN = 'pan';
export const CAMERA_MODE_ROTATE = 'rotate';

export const PRIMARY_COLOR = '#3E85C7'; // Light Blue
export const BORDER_COLOR = '#9CA3AF';
export const SECONDARY_COLOR = '#6F7376'; // Grey (for disabled look)

export const DARK_THEME_VALUES = {
    backgroundColor: '#111827', //Navy Blue
    gridColor: '#77a9d7', // Turqoise / Light Blue
    xAxisColor: '#df3b3b', //Indian Red
    yAxisColor: '#06b881', //Light Green
    zAxisColor: '#295d8d', //Light Green
    limitColor: '#5191cc', //Indian Red
    cuttingCoordinateLines: '#fff', //White
    joggingCoordinateLines: '#0ef6ae', // Light Green
    G0Color: '#0ef6ae', // Light Green
    G1Color: '#3e85c7', // Light Blue
    G2Color: '#3e85c7', // Light Blue
    G3Color: '#3e85c7', // Light Blue
};

export const LIGHT_THEME_VALUES = {
    backgroundColor: '#e5e7eb', //Navy Blue
    gridColor: '#000000', // Turqoise / Light Blue
    xAxisColor: '#df3b3b', //Indian Red
    yAxisColor: '#06b881', //Light Green
    zAxisColor: '#295d8d', //Light Green
    limitColor: '#5191cc', //Indian Red
    cuttingCoordinateLines: '#000000',
    joggingCoordinateLines: '#0ef6ae', // Light Green
    G0Color: '#0ef6ae', // Light Green
    G1Color: '#111827', // Dark Blue
    G2Color: '#111827', // Dark Blue
    G3Color: '#111827', // Dark Blue
};

export const DARK_THEME = 'Dark';
export const LIGHT_THEME = 'Light';
export const CUST_DARK_THEME = 'Custom Dark';
export const CUST_LIGHT_THEME = 'Custom Light';

export const BACKGROUND_PART = 'Background';
export const GRID_PART = 'Grid';
export const XAXIS_PART = 'X Axis';
export const YAXIS_PART = 'Y Axis';
export const ZAXIS_PART = 'Z Axis';
export const LIMIT_PART = 'Limit';
export const CUTTING_PART = 'Cutting Coordinates Lines';
export const JOGGING_PART = 'Jogging Coordinates Lines';
export const G0_PART = 'G0';
export const G1_PART = 'G1';
export const G2_PART = 'G2';
export const G3_PART = 'G3';
