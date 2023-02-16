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
        eventName: {
            id: 68,
            title: 'Firmware',
            keys: 'f5',
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
                    title: defaultCommand.title,
                    cmd: defaultCommand.cmd,
                    keys: defaultCommand.keys,
                    payload: defaultCommand.payload,
                    preventDefault: defaultCommand.preventDefault,
                    isActive: defaultCommand.isActive,
                    category: defaultCommand.category,
                    callback: defaultCommand.callback
                };
                store.replace('commandKeys', updatedCommandKeys);
            } // don't need id migration code as that's done in store migration now

            // add gamepad shortcuts
            const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
            const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
                const shortcuts = profile.shortcuts;
                let updatedProfileShortcuts = shortcuts;
                if (_.isEmpty(shortcuts) || !shortcuts[defaultCommand.cmd]) {
                    // no default keys for gamepad
                    updatedProfileShortcuts[defaultCommand.cmd] = {
                        title: defaultCommand.title,
                        keys: defaultCommand.gamepadKeys || '',
                        keysName: defaultCommand.keysName,
                        cmd: defaultCommand.cmd,
                        payload: defaultCommand.payload,
                        preventDefault: defaultCommand.preventDefault,
                        isActive: defaultCommand.isActive,
                        category: defaultCommand.category,
                        callback: defaultCommand.callback
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
    let updatedCommandKeys = currentCommandKeys;

    // remove keybindings that don't exist in any of the shuttleControlEvents arrays
    Object.keys(currentCommandKeys).forEach(key => {
        const event = allShuttleControlEvents[key];
        if (event === undefined && key.category !== MACRO_CATEGORY) {
            delete updatedCommandKeys[key];
        }
    });
    store.replace('commandKeys', updatedCommandKeys);

    // do the same for gamepad shortcuts
    const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
    const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
        const shortcuts = profile.shortcuts;
        let updatedProfileShortcuts = shortcuts;
        Object.keys(shortcuts).forEach(key => {
            const event = allShuttleControlEvents[key];
            if (event === undefined) {
                delete updatedProfileShortcuts[key];
            }
        });
        return { ...profile, shortcuts: updatedProfileShortcuts };
    });
    store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

    combokeys.reload();
}

export default useKeybinding;
