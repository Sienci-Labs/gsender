import controller from '@gsender/controller-client/controller';
import { VISUALIZER_PRIMARY } from 'app/constants';
import { store as reduxStore } from '@gsender/controller-client/store/redux';
import {
    updateFileContent,
    updateFileInfo,
} from '@gsender/controller-client/store/redux/slices/fileInfo.slice';
import { GcodeFilePayload, isElectron, pickGcodeFile } from '../electron-bridge';

export function computeBounds(content: string) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const raw of content.split('\n')) {
        const line = raw.trim().toUpperCase();
        if (!/^G[0123]\b/.test(line)) continue;
        const xm = line.match(/X([+-]?\d*\.?\d+)/); if (xm) { const v = parseFloat(xm[1]); minX = Math.min(minX, v); maxX = Math.max(maxX, v); }
        const ym = line.match(/Y([+-]?\d*\.?\d+)/); if (ym) { const v = parseFloat(ym[1]); minY = Math.min(minY, v); maxY = Math.max(maxY, v); }
        const zm = line.match(/Z([+-]?\d*\.?\d+)/); if (zm) { const v = parseFloat(zm[1]); minZ = Math.min(minZ, v); maxZ = Math.max(maxZ, v); }
    }
    if (!isFinite(minX)) return null;
    const safeZ = isFinite(minZ);
    return {
        min: { x: minX, y: isFinite(minY) ? minY : 0, z: safeZ ? minZ : 0 },
        max: { x: maxX, y: isFinite(maxY) ? maxY : 0, z: safeZ ? maxZ : 0 },
        delta: { x: maxX - minX, y: isFinite(minY) ? maxY - minY : 0, z: safeZ ? maxZ - minZ : 0 },
    };
}

function uploadToServer(name: string, content: string) {
    if (!controller.port) return;
    const gcodeFile = new File([content], name, { type: 'text/plain' });
    const formData = new FormData();
    formData.append('gcode', gcodeFile);
    formData.append('port', controller.port);
    formData.append('visualizer', VISUALIZER_PRIMARY);
    fetch('/api/file', { method: 'POST', body: formData }).catch(() => {});
}

export function applyGcodeFile(payload: GcodeFilePayload) {
    const { name, size, content, path } = payload;
    const total = content.split('\n').filter((line) => line.trim()).length;
    const toolSet = [...new Set((content.match(/\bT(\d+)/gi) ?? []).map((t) => t.toUpperCase()))];
    const spindleSet = [...new Set((content.match(/\bS(\d+)/gi) ?? []).map((s) => `S${parseInt(s.slice(1))}`))];
    const bbox = computeBounds(content);
    reduxStore.dispatch(updateFileContent({ content, size, name }));
    reduxStore.dispatch(updateFileInfo({
        total,
        toolSet,
        spindleSet,
        fileLoaded: true,
        path,
        ...(bbox ? { bbox } : {}),
    }));
    uploadToServer(name, content);
}

export async function openGcodeFile(): Promise<GcodeFilePayload | undefined> {
    if (!isElectron()) return undefined;
    try {
        const picked = await pickGcodeFile();
        if (!picked) return undefined;
        applyGcodeFile(picked);
        return picked;
    } catch {
        return undefined;
    }
}
