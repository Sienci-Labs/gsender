// Types every t() call against the English source files, so a mistyped or
// missing key is a compile error.
import 'i18next';
import type { resources } from './locales/en';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: typeof resources;
        returnNull: false;
    }
}
