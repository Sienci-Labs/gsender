import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import type { ConsoleState } from '../../definitions';

const initialState: ConsoleState = {
    inputHistory: [],
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
    },
});

export const { setInputHistory, addToInputHistory } = consoleSlice.actions;

export default consoleSlice.reducer;
