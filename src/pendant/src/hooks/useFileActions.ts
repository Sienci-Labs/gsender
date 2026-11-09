import { actions as remoteFileReceiveActions } from 'app/features/RemoteFileReceive/apiActions';
import { toast } from 'app/lib/toaster';
import { store as reduxStore } from 'app/store/redux';
import { unloadFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import pubsub from 'pubsub-js';
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
    /** Where the file came from - drives the recent-row icon. Absent/'local'
     * means opened on this device; 'remote' means received from a desktop
     * via Send to Pendant. */
    source?: 'local' | 'remote';
    /** Server-side incoming/ filename (remote entries only), used to
     * refetch the file's content on demand via the Remote File Receive API. */
    savedName?: string;
};

export const RECENT_KEY = 'pendant-recent-files';
const RECENT_FILES_UPDATED = 'pendant-recent-files-updated';

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
            source: entry.source === 'remote' ? 'remote' : 'local',
            savedName: entry.savedName || '',
        }))
        .slice(0, 5);
};

/** Whether a recent-file row can be reloaded (same rule as handleRecentLoad):
 * a remote entry refetches its content from the server on demand, so it's
 * always loadable; otherwise Electron rereads the path and anywhere else
 * needs the page's own copy. */
export const canLoadRecent = (recentFile: RecentFile) =>
    recentFile.source === 'remote'
        ? true
        : isElectron()
          ? !!recentFile.filePath
          : !!recentFile.cacheKey;

const entryKey = (r: RecentFile) =>
    r.filePath?.trim()
        ? `path:${r.filePath}`
        : r.cacheKey
          ? `cache:${r.cacheKey}`
          : `name:${r.fileName}`;

/**
 * Persists a recent-file entry and broadcasts the update, so every mounted
 * useFileActions() instance (File tab, bottom drawer) stays in sync even when
 * the entry was recorded from somewhere else entirely - e.g. a remote file
 * arriving while neither is the active screen (IncomingFileRecents.tsx).
 */
export const saveRecentFileEntry = (entry: RecentFile): RecentFile[] => {
    const stored = readRecentFiles();
    const key = entryKey(entry);
    const updated = [
        entry,
        ...stored.filter((r) => entryKey(r) !== key),
    ].slice(0, 5);

    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    if (!isElectron()) {
        pruneRecentFileCache(
            updated.map((r) => r.cacheKey || '').filter(Boolean),
        );
    }
    pubsub.publish(RECENT_FILES_UPDATED, updated);
    return updated;
};

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

    // Keeps this instance's list in sync with entries recorded by any other
    // useFileActions() instance, or by IncomingFileRecents.tsx.
    useEffect(() => {
        const token = pubsub.subscribe(
            RECENT_FILES_UPDATED,
            (_msg: string, files: RecentFile[]) => setRecentFiles(files),
        );
        return () => pubsub.unsubscribe(token);
    }, []);

    const saveRecentEntry = (entry: RecentFile) => {
        setRecentFiles(saveRecentFileEntry(entry));
    };

    const applyLoadedFile = (
        payload: GcodeFilePayload,
        cacheKey = '',
        source: RecentFile['source'] = 'local',
        savedName = '',
    ) => {
        applyGcodeFile(payload);
        const timeLoaded = Date.now();
        setLoadedAt(timeLoaded);
        saveRecentEntry({
            fileName: payload.name,
            fileSize: payload.size,
            timeLoaded,
            filePath: payload.path,
            cacheKey,
            source,
            savedName,
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
        if (recentFile.source === 'remote') {
            if (!recentFile.savedName) {
                toast.error(`Could not open ${recentFile.fileName}`);
                return;
            }
            const result = await remoteFileReceiveActions.readFile(
                recentFile.savedName,
            );
            if (!result) {
                toast.error(`Could not open ${recentFile.fileName}`);
                return;
            }
            applyLoadedFile(
                {
                    name: recentFile.fileName,
                    size: recentFile.fileSize,
                    content: result.gcode,
                    path: '',
                },
                '',
                'remote',
                recentFile.savedName,
            );
            return;
        }

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
                recentFile.source,
                recentFile.savedName,
            );
            return;
        }

        if (!recentFile.filePath) return;
        try {
            const loaded = await readGcodeFile(recentFile.filePath);
            if (loaded) {
                applyLoadedFile(loaded, '', recentFile.source, recentFile.savedName);
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
