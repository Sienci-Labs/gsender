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

export const SET_SHORTCUTS_LIST = 'SET_SHORTCUTS_LIST' as const;
export const HOLD_SHORTCUTS = 'HOLD_SHORTCUTS' as const;
export const UNHOLD_SHORTCUTS = 'UNHOLD_SHORTCUTS' as const;
export const SET_IP_LIST = 'SET_IP_LIST' as const;

export const updateShortcutsList =
    createAction<Record<string, string>>(SET_SHORTCUTS_LIST);
export const holdShortcutsListener = createAction(HOLD_SHORTCUTS);
export const unholdShortcutsListener = createAction(UNHOLD_SHORTCUTS);
export const updateIpList = createAction<string[]>(SET_IP_LIST);
