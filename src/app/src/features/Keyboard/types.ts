import { SHORTCUT_CATEGORY } from 'app/constants';

export type ShortcutCategory = keyof typeof SHORTCUT_CATEGORY;

export type KeyboardShortcut = {
    id: string;
    title: string;
    description?: string;
    defaultKeys: string;
    currentKeys: string;
    category: ShortcutCategory;
    actionId: string;
    isActive: boolean;
    preventDefault?: boolean;
};

export type KeyboardShortcutsState = {
    shortcuts: Record<string, KeyboardShortcut>;
    isEditing: boolean;
};

export type ShortcutUpdatePayload = Partial<Omit<KeyboardShortcut, 'id'>>;

export type ShortcutActions = {
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
};

export interface RegisterShortcutOptions {
    id: string;
    description?: string;
    defaultKeys: string;
    category: string;
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyDownHold?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
}
