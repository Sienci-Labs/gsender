import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { METRIC_UNITS, RENDER_NO_FILE } from 'app/constants';

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
        updateFileParsedData: (
            state,
            action: PayloadAction<{ parsedData: any }>,
        ) => {
            state.parsedData = action.payload.parsedData;
        },
    },
});

export const {
    unloadFileInfo,
    updateFileInfo,
    updateFileContent,
    updateFileProcessing,
    updateFileRenderState,
    updateFileParsedData,
} = fileInfoSlice.actions;

export default fileInfoSlice.reducer;
