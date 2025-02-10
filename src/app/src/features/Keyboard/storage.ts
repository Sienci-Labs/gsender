import { KeyboardShortcut } from './types';

const STORAGE_KEY = 'gsender_keyboard_shortcuts';

export const loadShortcuts = (): Record<string, KeyboardShortcut> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load keyboard shortcuts:', error);
    }
    return {};
};

export const saveShortcuts = (
    shortcuts: Record<string, KeyboardShortcut>,
): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    } catch (error) {
        console.error('Failed to save keyboard shortcuts:', error);
    }
};
