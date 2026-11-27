import reduxStore from 'app/store/redux';
import { updateShuttleStatus } from 'app/store/redux/slices/shortcuts.slice';
import _ from 'lodash';
import store from '../store';
import combokeys from './combokeys';
import type {
    CommandKeys,
    ShuttleControlEvents,
    ShuttleEvent,
} from './definitions/shortcuts';
import shuttleEvents from './shuttleEvents';

/*
    Never reuse a the same cmd for a different shortcut.
    
    The user-set `keys` and `isActive` properties from the old shortcut are
    saved and will override the defaults for the new one. Give the new
    shortcut a new ID and delete the retired one in a store migration.
*/

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
function useKeybinding(
    shuttleControlEvents: ShuttleControlEvents,
    // only the last caller of useKeybinding (workspace.index.tsx) has this set to true
    isRoot: boolean = false,
): void {
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
            // we should only save cmd and user changable properties in store: keys, isActive
            if (
                _.isEmpty(currentCommandKeys) ||
                !currentCommandKeys[defaultShuttle.cmd]
            ) {
                // add to store
                const updatedCommandKeys = JSON.parse(
                    JSON.stringify(currentCommandKeys),
                );
                const key = defaultShuttle.keys || '';

                updatedCommandKeys[defaultShuttle.cmd] = {
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

    if (isRoot) {
        combokeys.reload();
        reduxStore.dispatch(updateShuttleStatus({ isFinished: true }));
    }
}

export default useKeybinding;
