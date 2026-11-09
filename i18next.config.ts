// i18next-cli configuration — see TRANSLATING.md.
//   yarn i18n:extract   add new keys from the code to the locale files
//   yarn i18n:status    translation coverage per language
//   yarn i18n:check     CI gate (keys in sync, placeholders, no new hardcoded text)
// Plain object (no defineConfig import) so CI can run the CLI via npx
// without installing the whole app.
export default {
    // Keep in sync with src/app/src/i18n/languages.ts
    locales: ['en', 'de', 'es', 'fr', 'it', 'ru'],
    extract: {
        input: ['src/app/src/**/*.{ts,tsx}', 'src/pendant/src/**/*.{ts,tsx}'],
        ignore: [
            '**/__tests__/**',
            '**/*.test.{ts,tsx}',
            '**/__mocks__/**',
            'src/app/src/i18n/**',
        ],
        output: 'src/app/src/i18n/locales/{{language}}/{{namespace}}.json',
        // tk() marks keys in module-level data (see src/app/src/i18n/index.ts)
        functions: ['t', '*.t', 'tk'],
        defaultNS: 'common',
        nsSeparator: ':',
        keySeparator: '.',
        indentation: 2,
        sort: false,
        primaryLanguage: 'en',
        // Untranslated strings stay empty and fall back to English at runtime.
        defaultValue: '',
        // Never delete keys automatically; `yarn i18n:unused` lists candidates.
        removeUnusedKeys: false,
        // Keys built at runtime that static analysis can't see.
        preservePatterns: [
            'helper:alarm.*',
            'helper:error.*',
            'config:firmware.*',
        ],
        extractFromComments: false,
    },
    lint: {
        ignore: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/__mocks__/**'],
        ignoredAttributes: [
            'data-testid',
            'className',
            'id',
            'key',
            'href',
            'to',
        ],
        checkConcatenation: 'warn',
        checkTranslationPlaceholders: 'error',
        // Existing untagged text is recorded here; only NEW hardcoded text
        // fails `yarn i18n:check`. Refresh with `yarn i18n:baseline` after
        // tagging an area.
        baseline: 'src/app/src/i18n/lint-baseline.json',
    },
    status: {
        checkIdentical: 'warn',
    },
};
