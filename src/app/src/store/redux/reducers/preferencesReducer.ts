import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import store from '../..';

interface ShortcutList {
    [key: string]: string;
}

interface PreferencesState {
    shortcuts: {
        list: ShortcutList;
        shouldHold: boolean;
    };
    ipList: string[];
}

const initialState: PreferencesState = {
    shortcuts: {
        list: store.get('commandKeys', {} as ShortcutList),
        shouldHold: false,
    },
    ipList: [],
};

const preferencesSlice = createSlice({
    name: 'preferences',
    initialState,
    reducers: {
        setShortcutsList(state, action: PayloadAction<ShortcutList>) {
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
