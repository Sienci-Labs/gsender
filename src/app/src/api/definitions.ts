import { USER_DATA_COLLECTION } from 'app/constants';

// Types

export type USER_DATA_COLLECTION_T =
    (typeof USER_DATA_COLLECTION)[keyof typeof USER_DATA_COLLECTION];

// Interfaces

export interface SigninOptions {
    token?: string;
    name?: string;
    password?: string;
}

export interface StateOptions {
    key?: string;
}

export interface GCodeOptions {
    port?: string;
    name?: string;
    gcode?: string;
    context?: Record<string, unknown>;
}

export interface FetchOptions {
    [key: string]: any;
}

export interface WatchOptions {
    path?: string;
    file?: string;
}
