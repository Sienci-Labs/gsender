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
    },
});

export default HelperStateSlice.reducer;
