// app/store saves user preferences to localStorage['sienci'] and reads them back
// when first imported. Vitest runs story files in parallel on one origin, so
// without this one file's preferences (units, shortcuts...) leak into another's
// starting state. Start every page from the app defaults and never persist.
// Must run before app/store is imported: it's the first import in preview.jsx
// and a Vitest setup file.
const STORE_KEY = 'sienci';

try {
    window.localStorage.removeItem(STORE_KEY);
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
        if (this === window.localStorage && key === STORE_KEY) {
            return;
        }
        return setItem.call(this, key, value);
    };
} catch {
    // Storage unavailable (e.g. blocked); app/store then starts from defaults anyway
}
