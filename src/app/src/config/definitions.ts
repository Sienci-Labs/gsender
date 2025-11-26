export interface ConfigSettings {
    error: {
        corruptedWorkspaceSettings: boolean;
    };
    name: string;
    productName: string;
    version: string;
    webroot: string;
    log: {
        level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    };
}
