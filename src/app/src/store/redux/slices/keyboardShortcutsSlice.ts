import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    KeyboardShortcutsState,
    KeyboardShortcut,
    ShortcutUpdatePayload,
} from 'app/features/Keyboard/types';
import { loadShortcuts, saveShortcuts } from 'app/features/Keyboard/storage';

const initialState: KeyboardShortcutsState = {
    shortcuts: loadShortcuts(),
    isEditing: false,
};

const keyboardShortcutsSlice = createSlice({
    name: 'keyboardShortcuts',
    initialState,
    reducers: {
        registerShortcut: (state, action: PayloadAction<KeyboardShortcut>) => {
            if (!state.shortcuts[action.payload.id]) {
                state.shortcuts[action.payload.id] = {
                    ...action.payload,
                    currentKeys: action.payload.defaultKeys,
                    isActive: true,
                };
                saveShortcuts(state.shortcuts);
            }
        },
        updateShortcut: (
            state,
            action: PayloadAction<{
                id: string;
                updates: ShortcutUpdatePayload;
            }>,
        ) => {
            const { id, updates } = action.payload;
            if (state.shortcuts[id]) {
                state.shortcuts[id] = {
                    ...state.shortcuts[id],
                    ...updates,
                    actionId: state.shortcuts[id].actionId,
                };
                saveShortcuts(state.shortcuts);
            }
        },
        resetShortcut: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            if (state.shortcuts[id]) {
                state.shortcuts[id].currentKeys =
                    state.shortcuts[id].defaultKeys;
                saveShortcuts(state.shortcuts);
            }
        },
        setIsEditing: (state, action: PayloadAction<boolean>) => {
            state.isEditing = action.payload;
        },
        resetAllShortcuts: (state) => {
            Object.keys(state.shortcuts).forEach((id) => {
                state.shortcuts[id].currentKeys =
                    state.shortcuts[id].defaultKeys;
            });
            saveShortcuts(state.shortcuts);
        },
        toggleAllShortcuts: (state) => {
            Object.keys(state.shortcuts).forEach((id) => {
                state.shortcuts[id].isActive = !state.shortcuts[id].isActive;
            });
            saveShortcuts(state.shortcuts);
        },
    },
});

export const {
    registerShortcut,
    updateShortcut,
    resetShortcut,
    setIsEditing,
    resetAllShortcuts,
    toggleAllShortcuts,
} = keyboardShortcutsSlice.actions;

export default keyboardShortcutsSlice.reducer;
