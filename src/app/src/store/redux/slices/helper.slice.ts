import { HelperState } from 'app/store/definitions.ts';
import { createSlice } from '@reduxjs/toolkit';

const initialState: HelperState = {
    active: false,
    minimized: true,
    title: 'Help',
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
            console.log('hit');
            state.minimized = !state.minimized;
            return state;
        },
    },
});

export const { unloadHelperInfo, toggleHelperVisibility } =
    HelperStateSlice.actions;

export default HelperStateSlice.reducer;
