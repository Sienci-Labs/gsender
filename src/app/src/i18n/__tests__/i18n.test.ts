import fs from 'fs';
import path from 'path';
import {
    changeLanguage,
    i18n,
    resolveLanguage,
    SUPPORTED_LANGUAGES,
    tk,
    translateKey,
} from 'app/i18n';

const LOCALES = path.join(__dirname, '..', 'locales');

// Flattens nested JSON into dotted keys.
const flatten = (
    obj: Record<string, unknown>,
    prefix = '',
): Record<string, string> =>
    Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object') {
            Object.assign(acc, flatten(v as Record<string, unknown>, key));
        } else {
            acc[key] = String(v);
        }
        return acc;
    }, {});

const placeholders = (s: string) =>
    (s.match(/{{\s*[\w.]+\s*}}/g) ?? [])
        .map((p) => p.replace(/\s/g, ''))
        .sort();

afterEach(async () => {
    await changeLanguage('en');
});

describe('resolveLanguage', () => {
    it('uses an explicit supported preference', () => {
        expect(resolveLanguage('fr', ['de-DE'])).toBe('fr');
    });

    it('follows the system language when the preference is empty', () => {
        expect(resolveLanguage('', ['de-AT', 'en-US'])).toBe('de');
    });

    it('falls back to English for unsupported languages', () => {
        expect(resolveLanguage('', ['ja-JP'])).toBe('en');
        expect(resolveLanguage('xx', [])).toBe('en');
    });
});

describe('translation helpers', () => {
    it('translates marked keys and passes other text through', () => {
        expect(translateKey(tk('common:actions.cancel'))).toBe('Cancel');
        expect(translateKey('Homing cycle enable')).toBe('Homing cycle enable');
        expect(translateKey('Note: firmware text')).toBe('Note: firmware text');
        expect(translateKey(undefined)).toBe('');
    });

    it('ignores the array index when used as a map callback', () => {
        // .map passes (value, index); index 1 used to reach i18next as lng
        // and crash Config with "lng?.toLowerCase is not a function".
        const keys = [tk('common:actions.cancel'), tk('common:actions.cancel')];
        expect(keys.map(translateKey as never)).toEqual(['Cancel', 'Cancel']);
    });

    it('switches language at runtime and falls back to English', async () => {
        await changeLanguage('de');
        expect(i18n.t('common:actions.cancel')).toBe('Abbrechen');
        expect(document.documentElement.lang).toBe('de');
    });
});

describe('language registry', () => {
    const registered = SUPPORTED_LANGUAGES.map((l) => l.code).sort();

    it('matches the locales in i18next.config.ts', () => {
        const config = fs.readFileSync(
            path.join(__dirname, '../../../../../i18next.config.ts'),
            'utf8',
        );
        const locales = /locales:\s*\[([^\]]*)\]/
            .exec(config)?.[1]
            .match(/'([^']+)'/g)
            ?.map((s) => s.slice(1, -1))
            .sort();
        expect(locales).toEqual(registered);
    });

    it('has a locale folder for every language', () => {
        for (const code of registered) {
            expect([code, fs.existsSync(path.join(LOCALES, code))]).toEqual([
                code,
                true,
            ]);
        }
    });
});

describe('locale files', () => {
    const en = fs
        .readdirSync(path.join(LOCALES, 'en'))
        .filter((f) => f.endsWith('.json'));
    const languages = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en').map(
        (l) => l.code,
    );

    it.each(languages)(
        '%s has no keys or placeholders English lacks',
        (lng) => {
            for (const file of en) {
                const target = path.join(LOCALES, lng, file);
                if (!fs.existsSync(target)) {
                    continue;
                }
                const source = flatten(
                    JSON.parse(
                        fs.readFileSync(path.join(LOCALES, 'en', file), 'utf8'),
                    ),
                );
                const translated = flatten(
                    JSON.parse(fs.readFileSync(target, 'utf8')),
                );
                for (const [key, value] of Object.entries(translated)) {
                    const base = key.replace(
                        /_(zero|one|two|few|many|other)$/,
                        '_other',
                    );
                    const sourceValue = source[key] ?? source[base];
                    expect([file, key, sourceValue !== undefined]).toEqual([
                        file,
                        key,
                        true,
                    ]);
                    if (value) {
                        expect([file, key, placeholders(value)]).toEqual([
                            file,
                            key,
                            placeholders(sourceValue),
                        ]);
                    }
                }
            }
        },
    );
});
