import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    GamepadProfile,
    GamepadManagerState,
    RegisteredGamepadButton,
} from '../../../features/Gamepad/types';

const initialState: GamepadManagerState = {
    activeProfile: null,
    buttons: {},
    profiles: [],
    connectedGamepads: {},
    jogSpeed: 1000,
    jogMode: 'continuous',
    jogIncrement: 1,
    isEditing: false,
};

const gamepadSlice = createSlice({
    name: 'gamepad',
    initialState,
    reducers: {
        registerProfile: (state, action: PayloadAction<GamepadProfile>) => {
            if (!state.profiles.find((p) => p.id === action.payload.id)) {
                state.profiles.push(action.payload);
            }
        },
        updateProfile: (state, action: PayloadAction<GamepadProfile>) => {
            const index = state.profiles.findIndex(
                (p) => p.id === action.payload.id,
            );
            if (index !== -1) {
                state.profiles[index] = action.payload;
            }
        },
        deleteProfile: (state, action: PayloadAction<string>) => {
            state.profiles = state.profiles.filter(
                (p) => p.id !== action.payload,
            );
            if (state.activeProfile === action.payload) {
                state.activeProfile = null;
            }
        },
        setActiveProfile: (state, action: PayloadAction<string | null>) => {
            state.activeProfile = action.payload;
        },
        registerGamepadButton: (
            state,
            action: PayloadAction<RegisteredGamepadButton>,
        ) => {
            if (!state.buttons[action.payload.id]) {
                state.buttons[action.payload.id] = action.payload;
            }
        },
        updateGamepadButton: (
            state,
            action: PayloadAction<{
                id: string;
                updates: Partial<RegisteredGamepadButton>;
            }>,
        ) => {
            const { id, updates } = action.payload;
            if (state.buttons[id]) {
                state.buttons[id] = {
                    ...state.buttons[id],
                    ...updates,
                };
            }
        },
        setIsEditing: (state, action: PayloadAction<boolean>) => {
            state.isEditing = action.payload;
        },
        updateConnectedGamepads: (
            state,
            action: PayloadAction<GamepadManagerState['connectedGamepads']>,
        ) => {
            state.connectedGamepads = action.payload;
        },
        updateJogSettings: (
            state,
            action: PayloadAction<
                Partial<
                    Pick<
                        GamepadManagerState,
                        'jogSpeed' | 'jogMode' | 'jogIncrement'
                    >
                >
            >,
        ) => {
            Object.assign(state, action.payload);
        },
    },
});

export const {
    registerProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    registerGamepadButton,
    updateGamepadButton,
    setIsEditing,
    updateConnectedGamepads,
    updateJogSettings,
} = gamepadSlice.actions;

export default gamepadSlice.reducer;
