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
    analytics: {
        trackingId: string | undefined;
    };
    i18next: {
        lowerCaseLng: boolean;
        debug: boolean;
        fallbackLng: string;
        ns: string[];
        defaultNS: string;
        whitelist: string[] | undefined;
        preload: string[];
        load: 'all' | 'currentOnly' | 'languageOnly';
        keySeparator: string;
        nsSeparator: string;
        interpolation: {
            prefix: string;
            suffix: string;
        };
        detection: {
            order: string[];
            lookupQuerystring: string;
            lookupCookie: string;
            lookupLocalStorage: string;
            caches: string[];
        };
        backend: {
            loadPath: string;
            addPath: string;
            allowMultiLoading: boolean;
            parse: (data: string, url: string) => any;
            crossDomain: boolean;
        };
    };
}
