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
import { createReducer } from 'redux-action';

import { METRIC_UNITS, RENDER_NO_FILE } from 'app/constants';

import {
    UNLOAD_FILE_INFO,
    UPDATE_FILE_INFO,
    UPDATE_FILE_CONTENT,
    UPDATE_FILE_PROCESSING,
    UPDATE_FILE_RENDER_STATE,
    UPDATE_FILE_PARSED_DATA,
} from '../actions/fileInfoActions';

interface BBox {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    delta: { x: number; y: number; z: number };
}

interface FileInfoState {
    fileLoaded: boolean;
    fileProcessing: boolean;
    renderState: string;
    name: string | null;
    path: string;
    size: number;
    total: number;
    toolSet: any[];
    spindleSet: any[];
    movementSet: any[];
    invalidGcode: any[];
    estimatedTime: number;
    fileModal: string;
    bbox: BBox;
    content: string;
    fileType: string | null;
    parsedData?: any;
}

const initialState: FileInfoState = {
    fileLoaded: false,
    fileProcessing: false,
    renderState: RENDER_NO_FILE,
    name: null,
    path: '',
    size: 0,
    total: 0,
    toolSet: [],
    spindleSet: [],
    movementSet: [],
    invalidGcode: [],
    estimatedTime: 0,
    fileModal: METRIC_UNITS,
    bbox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        delta: { x: 0, y: 0, z: 0 },
    },
    content: '',
    fileType: null,
};

const normalizeBBox = (bbox: Partial<BBox>): BBox => {
    const defaultBBox: BBox = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        delta: { x: 0, y: 0, z: 0 },
    };
    return {
        ...defaultBBox,
        ...bbox,
    };
};

const reducer = createReducer<FileInfoState>(initialState, {
    [UNLOAD_FILE_INFO]: () => {
        return {
            ...initialState,
        };
    },
    [UPDATE_FILE_INFO]: (state, payload: Partial<FileInfoState>) => {
        const bbox = payload.bbox ? { bbox: normalizeBBox(payload.bbox) } : {};
        return {
            ...state,
            ...payload,
            fileLoaded: true,
            fileProcessing: false,
            ...bbox,
        };
    },
    [UPDATE_FILE_CONTENT]: (
        state,
        {
            content,
            name,
            size,
        }: { content: string; name: string; size: number },
    ) => {
        return {
            ...state,
            fileLoaded: true,
            content,
            name,
            size,
        };
    },
    [UPDATE_FILE_PROCESSING]: (state, { fileProcessing }) => {
        return {
            ...state,
            fileProcessing,
        };
    },
    [UPDATE_FILE_RENDER_STATE]: (state, { renderState }) => {
        return {
            ...state,
            renderState,
        };
    },
    [UPDATE_FILE_PARSED_DATA]: (state, { parsedData }) => {
        return {
            ...state,
            parsedData,
        };
    },
});

export default reducer;
