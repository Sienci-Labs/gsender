// Non-English locale files are code-split by Vite and loaded on demand.
// This module is replaced by a stub under Jest (see jest.config.js), because
// babel-jest can't evaluate `import.meta`.

export const IS_DEV_BUILD = Boolean(import.meta.env.DEV);
type LocaleModule = { default: Record<string, unknown> };

// English is bundled statically (see locales/en/index.ts).
const loaders = import.meta.glob<LocaleModule>([
    './locales/*/*.json',
    '!./locales/en/*.json',
]);

/** Returns `{ [namespace]: resources }` for one language. */
export const loadLocale = async (
    lng: string,
): Promise<Record<string, Record<string, unknown>>> => {
    const prefix = `./locales/${lng}/`;
    const entries = await Promise.all(
        Object.entries(loaders)
            .filter(([path]) => path.startsWith(prefix))
            .map(async ([path, load]) => {
                const ns = path.slice(prefix.length, -'.json'.length);
                const mod = await load();
                return [ns, mod.default] as const;
            }),
    );
    return Object.fromEntries(entries.filter(([ns]) => !ns.startsWith('_')));
};
