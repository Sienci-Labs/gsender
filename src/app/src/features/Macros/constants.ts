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

import { tk } from 'app/i18n';

export const MODAL_NONE = 'widgets/macro/MODAL_NONE' as const;
export const MODAL_ADD_MACRO = 'widgets/macro/MODAL_ADD_MACRO' as const;
export const MODAL_EDIT_MACRO = 'widgets/macro/MODAL_EDIT_MACRO' as const;
export const MODAL_RUN_MACRO = 'widgets/macro/MODAL_RUN_MACRO' as const;
export const MODAL_MACRO_FORM = 'widgets/macro/MODAL_MACRO_FORM' as const;

export const MACRO_VARIABLES = [
    {
        text: '%wait',
        group: tk('workspace:macros.variableGroups.waitForPlanner'),
    },
    {
        text: '%global.tool = Number(tool) || 0\n',
        group: tk('workspace:macros.variableGroups.globalVariables'),
    },
    {
        text: '(tool=[global.tool])\n',
        group: tk('workspace:macros.variableGroups.displayGlobalVariable'),
    },
    {
        text: '%X0=posx,Y0=posy,Z0=posz\n',
        group: tk('workspace:macros.variableGroups.backupWorkPosition'),
    },
    {
        text: 'G0 X[X0] Y[Y0]\n',
        group: tk('workspace:macros.variableGroups.previousWorkPosition'),
    },
    {
        text: 'G0 Z[Z0]\n',
        group: tk('workspace:macros.variableGroups.previousWorkPosition'),
    },
    {
        text: '%prevTool = Number(global.tool) || 0, global.tool = tool\n',
        group: tk('workspace:macros.variableGroups.toolChange'),
    },
    {
        text: '%WCS=modal.wcs\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '%PLANE=modal.plane\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '%UNITS=modal.units\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '%DISTANCE=modal.distance\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '%FEEDRATE=modal.feedrate\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '%SPINDLE=modal.spindle\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '%COOLANT=modal.coolant\n',
        group: tk('workspace:macros.variableGroups.saveModalState'),
    },
    {
        text: '[WCS] [PLANE] [UNITS] [DISTANCE] [FEEDRATE] [SPINDLE] [COOLANT]\n',
        group: tk('workspace:macros.variableGroups.restoreModalState'),
    },
    {
        text: '[posx]',
        group: tk('workspace:macros.variableGroups.currentWorkPosition'),
    },
    {
        text: '[posy]',
        group: tk('workspace:macros.variableGroups.currentWorkPosition'),
    },
    {
        text: '[posz]',
        group: tk('workspace:macros.variableGroups.currentWorkPosition'),
    },
    {
        text: '[posa]',
        group: tk('workspace:macros.variableGroups.currentWorkPosition'),
    },
    {
        text: '%xmin=0,xmax=100,ymin=0,ymax=100,zmin=0,zmax=50\n',
        group: tk('workspace:macros.variableGroups.boundingBox'),
    },
    {
        text: '$#\n%wait',
        group: tk('workspace:macros.variableGroups.requestParameters'),
    },
    {
        text: '%PROBE_X=params.PRB.x\n',
        group: tk('workspace:macros.variableGroups.getParameters'),
    },
    {
        text: '%PROBE_Y=params.PRB.y\n',
        group: tk('workspace:macros.variableGroups.getParameters'),
    },
    {
        text: '%PROBE_Z=params.PRB.z\n',
        group: tk('workspace:macros.variableGroups.getParameters'),
    },
    {
        text: '%G54_Z=params.G54.z\n',
        group: tk('workspace:macros.variableGroups.getParameters'),
    },
    {
        text: '%G57_Z=params.G57.z\n',
        group: tk('workspace:macros.variableGroups.getParameters'),
    },
    {
        text: '%TOOL_OFFSET=params.TLO\n',
        group: tk('workspace:macros.variableGroups.getParameters'),
    },
];

export type ModalType =
    | typeof MODAL_NONE
    | typeof MODAL_ADD_MACRO
    | typeof MODAL_EDIT_MACRO
    | typeof MODAL_RUN_MACRO
    | typeof MODAL_MACRO_FORM;
