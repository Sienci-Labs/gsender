import { store as reduxStore } from 'app/store/redux';
import { unloadFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import { useEffect, useRef, useState } from 'react';
import {
    type GcodeFilePayload,
    isElectron,
    pickGcodeFile,
    readGcodeFile,
} from '../electron-bridge';
import { applyGcodeFile } from '../utils/fileLoader';
import { cancelGcodeProcessing } from '../utils/gcodeProcessing';
import {
    cacheRecentFile,
    pruneRecentFileCache,
    readCachedRecentFile,
    recentCacheKey,
} from '../utils/recentFileCache';

export type RecentFile = {
    fileName: string;
    fileSize: number;
    timeLoaded: number;
    filePath?: string;
    /** Key of the page's own copy (recentFileCache), outside Electron. */
    cacheKey?: string;
};

export const RECENT_KEY = 'pendant-recent-files';

export const GCODE_ACCEPT = '.gcode,.nc,.tap,.cnc,.g,.gc';

export const readRecentFiles = (): RecentFile[] => {
    const raw = JSON.parse(
        localStorage.getItem(RECENT_KEY) ?? '[]',
    ) as Partial<RecentFile>[];
    return raw
        .map((entry) => ({
            fileName: entry.fileName ?? '',
            fileSize: Number(entry.fileSize) || 0,
            timeLoaded: Number(entry.timeLoaded) || 0,
            filePath: entry.filePath || '',
            cacheKey: entry.cacheKey || '',
        }))
        .slice(0, 5);
};

/** Whether a recent-file row can be reloaded (same rule as handleRecentLoad):
 * Electron rereads the path, anywhere else needs the page's own copy. */
export const canLoadRecent = (recentFile: RecentFile) =>
    isElectron() ? !!recentFile.filePath : !!recentFile.cacheKey;

const entryKey = (r: RecentFile) =>
    r.filePath?.trim()
        ? `path:${r.filePath}`
        : r.cacheKey
          ? `cache:${r.cacheKey}`
          : `name:${r.fileName}`;

/**
 * File open / close / recent-files logic from the pendant's File drawer.
 * The returned fileInputRef must be attached to a hidden
 * <input type="file" onChange={handleFileChange}> (the browser fallback).
 */
export function useFileActions() {
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [loadedAt, setLoadedAt] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const normalized = readRecentFiles();
        localStorage.setItem(RECENT_KEY, JSON.stringify(normalized));
        setRecentFiles(normalized);
    }, []);

    const saveRecentEntry = (entry: RecentFile) => {
        const stored = readRecentFiles();
        const key = entryKey(entry);
        const updated = [
            entry,
            ...stored.filter((r) => entryKey(r) !== key),
        ].slice(0, 5);

        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        setRecentFiles(updated);
        if (!isElectron()) {
            pruneRecentFileCache(
                updated.map((r) => r.cacheKey || '').filter(Boolean),
            );
        }
    };

    const applyLoadedFile = (payload: GcodeFilePayload, cacheKey = '') => {
        applyGcodeFile(payload);
        const timeLoaded = Date.now();
        setLoadedAt(timeLoaded);
        saveRecentEntry({
            fileName: payload.name,
            fileSize: payload.size,
            timeLoaded,
            filePath: payload.path,
            cacheKey,
        });
    };

    const handleLoadClick = async () => {
        if (!isElectron()) {
            fileInputRef.current?.click();
            return;
        }

        try {
            const picked = await pickGcodeFile();
            if (!picked) return;
            applyLoadedFile(picked);
        } catch (_error) {
            // no-op: picker cancelled/failed
        }
    };

    const handleUnload = () => {
        cancelGcodeProcessing();
        reduxStore.dispatch(unloadFileInfo());
        setLoadedAt(null);
    };

    const applyBrowserFile = async (f: File) => {
        const content = await f.text();
        const path = String((f as any).path || '');
        // A picked file has no path to reread outside Electron, so keep a
        // copy for the recent list (skipped for very large files)
        let cacheKey = '';
        if (!isElectron()) {
            const key = recentCacheKey(f.name, f.size, f.lastModified);
            if (await cacheRecentFile(key, content)) cacheKey = key;
        }
        applyLoadedFile({ name: f.name, size: f.size, content, path }, cacheKey);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        e.target.value = '';
        await applyBrowserFile(f);
    };

    const handleRecentLoad = async (recentFile: RecentFile) => {
        if (!isElectron()) {
            const key = recentFile.cacheKey;
            if (!key) return;
            const content = await readCachedRecentFile(key);
            if (content === null) {
                // Copy gone (storage cleared): the row can't reload any more
                saveRecentEntry({ ...recentFile, cacheKey: '' });
                return;
            }
            applyLoadedFile(
                {
                    name: recentFile.fileName,
                    size: recentFile.fileSize,
                    content,
                    path: '',
                },
                key,
            );
            return;
        }

        if (!recentFile.filePath) return;
        try {
            const loaded = await readGcodeFile(recentFile.filePath);
            if (loaded) {
                applyLoadedFile(loaded);
            }
        } catch (_error) {
            // no-op: file missing/unreadable
        }
    };

    return {
        recentFiles,
        loadedAt,
        fileInputRef,
        handleLoadClick,
        handleUnload,
        handleFileChange,
        handleRecentLoad,
        applyBrowserFile,
    };
}

export type FileActions = ReturnType<typeof useFileActions>;
