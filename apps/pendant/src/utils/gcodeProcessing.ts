import _get from 'lodash/get';
import pubsub from 'pubsub-js';

import store from 'app/store';
import type { BBox } from 'app/definitions/general';
import controller from '@gsender/controller-client/controller';
import { store as reduxStore } from '@gsender/controller-client/store/redux';
import { isLaserMode } from 'app/lib/laserMode';
import { VISUALIZER_PRIMARY } from 'app/constants';
import {
    updateFileContent,
    updateFileInfo,
    updateFileProcessing,
} from '@gsender/controller-client/store/redux/slices/fileInfo.slice';
import {
    getPendantWorkerTheme,
    PENDANT_RAPID_OPACITY,
} from '../visualizerTheme';

type GcodeLoadPayload = {
    content: string;
    name: string;
    size: number;
    path?: string;
};

type VisualizeWorkerProgressMessage = {
    type: 'progress';
    jobId: number;
    progress: number;
};

type VisualizeWorkerGeometryMessage = {
    type: 'geometryReady';
    jobId: number;
    visualizer?: string;
    vertices: ArrayBuffer;
    paths: unknown[];
    frames: ArrayBuffer;
    verticesLen: number;
    framesLen: number;
    colorArrayBuffer: ArrayBuffer;
    colorLen: number;
    savedColorsBuffer: ArrayBuffer;
    savedColorLen: number;
    info: {
        fileModal: string;
        total: number;
        toolSet: string[];
        spindleSet: string[];
        movementSet: string[];
        estimatedTime: number;
        bbox: BBox;
        fileType: string;
        usedAxes: string[];
        invalidLines: string[];
        toolchanges: number[];
        spindleToolEvents: Record<string, unknown>;
    };
    needsVisualization: boolean;
    parsedData: {
        info: unknown;
        invalidLines: string[];
    };
    spindleFrameSpeeds?: ArrayBuffer;
    spindleFrameLen?: number;
    isLaser?: boolean;
    isSecondary?: boolean;
    activeVisualizer?: string;
};

type VisualizeWorkerMetadataMessage = {
    type: 'metadataReady';
    jobId: number;
};

type VisualizeWorkerMessage =
    | VisualizeWorkerProgressMessage
    | VisualizeWorkerGeometryMessage
    | VisualizeWorkerMetadataMessage;

let visualizeWorker: Worker | null = null;
let activeJobId = 0;
let activeProcessId = 0;
let activeWorkerReject: ((error: Error) => void) | null = null;
let activeUploadAbortController: AbortController | null = null;

const pendingControllerEchoes = new Map<
    string,
    { processId: number; timeoutId: ReturnType<typeof setTimeout> }
>();

class GcodeProcessingCancelledError extends Error {}

const buildLoadSignature = ({ name, size, content }: GcodeLoadPayload): string => {
    const head = content.slice(0, 64);
    const tail = content.slice(-64);
    return `${name}::${size}::${content.length}::${head}::${tail}`;
};

const rememberPendingControllerEcho = (payload: GcodeLoadPayload, processId: number) => {
    const signature = buildLoadSignature(payload);
    const existing = pendingControllerEchoes.get(signature);
    if (existing) {
        clearTimeout(existing.timeoutId);
    }

    const timeoutId = setTimeout(() => {
        pendingControllerEchoes.delete(signature);
    }, 30_000);

    pendingControllerEchoes.set(signature, { processId, timeoutId });
};

const forgetPendingControllerEcho = (
    payload: GcodeLoadPayload,
    processId?: number,
) => {
    const signature = buildLoadSignature(payload);
    const entry = pendingControllerEchoes.get(signature);
    if (!entry) {
        return;
    }

    if (typeof processId === 'number' && entry.processId !== processId) {
        return;
    }

    clearTimeout(entry.timeoutId);
    pendingControllerEchoes.delete(signature);
};

export const shouldIgnoreControllerGcodeLoad = (payload: GcodeLoadPayload): boolean => {
    const signature = buildLoadSignature(payload);
    const entry = pendingControllerEchoes.get(signature);
    if (!entry) {
        return false;
    }

    clearTimeout(entry.timeoutId);
    pendingControllerEchoes.delete(signature);
    return true;
};

const publishProgress = (progress: number) => {
    pubsub.publish('toolpath:progress', progress);
};

const updateProcessingState = (payload: {
    fileProcessing: boolean;
    processingName?: string;
    processingProgress?: number;
}) => {
    reduxStore.dispatch(updateFileProcessing(payload));
    if (typeof payload.processingProgress === 'number') {
        publishProgress(payload.processingProgress);
        return;
    }
    if (!payload.fileProcessing) {
        publishProgress(0);
    }
};

const cancelInFlightWork = (reason: string) => {
    activeUploadAbortController?.abort();
    activeUploadAbortController = null;

    if (activeWorkerReject) {
        const reject = activeWorkerReject;
        activeWorkerReject = null;
        reject(new GcodeProcessingCancelledError(reason));
        return;
    }

    visualizeWorker?.terminate();
    visualizeWorker = null;
};

const createVisualizeWorker = () =>
    new Worker(
        new URL('../../../desktop/src/workers/Visualize.worker.ts', import.meta.url),
        { type: 'module' },
    );

const buildWorkerRequest = (payload: GcodeLoadPayload, jobId: number) => {
    const reduxState = reduxStore.getState();
    const isLaser = isLaserMode();
    const accelerations = {
        xAccel: _get(reduxState, 'controller.settings.settings.$120'),
        yAccel: _get(reduxState, 'controller.settings.settings.$121'),
        zAccel: _get(reduxState, 'controller.settings.settings.$122'),
        aAccel: _get(reduxState, 'controller.settings.settings.$123'),
    };
    const maxFeedrates = {
        xMaxFeed: Number(_get(reduxState, 'controller.settings.settings.$110', 4000.0)),
        yMaxFeed: Number(_get(reduxState, 'controller.settings.settings.$111', 4000.0)),
        zMaxFeed: Number(_get(reduxState, 'controller.settings.settings.$112', 3000.0)),
        aMaxFeed: Number(_get(reduxState, 'controller.settings.settings.$113', 3000.0)),
    };
    const rotaryDiameterOffsetEnabled = store.get(
        'widgets.visualizer.rotaryDiameterOffsetEnabled',
        false,
    );
    const atcFlag: string = _get(
        reduxState,
        'controller.settings.info.NEWOPT.ATC',
        '0',
    );
    const atcEnabled = atcFlag === '1';

    const previousFile = _get(reduxState, 'file', {});
    const isNewFile = !(
        payload.content === previousFile.content &&
        payload.size === previousFile.size &&
        payload.name === previousFile.name
    );

    return {
        jobId,
        content: payload.content,
        visualizer: VISUALIZER_PRIMARY,
        activeVisualizer: VISUALIZER_PRIMARY,
        isSecondary: false,
        isLaser,
        rapidOpacity: PENDANT_RAPID_OPACITY,
        shouldIncludeSVG: false,
        needsVisualization: true,
        isNewFile,
        accelerations,
        maxFeedrates,
        atcEnabled,
        rotaryDiameterOffsetEnabled,
        theme: getPendantWorkerTheme(),
    };
};

const runVisualizeWorker = (payload: GcodeLoadPayload): Promise<VisualizeWorkerGeometryMessage> =>
    new Promise((resolve, reject) => {
        const jobId = ++activeJobId;
        cancelInFlightWork('Visualize worker superseded by a newer request.');

        const worker = createVisualizeWorker();
        visualizeWorker = worker;
        let settled = false;

        const rejectWorker = (error: Error) => {
            if (settled) {
                return;
            }

            settled = true;
            if (visualizeWorker === worker) {
                visualizeWorker = null;
            }
            if (activeWorkerReject) {
                activeWorkerReject = null;
            }
            worker.terminate();
            reject(error);
        };

        const resolveWorker = (data: VisualizeWorkerGeometryMessage) => {
            if (settled) {
                return;
            }

            settled = true;
            if (visualizeWorker === worker) {
                visualizeWorker = null;
            }
            if (activeWorkerReject) {
                activeWorkerReject = null;
            }
            worker.terminate();
            resolve(data);
        };

        activeWorkerReject = rejectWorker;

        worker.onmessage = ({ data }: MessageEvent<VisualizeWorkerMessage | number>) => {
            if (typeof data === 'number') {
                updateProcessingState({
                    fileProcessing: true,
                    processingName: payload.name,
                    processingProgress: data,
                });
                return;
            }

            if (!data || typeof data !== 'object' || data.jobId !== jobId) {
                return;
            }

            if (data.type === 'progress') {
                updateProcessingState({
                    fileProcessing: true,
                    processingName: payload.name,
                    processingProgress: data.progress,
                });
                return;
            }

            if (data.type === 'geometryReady') {
                updateProcessingState({
                    fileProcessing: true,
                    processingName: payload.name,
                    processingProgress: 100,
                });

                resolveWorker(data);
            }
        };

        worker.onerror = (event) => {
            rejectWorker(
                event.error ?? new Error(event.message || 'Visualize worker failed.'),
            );
        };

        worker.onmessageerror = () => {
            rejectWorker(new Error('Visualize worker produced an unreadable message.'));
        };

        worker.postMessage(buildWorkerRequest(payload, jobId));
    });

const uploadToController = async (
    name: string,
    content: string,
    signal?: AbortSignal,
) => {
    if (!controller.port) {
        return;
    }

    const gcodeFile = new File([content], name, { type: 'text/plain' });
    const formData = new FormData();
    formData.append('gcode', gcodeFile);
    formData.append('port', controller.port);
    formData.append('visualizer', VISUALIZER_PRIMARY);

    const response = await fetch('/api/file', {
        method: 'POST',
        body: formData,
        signal,
    });
    if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }
};

const mapWorkerInfoToFileState = (
    payload: GcodeLoadPayload,
    info: VisualizeWorkerGeometryMessage['info'],
) => ({
    path: payload.path ?? '',
    total: info.total,
    toolSet: info.toolSet,
    spindleSet: info.spindleSet,
    movementSet: info.movementSet,
    invalidGcode: info.invalidLines,
    estimatedTime: info.estimatedTime,
    fileModal: info.fileModal,
    bbox: info.bbox,
    fileType: info.fileType,
    usedAxes: info.usedAxes,
});

const applyWorkerResult = (
    payload: GcodeLoadPayload,
    geometry: VisualizeWorkerGeometryMessage,
) => {
    reduxStore.dispatch(
        updateFileContent({
            content: payload.content,
            size: payload.size,
            name: payload.name,
        }),
    );
    reduxStore.dispatch(
        updateFileInfo(mapWorkerInfoToFileState(payload, geometry.info)),
    );
    pubsub.publish('file:toolchanges', {
        toolEvents: geometry.info.spindleToolEvents ?? {},
        total: geometry.info.total ?? 0,
    });
    pubsub.publish(
        'placeholder:invalidLines',
        geometry.parsedData?.invalidLines ?? geometry.info.invalidLines ?? [],
    );
    pubsub.publish('file:load', geometry);
};

const paintOverlay = () =>
    new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

async function processGcodePayload(
    payload: GcodeLoadPayload,
    { upload, processId }: { upload: boolean; processId: number },
) {
    const shouldUpload = upload && Boolean(controller.port);
    let uploadPromise: Promise<void> | null = null;
    let uploadAbortController: AbortController | null = null;
    let uploadError: unknown = null;

    updateProcessingState({
        fileProcessing: true,
        processingName: payload.name,
        processingProgress: 0,
    });
    await paintOverlay();

    try {
        const geometryPromise = runVisualizeWorker(payload);

        if (shouldUpload) {
            uploadAbortController = new AbortController();
            activeUploadAbortController = uploadAbortController;
            uploadPromise = uploadToController(
                payload.name,
                payload.content,
                uploadAbortController.signal,
            ).catch((error) => {
                uploadError = error;
            }).finally(() => {
                if (activeUploadAbortController === uploadAbortController) {
                    activeUploadAbortController = null;
                }
            });
        }

        const geometry = await geometryPromise;
        if (uploadPromise) {
            await uploadPromise;
            if (uploadError) {
                throw uploadError;
            }
        }

        if (processId !== activeProcessId) {
            return;
        }

        applyWorkerResult(payload, geometry);
    } catch (error) {
        uploadAbortController?.abort();
        if (activeUploadAbortController === uploadAbortController) {
            activeUploadAbortController = null;
        }
        if (uploadPromise) {
            await uploadPromise;
        }

        forgetPendingControllerEcho(payload, processId);

        if (processId !== activeProcessId) {
            return;
        }

        updateProcessingState({ fileProcessing: false });

        if (error instanceof GcodeProcessingCancelledError) {
            return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
            return;
        }

        console.error('Pendant G-code processing failed:', error);
    }
}

export const applyGcodePayload = async (payload: GcodeLoadPayload) => {
    const processId = ++activeProcessId;
    if (controller.port) {
        rememberPendingControllerEcho(payload, processId);
    }
    await processGcodePayload(payload, { upload: true, processId });
};

export const applyControllerGcodePayload = async (payload: GcodeLoadPayload) => {
    const processId = ++activeProcessId;
    await processGcodePayload(payload, { upload: false, processId });
};

export const cancelGcodeProcessing = () => {
    activeProcessId += 1;
    activeJobId += 1;
    cancelInFlightWork('Visualize worker cancelled.');
    updateProcessingState({ fileProcessing: false });
};
