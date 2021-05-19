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
import { createAction } from 'redux-action';

export const {
    UPDATE_CONTROLLER_STATE,
    UPDATE_CONTROLLER_SETTINGS,
    UPDATE_FEEDER_STATUS,
    UPDATE_SENDER_STATUS,
    UPDATE_WORKFLOW_STATE
} = constants('controller', [
    'UPDATE_CONTROLLER_STATE',
    'UPDATE_CONTROLLER_SETTINGS',
    'UPDATE_FEEDER_STATUS',
    'UPDATE_SENDER_STATUS',
    'UPDATE_WORKFLOW_STATE'
]);

export const updateControllerState = createAction(UPDATE_CONTROLLER_STATE);
export const updateControllerSettings = createAction(UPDATE_CONTROLLER_SETTINGS);
export const updateFeederStatus = createAction(UPDATE_FEEDER_STATUS);
export const updateSenderStatus = createAction(UPDATE_SENDER_STATUS);
export const updateWorkflowState = createAction(UPDATE_WORKFLOW_STATE);
