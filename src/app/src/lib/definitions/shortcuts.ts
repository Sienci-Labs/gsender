import { SHORTCUT_CATEGORY } from '../../constants';
import { BasicObject } from 'app/definitions/general';

// Types

export type SHORTCUT_CATEGORY_T =
    (typeof SHORTCUT_CATEGORY)[keyof typeof SHORTCUT_CATEGORY];

// Interfaces

export interface CommandKey {
    cmd: string;
    keys: string;
    isActive: boolean;
    title: string;
    payload: BasicObject;
    preventDefault: boolean;
    category: SHORTCUT_CATEGORY_T;
    callback: Function;
}

export interface CommandKeys {
    [key: string]: CommandKey | undefined;
}

export interface ShuttleEvent {
    title: string;
    keys: string;
    gamepadKeys?: string;
    keysName?: string;
    cmd: string;
    payload?: BasicObject;
    preventDefault: boolean;
    isActive: boolean;
    category: SHORTCUT_CATEGORY_T;
    callback: (...args: any) => void;
}

export interface ShuttleControlEvents {
    [key: string]: ShuttleEvent | Function;
    MACRO?: Function;
}

export interface Macro {
    id: string;
    mtime: string;
    name: string;
    content: string;
    description: string;
    column: string;
    rowIndex: number;
}

export interface Shortcut {
    keys: string;
    callback: Function;
}
