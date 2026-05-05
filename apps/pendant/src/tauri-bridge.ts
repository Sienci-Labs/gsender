/**
 * Thin wrapper around Tauri's invoke bridge.
 * Gracefully no-ops in browser/dev mode (no Tauri runtime present).
 */

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
    if (!isTauri()) return undefined;
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return tauriInvoke<T>(cmd, args);
}

/** Returns the stored gSender host (e.g. "192.168.1.100:8000"). */
export async function getHost(): Promise<string | undefined> {
    return invoke<string>('get_host');
}

/**
 * Updates the stored gSender host and navigates the window to the new URL.
 * Pendant UI can call this from a settings/connection screen.
 */
export async function setHost(host: string): Promise<void> {
    await invoke<void>('set_host', { host });
}

export interface GcodeFilePayload {
    path: string;
    name: string;
    size: number;
    content: string;
}

/** Opens a native file picker and returns selected G-code file data. */
export async function pickGcodeFile(): Promise<GcodeFilePayload | undefined> {
    return invoke<GcodeFilePayload | undefined>('pick_gcode_file');
}

/** Reads a G-code file from an absolute path on disk. */
export async function readGcodeFile(path: string): Promise<GcodeFilePayload | undefined> {
    return invoke<GcodeFilePayload | undefined>('read_gcode_file', { path });
}

/** True when running inside the Tauri native binary. */
export { isTauri };
