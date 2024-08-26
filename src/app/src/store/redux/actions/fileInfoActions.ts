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

export const UPDATE_FILE_INFO = 'UPDATE_FILE_INFO' as const;
export const UNLOAD_FILE_INFO = 'UNLOAD_FILE_INFO' as const;
export const UPDATE_FILE_CONTENT = 'UPDATE_FILE_CONTENT' as const;
export const UPDATE_FILE_PROCESSING = 'UPDATE_FILE_PROCESSING' as const;
export const UPDATE_FILE_RENDER_STATE = 'UPDATE_FILE_RENDER_STATE' as const;
export const UPDATE_FILE_PARSED_DATA = 'UPDATE_FILE_PARSED_DATA' as const;

export const updateFileInfo = createAction<any>(UPDATE_FILE_INFO);
export const unloadFileInfo = createAction<void>(UNLOAD_FILE_INFO);
export const updateFileContent = createAction<any>(UPDATE_FILE_CONTENT);
export const updateFileProcessing = createAction<any>(UPDATE_FILE_PROCESSING);
export const updateFileRenderState = createAction<any>(
    UPDATE_FILE_RENDER_STATE,
);
export const updateFileParsedData = createAction<any>(UPDATE_FILE_PARSED_DATA);
