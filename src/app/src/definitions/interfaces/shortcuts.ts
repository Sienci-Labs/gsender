import { SHORTCUT_CATEGORY_T } from "../types"

export interface CommandKey {
    cmd: string
    keys: string,
    isActive: boolean
    title: string,
    payload: object,
    preventDefault: false,
    category: SHORTCUT_CATEGORY_T,
    callback: Function
};

export interface CommandKeys {
    [key: string]: CommandKey | undefined
};

export interface ShuttleEvent {
    title: string,
    keys: string,
    gamepadKeys: string,
    keysName: string,
    cmd: string,
    payload: object,
    preventDefault: false,
    isActive: true,
    category: SHORTCUT_CATEGORY_T,
    callback: Function
};

export interface ShuttleControlEvents {
    [key: string]: ShuttleEvent | Function,
    MACRO: Function
};

export interface Macro {
    id: string,
    mtime: string,
    name: string,
    content: string,
    description: string,
    column: string,
    rowIndex: number
};

export interface Shortcut {
    keys: string,
    callback: Function
};