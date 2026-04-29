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

/** True when running inside the Tauri native binary. */
export { isTauri };
