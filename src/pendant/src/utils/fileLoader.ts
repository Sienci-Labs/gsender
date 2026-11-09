import {
    GcodeFilePayload,
    isElectron,
    pickGcodeFile,
} from '../electron-bridge';
import { applyGcodePayload } from './gcodeProcessing';

export async function applyGcodeFile(payload: GcodeFilePayload) {
    await applyGcodePayload(payload);
}

export async function openGcodeFile(): Promise<GcodeFilePayload | undefined> {
    if (!isElectron()) return undefined;
    try {
        const picked = await pickGcodeFile();
        if (!picked) return undefined;
        void applyGcodeFile(picked);
        return picked;
    } catch {
        return undefined;
    }
}

// Outside Electron (a plain browser, or the Android WebView - which injects
// no pendantAPI, so isElectron() is false there too) there's no native picker
// IPC to call. Fall back to clicking a hidden <input type="file">, which the
// WebView answers with the system document picker (see MainActivity.kt's
// onShowFileChooser) and a browser answers with its own file dialog.
export async function openGcodeFileOrPrompt(
    fileInput: HTMLInputElement | null,
): Promise<GcodeFilePayload | undefined> {
    if (!isElectron()) {
        fileInput?.click();
        return undefined;
    }
    return openGcodeFile();
}

// Pairs with openGcodeFileOrPrompt: handles the hidden <input>'s onChange.
export async function applyPickedFile(file: File): Promise<GcodeFilePayload> {
    const content = await file.text();
    const payload: GcodeFilePayload = {
        name: file.name,
        size: file.size,
        content,
        path: String((file as { path?: string }).path || ''),
    };
    void applyGcodeFile(payload);
    return payload;
}
