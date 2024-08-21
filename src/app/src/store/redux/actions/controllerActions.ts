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

import { createAction } from 'redux-action';

export const UPDATE_CONTROLLER_STATE = 'UPDATE_CONTROLLER_STATE' as const;
export const UPDATE_CONTROLLER_SETTINGS = 'UPDATE_CONTROLLER_SETTINGS' as const;
export const UPDATE_FEEDER_STATUS = 'UPDATE_FEEDER_STATUS' as const;
export const UPDATE_SENDER_STATUS = 'UPDATE_SENDER_STATUS' as const;
export const UPDATE_WORKFLOW_STATE = 'UPDATE_WORKFLOW_STATE' as const;
export const TOOL_CHANGE = 'TOOL_CHANGE' as const;
export const UPDATE_HOMING_FLAG = 'UPDATE_HOMING_FLAG' as const;
export const RESET_HOMING = 'RESET_HOMING' as const;
export const UPDATE_PARTIAL_CONTROLLER_SETTINGS =
    'UPDATE_PARTIAL_CONTROLLER_SETTINGS' as const;
export const UPDATE_TERMINAL_HISTORY = 'UPDATE_TERMINAL_HISTORY' as const;
export const UPDATE_SETTINGS_DESCRIPTIONS =
    'UPDATE_SETTINGS_DESCRIPTIONS' as const;
export const UPDATE_ALARM_DESCRIPTIONS = 'UPDATE_ALARM_DESCRIPTIONS' as const;
export const ADD_SPINDLE = 'ADD_SPINDLE' as const;

export const updateControllerState = createAction<any>(UPDATE_CONTROLLER_STATE);
export const updateControllerSettings = createAction<any>(
    UPDATE_CONTROLLER_SETTINGS,
);
export const updateFeederStatus = createAction<any>(UPDATE_FEEDER_STATUS);
export const updateSenderStatus = createAction<any>(UPDATE_SENDER_STATUS);
export const updateWorkflowState = createAction<any>(UPDATE_WORKFLOW_STATE);
export const toolChange = createAction<any>(TOOL_CHANGE);
export const updateHomingFlag = createAction<any>(UPDATE_HOMING_FLAG);
export const resetHoming = createAction(RESET_HOMING);
export const partialSettingsUpdate = createAction<any>(
    UPDATE_PARTIAL_CONTROLLER_SETTINGS,
);
export const updateTerminalHistory = createAction<any>(UPDATE_TERMINAL_HISTORY);
export const updateSettingsDescriptions = createAction<any>(
    UPDATE_SETTINGS_DESCRIPTIONS,
);
export const updateAlarmDescriptions = createAction<any>(
    UPDATE_ALARM_DESCRIPTIONS,
);
export const addSpindle = createAction<any>(ADD_SPINDLE);
