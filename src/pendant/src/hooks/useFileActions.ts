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

export type RecentFile = {
    fileName: string;
    fileSize: number;
    timeLoaded: number;
    filePath?: string;
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
        }))
        .slice(0, 5);
};

/** Whether a recent-file row can be reloaded (same rule as handleRecentLoad). */
export const canLoadRecent = (recentFile: RecentFile) =>
    !!recentFile.filePath && isElectron();

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
        const entryKey = entry.filePath?.trim()
            ? `path:${entry.filePath}`
            : `name:${entry.fileName}`;
        const updated = [
            entry,
            ...stored.filter((r) => {
                const existingKey = r.filePath?.trim()
                    ? `path:${r.filePath}`
                    : `name:${r.fileName}`;
                return existingKey !== entryKey;
            }),
        ].slice(0, 5);

        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        setRecentFiles(updated);
    };

    const applyLoadedFile = (payload: GcodeFilePayload) => {
        applyGcodeFile(payload);
        const timeLoaded = Date.now();
        setLoadedAt(timeLoaded);
        saveRecentEntry({
            fileName: payload.name,
            fileSize: payload.size,
            timeLoaded,
            filePath: payload.path,
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
        applyLoadedFile({
            name: f.name,
            size: f.size,
            content,
            path: String((f as any).path || ''),
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        e.target.value = '';
        await applyBrowserFile(f);
    };

    const handleRecentLoad = async (recentFile: RecentFile) => {
        if (!recentFile.filePath) return;

        if (isElectron()) {
            try {
                const loaded = await readGcodeFile(recentFile.filePath);
                if (loaded) {
                    applyLoadedFile(loaded);
                }
            } catch (_error) {
                // no-op: file missing/unreadable
            }
            return;
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
