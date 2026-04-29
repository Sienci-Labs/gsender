import store from 'app/store';
import api from 'app/api';
import shuttleEvents from 'app/lib/shuttleEvents';
import { MACRO_CATEGORY } from 'app/constants';

export const SET_CURRENT_GAMEPAD_PROFILE = 'SET_CURRENT_GAMEPAD_PROFILE';
export const SET_CURRENT_GAMEPAD_PROFILE_BUTTON =
    'SET_CURRENT_GAMEPAD_PROFILE_BUTTON';
export const SET_GAMEPAD_PROFILE_LOCKOUT_BUTTON = 'SET_GAMEPAD_LOCKOUT_BUTTON';
export const SET_GAMEPAD_PROFILE_MODIFIER_BUTTON =
    'SET_GAMEPAD_MODIFIER_BUTTON';
export const SET_CURRENT_GAMEPAD_MODAL = 'SET_CURRENT_GAMEPAD_MODAL';
export const SET_GAMEPAD_PROFILE_LIST = 'SET_GAMEPAD_PROFILE_LIST';
export const SET_MACROS = 'SET_MACROS';

export const setCurrentGamepadProfile = (profile) => {
    return { type: SET_CURRENT_GAMEPAD_PROFILE, payload: profile };
};

export const setCurrentGamepadProfileButton = (button) => {
    return { type: SET_CURRENT_GAMEPAD_PROFILE_BUTTON, payload: button };
};

export const setCurrentModal = (modal) => {
    return { type: SET_CURRENT_GAMEPAD_MODAL, payload: modal };
};

export const setGamepadLockoutButton = (lockoutButton) => {
    store.replace('workspace.gamepad.lockoutButton', lockoutButton);

    return { type: SET_GAMEPAD_PROFILE_LOCKOUT_BUTTON, payload: lockoutButton };
};

export const setGamepadModifierButton = (modifierButton) => {
    store.replace('workspace.gamepad.modifierButton', modifierButton);

    return {
        type: SET_GAMEPAD_PROFILE_MODIFIER_BUTTON,
        payload: modifierButton,
    };
};

export const setGamepadProfileList = (profiles) => {
    store.replace('workspace.gamepad.profiles', profiles);

    return { type: SET_GAMEPAD_PROFILE_LIST, payload: profiles };
};

export const removeGamepadProfileFromList = (profileID) => {
    const profiles = store.get('workspace.gamepad.profiles', []);

    const newProfilesList = profiles.filter((profile) => {
        return JSON.stringify(profile.id) !== JSON.stringify(profileID);
    });

    store.replace('workspace.gamepad.profiles', newProfilesList);

    return { type: SET_GAMEPAD_PROFILE_LIST, payload: newProfilesList };
};

export const setMacros = async () => {
    let macroList = [];

    const res = await api.macros.fetch();
    const macros = res.data.records;

    // get callback for macros
    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const macroCallback = allShuttleControlEvents.MACRO;

    macros.forEach((macro) => {
        macroList.push({
            keys: '',
            title: macro.name,
            cmd: macro.id,
            payload: { macroID: macro.id },
            preventDefault: false,
            isActive: false,
            category: MACRO_CATEGORY,
            callback: macroCallback,
        });
    });

    return { type: SET_MACROS, payload: macroList };
};
