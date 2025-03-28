import _ from 'lodash';
import combokeys from './combokeys';
import store from '../store';
import shuttleEvents from './shuttleEvents';
import { MACRO_CATEGORY } from '../constants';
import {
    CommandKeys,
    ShuttleControlEvents,
    ShuttleEvent,
} from './definitions/shortcuts';

const TARGET_NUM_CALLS = 50; // this is the current number of widgets that use the useKeybinding hook
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
function useKeybinding(shuttleControlEvents: ShuttleControlEvents): void {
    // update stored shuttle control events
    shuttleEvents.updateShuttleEvents(shuttleControlEvents);

    Object.keys(shuttleControlEvents).forEach((eventName) => {
        const defaultCommand = shuttleControlEvents[eventName];
        if (eventName !== 'MACRO' && eventName !== 'STOP_CONT_JOG') {
            const defaultShuttle = defaultCommand as ShuttleEvent; // no macro so it will be a ShuttleEvent type
            // add keybindings
            const currentCommandKeys: CommandKeys = store.get(
                'commandKeys',
                {},
            );
            if (
                _.isEmpty(currentCommandKeys) ||
                !currentCommandKeys[defaultShuttle.cmd]
            ) {
                // add to store
                let updatedCommandKeys = JSON.parse(
                    JSON.stringify(currentCommandKeys),
                );
                const key = defaultShuttle.keys || '';

                updatedCommandKeys[defaultShuttle.cmd] = {
                    ...updatedCommandKeys[defaultShuttle.cmd],
                    cmd: defaultShuttle.cmd,
                    keys: key,
                    isActive: defaultShuttle.isActive,
                };
                store.replace('commandKeys', updatedCommandKeys);
            }

            // // add gamepad shortcuts
            // const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
            // const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
            //     const shortcuts = profile.shortcuts;
            //     let updatedProfileShortcuts = shortcuts;
            //     if (_.isEmpty(shortcuts) || !shortcuts[defaultCommand.cmd]) {
            //         // no default keys for gamepadlo
            //         updatedProfileShortcuts[defaultCommand.cmd] = {
            //             cmd: defaultCommand.cmd,
            //             keys: defaultCommand.gamepadKeys || '',
            //             keysName: defaultCommand.keysName || '',
            //             isActive: defaultCommand.isActive,
            //         };
            //     }
            //     return { ...profile, shortcuts: updatedProfileShortcuts };
            // });
            // // replace in store
            // store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);
        }
    });

    numCalls++;
    checkNumCalls();
}

// check to see if all widgets have added their keybindings
// and call the remove function
function checkNumCalls(): void {
    if (numCalls === TARGET_NUM_CALLS) {
        removeOldKeybindings();
    }
}

export function removeOldKeybindings(): void {
    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const currentCommandKeys: CommandKeys = store.get('commandKeys', {});
    const updatedCommandKeys: CommandKeys = {};

    // Only keep keybindings that exist in the shuttleControlEvents arrays
    Object.entries(currentCommandKeys).forEach(([key, keybinding]) => {
        const event = allShuttleControlEvents[key];
        // if the category doesn't exist, it's not a macro
        // but if it's an old keybinding that still stores the category info, make sure it's not a macro
        if (
            event !== undefined ||
            (keybinding.category && keybinding.category === MACRO_CATEGORY)
        ) {
            updatedCommandKeys[key] = keybinding;
        }
    });
    store.replace('commandKeys', updatedCommandKeys);

    // // do the same for gamepad shortcuts
    // const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
    // const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
    //     const shortcuts = profile.shortcuts;
    //     let updatedProfileShortcuts = shortcuts;
    //     Object.entries(shortcuts).forEach(([key, keybinding]) => {
    //         const event = allShuttleControlEvents[key];
    //         if (event === undefined && (!keybinding.category || keybinding.category !== MACRO_CATEGORY)) {
    //             delete updatedProfileShortcuts[key];
    //         }
    //     });
    //     return { ...profile, shortcuts: updatedProfileShortcuts };
    // });
    // store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

    combokeys.reload();
}

export default useKeybinding;
