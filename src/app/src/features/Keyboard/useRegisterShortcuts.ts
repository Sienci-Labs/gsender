import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { registerShortcut } from 'app/store/redux/slices/keyboardShortcutsSlice';
import { RegisterShortcutOptions } from './types';
import { actionRegistry } from './utils/actionRegistry';
import { ShortcutCategory } from './types';
import {
    matchesShortcut,
    registerGlobalShortcut,
    unregisterGlobalShortcut,
} from './utils/keyboardUtils';

export function useRegisterShortcuts(shortcuts: RegisterShortcutOptions[]) {
    const dispatch = useDispatch();
    const registeredShortcuts = useSelector(
        (state: RootState) => state.keyboardShortcuts.shortcuts,
    );
    const isEditing = useSelector(
        (state: RootState) => state.keyboardShortcuts.isEditing,
    );

    useEffect(() => {
        // Register all shortcuts in Redux store and action registry
        shortcuts.forEach(
            ({
                id,
                title,
                description,
                defaultKeys,
                category,
                onKeyDown,
                onKeyDownHold,
                onKeyUp,
                onKeyUpHold,
            }) => {
                dispatch(
                    registerShortcut({
                        id,
                        title,
                        description,
                        defaultKeys,
                        currentKeys: defaultKeys,
                        category: category as ShortcutCategory,
                        actionId: id,
                        isActive: true,
                        preventDefault: true,
                    }),
                );

                actionRegistry.register(id, {
                    onKeyDown,
                    onKeyDownHold,
                    onKeyUp,
                    onKeyUpHold,
                });
            },
        );

        // Cleanup function
        return () => {
            shortcuts.forEach(({ id }) => {
                actionRegistry.unregister(id);
            });
        };
    }, [dispatch, shortcuts]);

    // Handle keyboard events for all shortcuts
    useEffect(() => {
        if (isEditing) {
            shortcuts.forEach(({ id }) => {
                const shortcut = registeredShortcuts[id];
                if (shortcut) {
                    unregisterGlobalShortcut(id, shortcut.currentKeys);
                }
            });
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            shortcuts.forEach(({ id }) => {
                const shortcut = registeredShortcuts[id];
                if (
                    shortcut?.isActive &&
                    matchesShortcut(e, shortcut.currentKeys)
                ) {
                    e.preventDefault();
                    actionRegistry.executeKeyDown(id, e);
                }
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            shortcuts.forEach(({ id }) => {
                const shortcut = registeredShortcuts[id];
                if (
                    shortcut?.isActive &&
                    matchesShortcut(e, shortcut.currentKeys)
                ) {
                    e.preventDefault();
                    actionRegistry.executeKeyUp(id, e);
                }
            });
        };

        // Register all shortcuts
        shortcuts.forEach(({ id }) => {
            const shortcut = registeredShortcuts[id];
            if (shortcut) {
                registerGlobalShortcut(id, shortcut.currentKeys);
            }
        });

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            shortcuts.forEach(({ id }) => {
                const shortcut = registeredShortcuts[id];
                if (shortcut) {
                    unregisterGlobalShortcut(id, shortcut.currentKeys);
                }
            });
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [shortcuts, registeredShortcuts, isEditing]);
}
