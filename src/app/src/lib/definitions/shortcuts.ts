import type { BasicObject } from 'app/definitions/general';

// Interfaces

export interface CommandKey {
    // we only save these properties in store, even though the shuttle events have more
    category: string;
    cmd: string;
    keys: string;
    isActive: boolean;
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
    category: string;
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
