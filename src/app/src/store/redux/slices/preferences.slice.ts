import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import store from 'app/store';
import { PreferencesState } from '../../definitions';
import { CommandKeys } from 'app/lib/definitions/shortcuts';

const initialState: PreferencesState = {
    shortcuts: {
        list: store.get('commandKeys', {} as CommandKeys),
        shouldHold: false,
    },
    ipList: [],
};

const preferencesSlice = createSlice({
    name: 'preferences',
    initialState,
    reducers: {
        setShortcutsList(state, action: PayloadAction<CommandKeys>) {
            state.shortcuts.list = action.payload;
        },
        holdShortcuts(state) {
            state.shortcuts.shouldHold = true;
        },
        unholdShortcuts(state) {
            state.shortcuts.shouldHold = false;
        },
        setIpList(state, action: PayloadAction<string[]>) {
            state.ipList = action.payload;
        },
    },
});

export const { setShortcutsList, holdShortcuts, unholdShortcuts, setIpList } =
    preferencesSlice.actions;

export default preferencesSlice.reducer;