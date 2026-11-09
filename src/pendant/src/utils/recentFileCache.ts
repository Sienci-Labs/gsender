/**
 * Copies of recently opened files, so the recent list can reopen them outside
 * Electron (Android WebView, browsers). There a picked file has no path to
 * read again, so the page keeps the bytes itself in IndexedDB.
 *
 * Every call fails soft: no IndexedDB (private mode, jsdom), a quota error or
 * a missing entry just means the row can't reload.
 */

const DB_NAME = 'pendant-recent-files';
const STORE = 'files';
/** Bigger files aren't kept; reopening them goes through the picker. */
export const MAX_CACHED_BYTES = 64 * 1024 * 1024;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    // Let a later call retry after a failed open
    dbPromise.catch(() => {
        dbPromise = null;
    });
    return dbPromise;
};

const run = async <T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
    const db = await openDb();
    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
};

export const recentCacheKey = (name: string, size: number, modified = 0) =>
    `${name}|${size}|${modified}`;

/** Stores the content; resolves true only if it was kept. */
export const cacheRecentFile = async (
    key: string,
    content: string,
): Promise<boolean> => {
    const blob = new Blob([content], { type: 'text/plain' });
    if (blob.size > MAX_CACHED_BYTES) return false;
    try {
        await run('readwrite', (s) => s.put(blob, key));
        return true;
    } catch {
        return false;
    }
};

export const readCachedRecentFile = async (
    key: string,
): Promise<string | null> => {
    try {
        const blob = await run<Blob | undefined>('readonly', (s) =>
            s.get(key),
        );
        return blob ? await blob.text() : null;
    } catch {
        return null;
    }
};

/** Drops every copy whose key isn't in `keep`. */
export const pruneRecentFileCache = async (keep: string[]) => {
    try {
        const keys = await run('readonly', (s) => s.getAllKeys());
        const stale = keys.filter((k) => !keep.includes(String(k)));
        if (!stale.length) return;
        await run('readwrite', (s) => {
            let last: IDBRequest<undefined> | null = null;
            for (const k of stale) last = s.delete(k);
            return last as IDBRequest<undefined>;
        });
    } catch {
        // no-op
    }
};
