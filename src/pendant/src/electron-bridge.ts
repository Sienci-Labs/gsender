/**
 * Thin wrapper around the Electron preload bridge (`window.pendantAPI`).
 * Gracefully no-ops in browser/dev mode (Vite-served on :5174 without Electron),
 * letting the pendant SPA fall back to same-origin + native <input type="file">.
 */

export interface GcodeFilePayload {
    path: string;
    name: string;
    size: number;
    content: string;
}

interface PendantAPI {
    isElectron: true;
    getHost: () => Promise<string | undefined>;
    pickGcodeFile: () => Promise<GcodeFilePayload | undefined>;
    readGcodeFile: (path: string) => Promise<  GcodeFilePayload | undefined>;
}

declare global {
    interface Window {
        pendantAPI?: PendantAPI;
    }
}

const api = (): PendantAPI | undefined =>
    typeof window !== 'undefined' ? window.pendantAPI : undefined;

/** True when running inside the Electron pendant binary. */
export const isElectron = (): boolean => !!api()?.isElectron;

/** Returns the stored gSender host (e.g. "127.0.0.1:8000"), or undefined in browser. */
export async function getHost(): Promise<string | undefined> {
    return api()?.getHost();
}

/** Opens a native file picker and returns selected G-code file data. */
export async function pickGcodeFile(): Promise<GcodeFilePayload | undefined> {
    return api()?.pickGcodeFile();
}

/** Reads a G-code file from an absolute path on disk (recent-file reload path). */
export async function readGcodeFile(path: string): Promise<GcodeFilePayload | undefined> {
    return api()?.readGcodeFile(path);
}
