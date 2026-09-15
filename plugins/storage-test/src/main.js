import { storage } from '@sienci/gsender-plugin-sdk';

import './style.css';

const output = document.getElementById('output');
const currentStorage = document.getElementById('current-storage');
const keyInput = document.getElementById('key-input');
const valueInput = document.getElementById('value-input');
const defaultInput = document.getElementById('default-input');
const wholeObjectInput = document.getElementById('whole-object-input');

// Best-effort JSON parse so numbers/booleans/objects round-trip cleanly;
// anything that doesn't parse is stored as a plain string.
const parseLoosely = (raw) => {
    if (raw === '') {
        return undefined;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
};

const renderResult = (label, result) => {
    if (!output) return;
    output.textContent = `${label}\n${JSON.stringify(result, null, 2)}`;
};

const renderError = (label, err) => {
    if (!output) return;
    output.textContent = `${label}\nError: ${err instanceof Error ? err.message : String(err)}`;
};

const refreshCurrentStorage = async () => {
    if (!currentStorage) return;
    try {
        const all = await storage.getAll();
        currentStorage.textContent = JSON.stringify(all, null, 2);
    } catch (err) {
        currentStorage.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
};

const requireKey = () => {
    const key = keyInput?.value.trim();
    if (!key) {
        throw new Error('Enter a key first');
    }
    return key;
};

document.getElementById('get-btn')?.addEventListener('click', async () => {
    try {
        const key = requireKey();
        const defaultValue = parseLoosely(defaultInput?.value ?? '');
        const result = await storage.get(key, defaultValue);
        renderResult(`get("${key}")`, result);
    } catch (err) {
        renderError('get', err);
    }
});

document.getElementById('set-btn')?.addEventListener('click', async () => {
    try {
        const key = requireKey();
        const value = parseLoosely(valueInput?.value ?? '');
        await storage.set(key, value);
        renderResult(`set("${key}", ...)`, { ok: true, value });
        await refreshCurrentStorage();
    } catch (err) {
        renderError('set', err);
    }
});

document.getElementById('delete-btn')?.addEventListener('click', async () => {
    try {
        const key = requireKey();
        await storage.delete(key);
        renderResult(`delete("${key}")`, { ok: true });
        await refreshCurrentStorage();
    } catch (err) {
        renderError('delete', err);
    }
});

document.getElementById('get-all-btn')?.addEventListener('click', async () => {
    try {
        const all = await storage.getAll({});
        if (wholeObjectInput) {
            wholeObjectInput.value = JSON.stringify(all, null, 2);
        }
        renderResult('getAll()', all);
    } catch (err) {
        renderError('getAll', err);
    }
});

document.getElementById('set-all-btn')?.addEventListener('click', async () => {
    try {
        const value = JSON.parse(wholeObjectInput?.value || '{}');
        await storage.setAll(value);
        renderResult('setAll(...)', { ok: true, value });
        await refreshCurrentStorage();
    } catch (err) {
        renderError('setAll', err);
    }
});

document.getElementById('clear-btn')?.addEventListener('click', async () => {
    try {
        await storage.clear();
        renderResult('clear()', { ok: true });
        if (wholeObjectInput) {
            wholeObjectInput.value = '{}';
        }
        await refreshCurrentStorage();
    } catch (err) {
        renderError('clear', err);
    }
});

refreshCurrentStorage();
