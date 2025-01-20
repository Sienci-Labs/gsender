import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ConsoleState } from '../../definitions';

const MAX_HISTORY_SIZE = 1000;

const initialState: ConsoleState = {
    inputHistory: [],
};

const consoleSlice = createSlice({
    name: 'console',
    initialState,
    reducers: {
        setInputHistory(state, action: PayloadAction<string[]>) {
            state.inputHistory = action.payload.slice(-MAX_HISTORY_SIZE);
        },
        addToInputHistory(state, action: PayloadAction<string>) {
            // Add new entry and remove oldest if exceeding limit
            state.inputHistory = [...state.inputHistory, action.payload].slice(
                -MAX_HISTORY_SIZE,
            );
        },
    },
});

export const { setInputHistory, addToInputHistory } = consoleSlice.actions;

export default consoleSlice.reducer;
