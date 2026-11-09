/**
 * gSender internationalization.
 *
 * Always write keys with their namespace (`config:basics.units.label`):
 * the app compiles with strictNullChecks off, and i18next's types only accept
 * namespace-relative keys under strict null checks.
 *
 * - In components: `const { t } = useAppTranslation(); t('config:basics.units.label')`
 * - Inline markup: `<TransKey i18nKey="helper:wizard.oneTimeSetup" components={…} />`
 * - Outside React (toasts, dialogs, utils): `i18n.t('notifications:gcode.copied')`
 * - In module-level data (e.g. SettingsMenu): `tk('config:basics.units.label')`.
 *   tk() only marks and type-checks the key; translate it where it's rendered.
 *
 * See TRANSLATING.md at the repo root.
 */
import i18n, { type ParseKeys } from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
    LANGUAGE_SYSTEM,
    PSEUDO_LANGUAGE,
    resolveLanguage,
    SOURCE_LANGUAGE,
    SUPPORTED_LANGUAGES,
} from './languages';
import { loadLocale } from './loadLocale';
import { NAMESPACES, type Namespace, resources } from './locales/en';
import { pseudoPostProcessor } from './pseudo';

export { i18n };
export type { Namespace };
export * from './languages';
export { TransKey, useAppTranslation } from './hooks';

/** Any translation key, written with its namespace prefix (`ns:key`). */
export type TranslationKey = ParseKeys<Namespace[]>;

/**
 * Marks a translation key in data that is defined at module load (before
 * a language is chosen). Returns the key unchanged; translate it at render
 * time with `t(key)` or `translateKey(key)`.
 */
export const tk = <const K extends TranslationKey>(key: K): K => key;

/**
 * Translates a value that is either a key marked with tk() or plain text
 * from elsewhere (e.g. a description supplied by the controller's firmware).
 * Plain text is returned unchanged. Pass `lng` to force a language.
 */
export const translateKey = (
    value: string | undefined | null,
    lng?: string,
): string => {
    if (!value) {
        return '';
    }
    if (!value.includes(':') || !i18n.exists(value)) {
        return value;
    }
    // biome-ignore lint/suspicious/noExplicitAny: key validated by i18n.exists
    return i18n.t(value as any, lng ? { lng } : undefined) as string;
};

/** English text for a key, for logs and support reports. */
export const toEnglish = (value: string | undefined | null): string =>
    translateKey(value, SOURCE_LANGUAGE);

const loaded = new Set<string>([SOURCE_LANGUAGE, PSEUDO_LANGUAGE]);

const ensureLoaded = async (lng: string): Promise<void> => {
    if (loaded.has(lng)) {
        return;
    }
    try {
        const bundles = await loadLocale(lng);
        for (const [ns, bundle] of Object.entries(bundles)) {
            i18n.addResourceBundle(lng, ns, bundle, true, true);
        }
        loaded.add(lng);
    } catch (err) {
        console.error(`Failed to load language "${lng}"`, err);
    }
};

const applyDocumentLanguage = (lng: string): void => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lng;
    }
};

/**
 * Initializes i18next with the user's preference (see LANGUAGE_SYSTEM).
 * Call once at startup, after the store has loaded and before rendering.
 */
export const initI18n = async (preference?: string): Promise<typeof i18n> => {
    const lng = resolveLanguage(preference);
    if (!i18n.isInitialized) {
        await i18n
            .use(initReactI18next)
            .use(pseudoPostProcessor)
            .init({
                resources: { [SOURCE_LANGUAGE]: resources },
                lng: SOURCE_LANGUAGE,
                fallbackLng: SOURCE_LANGUAGE,
                supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
                ns: NAMESPACES,
                defaultNS: 'common',
                // Empty strings in a translation file fall back to English.
                returnEmptyString: false,
                returnNull: false,
                interpolation: { escapeValue: false },
                postProcess: ['pseudo'],
                react: { useSuspense: false },
                // English is bundled, so initialize synchronously.
                initAsync: false,
            });
    }
    await changeLanguage(lng);
    return i18n;
};

export const changeLanguage = async (lng: string): Promise<void> => {
    await ensureLoaded(lng);
    if (i18n.language !== lng) {
        await i18n.changeLanguage(lng);
    }
    applyDocumentLanguage(lng);
};

interface LanguageStore {
    get: (key: string, defaultValue?: unknown) => unknown;
    on: (event: string, listener: (...args: unknown[]) => void) => unknown;
}

/**
 * Keeps i18next in step with `workspace.language`, including changes made
 * on another client (they arrive through the store's 'replace' event).
 */
export const watchLanguagePreference = (store: LanguageStore): void => {
    let current = store.get('workspace.language', LANGUAGE_SYSTEM) as string;
    const onChange = () => {
        const next = store.get('workspace.language', LANGUAGE_SYSTEM) as string;
        if (next === current) {
            return;
        }
        current = next;
        changeLanguage(resolveLanguage(next));
    };
    store.on('change', onChange);
    store.on('replace', onChange);
};

export default i18n;
