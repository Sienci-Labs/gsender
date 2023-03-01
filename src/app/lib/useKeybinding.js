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
            } else if (currentCommandKeys[defaultCommand.cmd].resetFlag) { // if reset flag is set, set everything but keys and isActive to default values
                let updatedCommandKeys = currentCommandKeys;
                updatedCommandKeys[defaultCommand.cmd] = {
                    title: defaultCommand.title,
                    cmd: defaultCommand.cmd,
                    keys: currentCommandKeys[defaultCommand.cmd].keys,
                    payload: defaultCommand.payload,
                    preventDefault: defaultCommand.preventDefault,
                    isActive: currentCommandKeys[defaultCommand.cmd].isActive,
                    category: defaultCommand.category,
                    callback: defaultCommand.callback
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
                        title: defaultCommand.title,
                        keys: defaultCommand.gamepadKeys || '',
                        keysName: defaultCommand.keysName || '',
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
    Object.entries(currentCommandKeys).forEach(([key, keybinding]) => {
        const event = allShuttleControlEvents[key];
        if (event === undefined && keybinding.category !== MACRO_CATEGORY) {
            delete updatedCommandKeys[key];
        }
    });
    store.replace('commandKeys', updatedCommandKeys);

    // do the same for gamepad shortcuts
    const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
    const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
        const shortcuts = profile.shortcuts;
        let updatedProfileShortcuts = shortcuts;
        Object.entries(shortcuts).forEach(([key, keybinding]) => {
            const event = allShuttleControlEvents[key];
            if (event === undefined && keybinding.category !== MACRO_CATEGORY) {
                delete updatedProfileShortcuts[key];
            }
        });
        return { ...profile, shortcuts: updatedProfileShortcuts };
    });
    store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

    combokeys.reload();
}

export default useKeybinding;
