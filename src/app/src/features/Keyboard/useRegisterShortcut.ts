import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from 'app/store/redux';
import { registerShortcut } from 'app/store/redux/slices/keyboardShortcutsSlice';

import { RegisterShortcutOptions } from './types';
import {
    matchesShortcut,
    registerGlobalShortcut,
    unregisterGlobalShortcut,
} from './utils/keyboardUtils';
import { actionRegistry } from './utils/actionRegistry';
import { ShortcutCategory } from './types';

export function useRegisterShortcut({
    id,
    description,
    defaultKeys,
    category,
    onKeyDown,
    onKeyDownHold,
    onKeyUp,
}: RegisterShortcutOptions) {
    const dispatch = useDispatch();
    const shortcut = useSelector(
        (state: RootState) => state.keyboardShortcuts.shortcuts[id],
    );
    const isEditing = useSelector(
        (state: RootState) => state.keyboardShortcuts.isEditing,
    );

    useEffect(() => {
        // Register the shortcut in Redux store
        dispatch(
            registerShortcut({
                id,
                title: description || id,
                description,
                defaultKeys,
                currentKeys: defaultKeys,
                category: category as ShortcutCategory,
                actionId: id,
                isActive: true,
                preventDefault: true,
            }),
        );

        // Register the actions in the action registry
        actionRegistry.register(id, {
            onKeyDown,
            onKeyDownHold,
            onKeyUp,
        });

        return () => {
            actionRegistry.unregister(id);
        };
    }, [
        id,
        description,
        defaultKeys,
        category,
        onKeyDown,
        onKeyDownHold,
        onKeyUp,
        dispatch,
    ]);

    // Handle keyboard events
    useEffect(() => {
        if (!shortcut?.isActive || isEditing) {
            unregisterGlobalShortcut(id, shortcut?.currentKeys);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (matchesShortcut(e, shortcut.currentKeys)) {
                // if (preventDefault) {
                //     e.preventDefault();
                // }
                actionRegistry.executeKeyDown(id, e);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (matchesShortcut(e, shortcut.currentKeys)) {
                // if (preventDefault) {
                //     e.preventDefault();
                // }
                actionRegistry.executeKeyUp(id, e);
            }
        };

        registerGlobalShortcut(id, shortcut.currentKeys);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            unregisterGlobalShortcut(id, shortcut.currentKeys);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [shortcut?.currentKeys, shortcut?.isActive, isEditing, id]);

    return shortcut;
}
