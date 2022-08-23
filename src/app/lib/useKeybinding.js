import combokeys from './combokeys';
import store from '../store';
import shuttleEvents from './shuttleEvents';
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
            const currentCommandKeys = store.get('commandKeys', []);
            if (currentCommandKeys.length === 0 || !currentCommandKeys.find(element => element.cmd === defaultCommand.cmd)) {
                // set id
                let id = 1;
                if (currentCommandKeys.length !== 0) {
                    id = currentCommandKeys[currentCommandKeys.length - 1].id + 1;
                }
                // add to store
                let updatedCommandKeys = currentCommandKeys;
                updatedCommandKeys.push({
                    id: id,
                    title: defaultCommand.title,
                    keys: defaultCommand.keys,
                    cmd: defaultCommand.cmd,
                    payload: defaultCommand.payload,
                    preventDefault: defaultCommand.preventDefault,
                    isActive: defaultCommand.isActive,
                    category: defaultCommand.category,
                    callback: defaultCommand.callback
                });
                store.replace('commandKeys', updatedCommandKeys);
            }

            // add gamepad shortcuts
            const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
            const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
                const shortcuts = profile.shortcuts;
                let updatedProfileShortcuts = shortcuts;
                if (shortcuts.length === 0 || !shortcuts.find(element => element.cmd === defaultCommand.cmd)) {
                    // set id
                    let id = 1;
                    if (shortcuts.length === 0) {
                        id = shortcuts[shortcuts.length - 1].id + 1;
                    }
                    // no default keys for gamepad
                    updatedProfileShortcuts.push({
                        id: id,
                        title: defaultCommand.title,
                        keys: '',
                        cmd: defaultCommand.cmd,
                        payload: defaultCommand.payload,
                        preventDefault: defaultCommand.preventDefault,
                        isActive: defaultCommand.isActive,
                        category: defaultCommand.category,
                        callback: defaultCommand.callback
                    });
                }
                return { ...profile, shortcuts: updatedProfileShortcuts };
            });
            // replace in store
            store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);
        }
    });
}

export function removeOldKeybindings() {
    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const currentCommandKeys = store.get('commandKeys', []);
    let updatedCommandKeys = currentCommandKeys;

    // remove keybindings that don't exist in any of the shuttleControlEvents arrays
    currentCommandKeys.forEach(key => {
        const event = allShuttleControlEvents.find(event => event.cmd === key.cmd);
        if (event === undefined) {
            let keyToRemove = updatedCommandKeys.find(el => el.cmd === key.cmd);
            updatedCommandKeys.splice(updatedCommandKeys.findIndex(el => el === keyToRemove), 1);
        }
    });
    store.replace('commandKeys', updatedCommandKeys);

    // do the same for gamepad shortcuts
    const currentGamepadProfiles = store.get('workspace.gamepad.profiles', []);
    const updatedGamepadProfiles = currentGamepadProfiles.map(profile => {
        const shortcuts = profile.shortcuts;
        let updatedProfileShortcuts = shortcuts;
        shortcuts.forEach(key => {
            const event = allShuttleControlEvents.find(event => event.cmd === key.cmd);
            if (event === undefined) {
                let keyToRemove = updatedProfileShortcuts.find(el => el.cmd === key.cmd);
                updatedProfileShortcuts.splice(updatedProfileShortcuts.findIndex(el => el === keyToRemove), 1);
            }
        });
        return { ...profile, shortcuts: updatedProfileShortcuts };
    });
    store.replace('workspace.gamepad.profiles', updatedGamepadProfiles);

    combokeys.reload();
}

export default useKeybinding;
