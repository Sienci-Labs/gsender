import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ConsoleState } from '../../definitions';
import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';

const initialState: ConsoleState = {
    inputHistory: [],
    history: [],
};

const consoleSlice = createSlice({
    name: 'console',
    initialState,
    reducers: {
        setInputHistory(state, action: PayloadAction<string[]>) {
            state.inputHistory = action.payload.slice(
                -MAX_TERMINAL_INPUT_ARRAY_SIZE,
            );
        },
        addToInputHistory(state, action: PayloadAction<string>) {
            state.inputHistory = [...state.inputHistory, action.payload].slice(
                -MAX_TERMINAL_INPUT_ARRAY_SIZE,
            );
        },
        addToHistory(state, action: PayloadAction<string[]>) {
            state.history = [...state.history, ...action.payload].slice(
                -MAX_TERMINAL_INPUT_ARRAY_SIZE,
            );
        },
    },
});

export const { setInputHistory, addToInputHistory, addToHistory } =
    consoleSlice.actions;

export default consoleSlice.reducer;
