import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ConsoleState } from '../../definitions';

const MAX_HISTORY_SIZE = 1000;

const initialState: ConsoleState = {
    inputHistory: [],
    history: [],
};

const consoleSlice = createSlice({
    name: 'console',
    initialState,
    reducers: {
        setInputHistory(state, action: PayloadAction<string[]>) {
            state.inputHistory = action.payload.slice(-MAX_HISTORY_SIZE);
        },
        addToInputHistory(state, action: PayloadAction<string>) {
            state.inputHistory = [...state.inputHistory, action.payload].slice(
                -MAX_HISTORY_SIZE,
            );
        },
        addToHistory(state, action: PayloadAction<string>) {
            state.history = [...state.history, action.payload].slice(
                -MAX_HISTORY_SIZE,
            );
        },
    },
});

export const { setInputHistory, addToInputHistory, addToHistory } =
    consoleSlice.actions;

export default consoleSlice.reducer;
