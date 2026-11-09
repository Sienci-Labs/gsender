/**
 * Languages offered in Settings → Basics → Language.
 *
 * To add a language:
 *   1. Copy `locales/en/` to `locales/<code>/` and translate the values.
 *   2. Add an entry below (use the language's own name for `nativeName`).
 *   3. Run `yarn i18n:status` to check coverage.
 *
 * See TRANSLATING.md at the repo root for the full guide.
 */

export interface SupportedLanguage {
    code: string;
    nativeName: string;
}

export const SOURCE_LANGUAGE = 'en';

/** Stored preference meaning "follow the operating system's language". */
export const LANGUAGE_SYSTEM = 'system';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'en', nativeName: 'English' },
    { code: 'de', nativeName: 'Deutsch' },
    { code: 'es', nativeName: 'Español' },
    { code: 'fr', nativeName: 'Français' },
    { code: 'it', nativeName: 'Italiano' },
    { code: 'ru', nativeName: 'Русский' },
];

export const getAvailableLanguages = (): SupportedLanguage[] =>
    SUPPORTED_LANGUAGES;

/**
 * Resolves a stored preference to a supported language code.
 * LANGUAGE_SYSTEM (or anything unsupported) follows the system language.
 */
export const resolveLanguage = (
    preference: string | undefined | null,
    systemLanguages: readonly string[] = typeof navigator !== 'undefined'
        ? (navigator.languages ?? [navigator.language])
        : [],
): string => {
    const available = getAvailableLanguages().map((l) => l.code);
    if (preference && available.includes(preference)) {
        return preference;
    }
    for (const lang of systemLanguages) {
        if (!lang) {
            continue;
        }
        const base = lang.toLowerCase().split('-')[0];
        const match = available.find((code) => code.toLowerCase() === base);
        if (match) {
            return match;
        }
    }
    return SOURCE_LANGUAGE;
};
