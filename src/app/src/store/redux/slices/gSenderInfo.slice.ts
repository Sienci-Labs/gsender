import { gSenderInfo } from 'app/store/definitions.ts';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: gSenderInfo = {
    releaseNotes: {
        version: '',
        releaseNotes: [],
        releaseDate: '',
    },
    hasUpdate: false,
};

const gSenderInfoSlice = createSlice({
    name: 'gSenderInfo',
    initialState,
    reducers: {
        updateReleaseNotes: (
            state: gSenderInfo,
            action: PayloadAction<object>,
        ) => {
            state.hasUpdate = true;
            state.releaseNotes = action.payload;
        },
    },
});

export const { updateReleaseNotes } = gSenderInfoSlice.actions;

export default gSenderInfoSlice.reducer;
