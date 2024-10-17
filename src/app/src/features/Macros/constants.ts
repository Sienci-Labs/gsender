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

export const MODAL_NONE = 'widgets/macro/MODAL_NONE' as const;
export const MODAL_ADD_MACRO = 'widgets/macro/MODAL_ADD_MACRO' as const;
export const MODAL_EDIT_MACRO = 'widgets/macro/MODAL_EDIT_MACRO' as const;
export const MODAL_RUN_MACRO = 'widgets/macro/MODAL_RUN_MACRO' as const;
export const MODAL_MACRO_FORM = 'widgets/macro/MODAL_MACRO_FORM' as const;

export const MACRO_VARIABLES = [
    { text: '%wait', group: 'Wait until the planner queue is empty' },
    {
        text: '%global.tool = Number(tool) || 0\n',
        group: 'User-defined global variables',
    },
    {
        text: '(tool=[global.tool])\n',
        group: 'Display a global variable using an inline comment',
    },
    {
        text: '%X0=posx,Y0=posy,Z0=posz\n',
        group: 'Keep a backup of current work position',
    },
    { text: 'G0 X[X0] Y[Y0]\n', group: 'Go to previous work position' },
    { text: 'G0 Z[Z0]\n', group: 'Go to previous work position' },
    {
        text: '%prevTool = Number(global.tool) || 0, global.tool = tool\n',
        group: 'Tool change',
    },
    { text: '%WCS=modal.wcs\n', group: 'Save modal state' },
    { text: '%PLANE=modal.plane\n', group: 'Save modal state' },
    { text: '%UNITS=modal.units\n', group: 'Save modal state' },
    { text: '%DISTANCE=modal.distance\n', group: 'Save modal state' },
    { text: '%FEEDRATE=modal.feedrate\n', group: 'Save modal state' },
    { text: '%SPINDLE=modal.spindle\n', group: 'Save modal state' },
    { text: '%COOLANT=modal.coolant\n', group: 'Save modal state' },
    {
        text: '[WCS] [PLANE] [UNITS] [DISTANCE] [FEEDRATE] [SPINDLE] [COOLANT]\n',
        group: 'Restore modal state',
    },
    { text: '[posx]', group: 'Current work position' },
    { text: '[posy]', group: 'Current work position' },
    { text: '[posz]', group: 'Current work position' },
    { text: '[posa]', group: 'Current work position' },
    {
        text: '%xmin=0,xmax=100,ymin=0,ymax=100,zmin=0,zmax=50\n',
        group: 'Set bounding box',
    },
    {
        text: '$#\n%wait',
        group: 'Request current Parameters - must do before using parameters',
    },
    { text: '%PROBE_X=params.PRB.x\n', group: 'Get current Parameters' },
    { text: '%PROBE_Y=params.PRB.y\n', group: 'Get current Parameters' },
    { text: '%PROBE_Z=params.PRB.z\n', group: 'Get current Parameters' },
    { text: '%G54_Z=params.G54.z\n', group: 'Get current Parameters' },
    { text: '%G57_Z=params.G57.z\n', group: 'Get current Parameters' },
    { text: '%TOOL_OFFSET=params.TLO\n', group: 'Get current Parameters' },
];

export type ModalType =
    | typeof MODAL_NONE
    | typeof MODAL_ADD_MACRO
    | typeof MODAL_EDIT_MACRO
    | typeof MODAL_RUN_MACRO
    | typeof MODAL_MACRO_FORM;
