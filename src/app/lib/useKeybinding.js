import _ from 'lodash';
import combokeys from './combokeys';
import store from '../store';
import shuttleEvents from './shuttleEvents';
import { MACRO_CATEGORY } from '../constants';

const TARGET_NUM_CALLS = 9; // this is the current number of widgets that use the useKeybinding hook
let numCalls = 0; // number of useKeybinding hooks that have been called

/*
    shuttleControlEvents structure:
    {
        cmd: {
            title: 'Firmware',
            keys: 'f5',
            (if applicable) gamepadKeys: '13',
            (if applicable) keysName: 'Arrow Down'
            cmd: 'OPEN_TOOLBAR',
            payload: { toolbar: MODAL_FIRMWARE },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => { function }
        },
        ...
    }
*/
function useKeybinding(shuttleControlEvents) {
    // update stored shuttle control events
    shuttleEvents.updateShuttleEvents(shuttleControlEvents);

    Object.keys(shuttleControlEvents).forEach(eventName => {
        const defaultCommand = shuttleControlEvents[eventName];
        if (eventName !== 'MACRO') {
            // add keybindings
            const currentCommandKeys = store.get('commandKeys', {});
            if (_.isEmpty(currentCommandKeys) || !currentCommandKeys[defaultCommand.cmd]) {
                // add to store
                let updatedCommandKeys = currentCommandKeys;
                updatedCommandKeys[defaultCommand.cmd] = {
                    cmd: defaultCommand.cmd,
                    keys: defaultCommand.keys,
                    isActive: defaultCommand.isActive,
                };
                store.replace('commandKeys', updatedCommandKeys);
            }

            // add gamepad shortcuts
            const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
            const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
                const shortcuts = profile.shortcuts;
                let updatedProfileShortcuts = shortcuts;
                if (_.isEmpty(shortcuts) || !shortcuts[defaultCommand.cmd]) {
                    // no default keys for gamepad
                    updatedProfileShortcuts[defaultCommand.cmd] = {
                        cmd: defaultCommand.cmd,
                        keys: defaultCommand.gamepadKeys || '',
                        keysName: defaultCommand.keysName || '',
                        isActive: defaultCommand.isActive,
                    };
                }
                return { ...profile, shortcuts: updatedProfileShortcuts };
            });
            // replace in store
            store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);
        }
    });

    numCalls++;
    checkNumCalls();
}

// check to see if all widgets have added their keybindings
// and call the remove function
function checkNumCalls() {
    if (numCalls === TARGET_NUM_CALLS) {
        removeOldKeybindings();
    }
}

export function removeOldKeybindings() {
    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const currentCommandKeys = store.get('commandKeys', {});
    console.log(currentCommandKeys);
    let updatedCommandKeys = currentCommandKeys;

    // remove keybindings that don't exist in any of the shuttleControlEvents arrays
    Object.entries(currentCommandKeys).forEach(([key, keybinding]) => {
        const event = allShuttleControlEvents[key];
        // if the category doesn't exist, it's not a macro
        // but if it's an old keybinding that still stores the category info, make sure it's not a macro
        if (event === undefined && (!keybinding.category || keybinding.category !== MACRO_CATEGORY)) {
            delete updatedCommandKeys[key];
        }
    });
    store.replace('commandKeys', updatedCommandKeys);

    // do the same for gamepad shortcuts
    const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
    const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
        const shortcuts = profile.shortcuts;
        console.log(shortcuts);
        let updatedProfileShortcuts = shortcuts;
        Object.entries(shortcuts).forEach(([key, keybinding]) => {
            const event = allShuttleControlEvents[key];
            if (event === undefined && (!keybinding.category || keybinding.category !== MACRO_CATEGORY)) {
                delete updatedProfileShortcuts[key];
            }
        });
        return { ...profile, shortcuts: updatedProfileShortcuts };
    });
    store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

    combokeys.reload();
}

export default useKeybinding;
