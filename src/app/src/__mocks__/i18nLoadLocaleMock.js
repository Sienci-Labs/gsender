// Jest stand-in for app/i18n/loadLocale (which uses Vite's import.meta.glob).
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales');

module.exports = {
    IS_DEV_BUILD: true,
    loadLocale: async (lng) => {
        const dir = path.join(LOCALES_DIR, lng);
        if (!fs.existsSync(dir)) {
            return {};
        }
        return Object.fromEntries(
            fs
                .readdirSync(dir)
                .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
                .map((f) => [
                    f.replace(/\.json$/, ''),
                    JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
                ]),
        );
    },
};
