import { GcodeFilePayload, isElectron, pickGcodeFile } from '../electron-bridge';
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
