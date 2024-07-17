

import store from 'app/store';
import {
    SET_CURRENT_GAMEPAD_PROFILE,
    SET_CURRENT_GAMEPAD_PROFILE_BUTTON,
    SET_GAMEPAD_PROFILE_LOCKOUT_BUTTON,
    SET_GAMEPAD_PROFILE_MODIFIER_BUTTON,
    SET_CURRENT_GAMEPAD_MODAL,
    SET_GAMEPAD_PROFILE_LIST,
    SET_MACROS,
} from './actions';

const initialState = () => {
    const gamepadSettings = store.get('workspace.gamepad');

    return {
        settings: {
            deadZone: 0.3,
            precision: 3,
            profiles: [],
            ...gamepadSettings,
        },
        currentProfile: null,
        currentButton: null,
        currentModal: null,
        lockoutButton: null,
        modifierButton: null,
        macros: [],
    };
};

const reducer = (state, action) => {
    switch (action.type) {
    case SET_CURRENT_GAMEPAD_PROFILE: {
        return {
            ...state,
            currentProfile: action.payload,
        };
    }

    case SET_CURRENT_GAMEPAD_PROFILE_BUTTON: {
        return {
            ...state,
            currentButton: action.payload,
        };
    }

    case SET_GAMEPAD_PROFILE_LOCKOUT_BUTTON: {
        return {
            ...state,
            lockoutButton: action.payload,
        };
    }

    case SET_GAMEPAD_PROFILE_MODIFIER_BUTTON: {
        return {
            ...state,
            modifierButton: action.payload,
        };
    }

    case SET_CURRENT_GAMEPAD_MODAL: {
        return {
            ...state,
            currentModal: action.payload,
        };
    }

    case SET_GAMEPAD_PROFILE_LIST: {
        return {
            ...state,
            settings: {
                ...state.settings,
                profiles: action.payload
            },
        };
    }

    case SET_MACROS: {
        return {
            ...state,
            macros: action.payload,
        };
    }

    default: {
        return state;
    }
    }
};

export const gamepadReducer = {
    handler: reducer,
    initialState,
};
