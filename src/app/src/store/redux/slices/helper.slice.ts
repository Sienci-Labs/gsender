import { HelperState } from 'app/store/definitions.ts';
import { createSlice } from '@reduxjs/toolkit';

const initialState: HelperState = {
    active: false,
    minimized: true,
    title: 'Helper',
    metadata: {},
};

const HelperStateSlice = createSlice({
    name: 'helperInfo',
    initialState,
    reducers: {
        unloadHelperInfo: () => {
            return initialState;
        },
        toggleHelperVisibility: (state) => {
            state.minimized = !state.minimized;
            return state;
        },
        updateHelperState: (state, payload) => {
            const { active, metadata } = payload;
            state.active = active;
            state.metadata = metadata;
            state.minimized = false;
            return state;
        },
        enableHelper: (state) => {
            state.active = true;
            state.minimized = false;
            return state;
        },
        disableHelper: (state) => {
            state.active = false;
            state.minimized = true;
            return state;
        },
    },
});

export const {
    enableHelper,
    disableHelper,
    updateHelperState,
    unloadHelperInfo,
    toggleHelperVisibility,
} = HelperStateSlice.actions;

export default HelperStateSlice.reducer;
