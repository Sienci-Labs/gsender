import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BBox } from 'app/definitions/general';
import { METRIC_UNITS, RENDER_NO_FILE } from 'app/constants';
import { FileInfoState } from 'app/store/definitions';

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
    usedAxes: [],
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

const fileInfoSlice = createSlice({
    name: 'fileInfo',
    initialState,
    reducers: {
        unloadFileInfo: () => {
            return initialState;
        },
        updateFileInfo: (
            state,
            action: PayloadAction<Partial<FileInfoState>>,
        ) => {
            const bbox = action.payload.bbox
                ? { bbox: normalizeBBox(action.payload.bbox) }
                : {};
            return {
                ...state,
                ...action.payload,
                fileLoaded: true,
                fileProcessing: false,
                ...bbox,
            };
        },
        updateFileContent: (
            state,
            action: PayloadAction<{
                content: string;
                name: string;
                size: number;
            }>,
        ) => {
            const { content, name, size } = action.payload;
            state.fileLoaded = true;
            state.content = content;
            state.name = name;
            state.size = size;
        },
        updateFileProcessing: (
            state,
            action: PayloadAction<{ fileProcessing: boolean }>,
        ) => {
            state.fileProcessing = action.payload.fileProcessing;
        },
        updateFileRenderState: (
            state,
            action: PayloadAction<{ renderState: string }>,
        ) => {
            state.renderState = action.payload.renderState;
        },
    },
});

export const {
    unloadFileInfo,
    updateFileInfo,
    updateFileContent,
    updateFileProcessing,
    updateFileRenderState,
} = fileInfoSlice.actions;

export default fileInfoSlice.reducer;
