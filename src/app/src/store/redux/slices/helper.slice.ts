import { HelperState } from 'app/store/definitions.ts';
import { createSlice } from '@reduxjs/toolkit';

const initialState: HelperState = {
    active: true,
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
    },
});

export const { unloadHelperInfo, toggleHelperVisibility } =
    HelperStateSlice.actions;

export default HelperStateSlice.reducer;
