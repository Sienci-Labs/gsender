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
import { UNLOAD_FILE_INFO, UPDATE_FILE_INFO, UPDATE_FILE_CONTENT, UPDATE_FILE_PROCESSING, UPDATE_FILE_RENDER_STATE } from 'app/actions/fileInfoActions';
import { METRIC_UNITS, RENDER_NO_FILE } from 'app/constants';

const initialState = {
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
        delta: { x: 0, y: 0, z: 0 }
    },
    content: '',
};

const normalizeBBox = (bbox) => {
    const defaultBBox = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
    };
    return {
        ...defaultBBox,
        ...bbox
    };
};

const reducer = createReducer(initialState, {
    [UNLOAD_FILE_INFO]: (context, reducerState) => {
        return {
            ...initialState
        };
    },
    [UPDATE_FILE_INFO]: (payload, reducerState) => {
        const bbox = payload.bbox ? { bbox: normalizeBBox(payload.bbox) } : {};
        return {
            ...payload,
            fileLoaded: true,
            fileProcessing: false,
            ...bbox
        };
    },
    [UPDATE_FILE_CONTENT]: ({ content, name, size }, reducerState) => {
        return {
            fileLoaded: true,
            content,
            name,
            size
        };
    },
    [UPDATE_FILE_PROCESSING]: ({ value }, reducerState) => {
        return {
            fileProcessing: value
        };
    },
    [UPDATE_FILE_RENDER_STATE]: ({ state }, reducerState) => {
        return {
            renderState: state
        };
    },
});

export default reducer;
