import { VISUALIZER_PRIMARY } from 'app/constants';
import type { BBox } from 'app/definitions/general';
import controller from 'app/lib/controller';
import { isLaserMode } from 'app/lib/laserMode';
import { getEstimatorConfig } from 'app/lib/timeEstimator/getEstimatorConfig';
import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import {
    updateFileContent,
    updateFileInfo,
    updateFileProcessing,
} from 'app/store/redux/slices/fileInfo.slice';
import _get from 'lodash/get';
import pubsub from 'pubsub-js';
import {
    getPendantWorkerTheme,
    PENDANT_RAPID_OPACITY,
} from '../visualizerTheme';

export type GcodeLoadPayload = {
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
    format: 'segments-v1';
    chunks: {
        positions: ArrayBuffer;
        attrs: ArrayBuffer;
        power?: ArrayBuffer;
        vertexCount: number;
    }[];
    totalVertices: number;
    prefixEndVertex: ArrayBuffer;
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
    isLaser?: boolean;
    isSecondary?: boolean;
    activeVisualizer?: string;
    svgSegmentGroups?: {
        hexColor: string;
        opacity: number;
        positionsBuffer: ArrayBuffer;
        positionsLen: number;
        stride?: 4 | 6;
    }[];
    svgMeta?: { minZ: number; maxZ: number };
};

type VisualizeWorkerMetadataMessage = {
    type: 'metadataReady';
    jobId: number;
    info?: { estimatedTime?: number; [key: string]: unknown };
    parsedData?: {
        lineTime?: Float32Array;
        lineKind?: Uint8Array;
        [key: string]: unknown;
    };
};

type VisualizeWorkerMessage =
    | VisualizeWorkerProgressMessage
    | VisualizeWorkerGeometryMessage
    | VisualizeWorkerMetadataMessage;

export type { VisualizeWorkerGeometryMessage };

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

// Per-line time estimate (seconds) and kind, sent to the server so it can
// track job progress and compute a remaining-time countdown — mirrors
// desktop's equivalent cache in controllerSagas.tsx.
type EstimateData = {
    lineTime: ArrayBuffer;
    lineKind: ArrayBuffer;
    estimatedTime: number;
};

let latestEstimateData: EstimateData | null = null;

const toExactBuffer = (view?: ArrayBufferView): ArrayBuffer => {
    if (!view || !ArrayBuffer.isView(view)) {
        return new ArrayBuffer(0);
    }
    const { buffer, byteOffset, byteLength } = view;
    if (byteOffset === 0 && byteLength === buffer.byteLength) {
        return buffer as ArrayBuffer;
    }
    return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
};

const sendEstimateData = (data: VisualizeWorkerMetadataMessage) => {
    const parsedData = data.parsedData ?? {};
    const estimateData: EstimateData = {
        lineTime: toExactBuffer(parsedData.lineTime),
        lineKind: toExactBuffer(parsedData.lineKind),
        estimatedTime: Number(data.info?.estimatedTime) || 0,
    };
    latestEstimateData = estimateData;
    controller.command('updateEstimateData', estimateData);
};

// The server asks for this again when it needs a client to (re-)send its
// estimate (e.g. another client connects, or the sender state resets).
export const resendCachedEstimateData = () => {
    if (latestEstimateData) {
        controller.command('updateEstimateData', latestEstimateData);
    }
};

const buildLoadSignature = ({
    name,
    size,
    content,
}: GcodeLoadPayload): string => {
    const head = content.slice(0, 64);
    const tail = content.slice(-64);
    return `${name}::${size}::${content.length}::${head}::${tail}`;
};

const rememberPendingControllerEcho = (
    payload: GcodeLoadPayload,
    processId: number,
) => {
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

export const shouldIgnoreControllerGcodeLoad = (
    payload: GcodeLoadPayload,
): boolean => {
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
        new URL(
            '../../../app/src/workers/Visualize.worker.ts',
            import.meta.url,
        ),
        { type: 'module' },
    );

const buildWorkerRequest = (payload: GcodeLoadPayload, jobId: number) => {
    const reduxState = reduxStore.getState();
    const isLaser = isLaserMode();
    const rotaryDiameterOffsetEnabled = store.get(
        'widgets.visualizer.rotaryDiameterOffsetEnabled',
        false,
    );
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
        needsVisualization: true,
        // Top-down SVG mode: worker streams deduplicated 2D segment groups and
        // skips the 3D vertex/color/frame buffers entirely.
        svgOnly: true,
        isNewFile,
        estimatorConfig: getEstimatorConfig(),
        rotaryDiameterOffsetEnabled,
        theme: getPendantWorkerTheme(),
    };
};

const runVisualizeWorker = (
    payload: GcodeLoadPayload,
): Promise<VisualizeWorkerGeometryMessage> =>
    new Promise((resolve, reject) => {
        const jobId = ++activeJobId;
        cancelInFlightWork('Visualize worker superseded by a newer request.');

        const worker = createVisualizeWorker();
        visualizeWorker = worker;
        let settled = false;
        let finalized = false;
        let fallbackTerminateId: ReturnType<typeof setTimeout> | null = null;

        // Cleanup (terminate the worker) is deliberately decoupled from
        // resolving the geometry promise below: the worker posts
        // 'geometryReady' first and 'metadataReady' second, and terminating
        // as soon as the promise resolves (on 'geometryReady') raced the
        // already-queued 'metadataReady' message, which carries the per-line
        // time estimate the server needs for the remaining-time countdown.
        const finalizeWorker = () => {
            if (finalized) {
                return;
            }

            finalized = true;
            if (fallbackTerminateId !== null) {
                clearTimeout(fallbackTerminateId);
                fallbackTerminateId = null;
            }
            if (visualizeWorker === worker) {
                visualizeWorker = null;
            }
            if (activeWorkerReject) {
                activeWorkerReject = null;
            }
            worker.terminate();
        };

        const rejectWorker = (error: Error) => {
            if (settled) {
                return;
            }

            settled = true;
            finalizeWorker();
            reject(error);
        };

        const resolveWorker = (data: VisualizeWorkerGeometryMessage) => {
            if (settled) {
                return;
            }

            settled = true;
            resolve(data);
            // Safety net in case 'metadataReady' never arrives, so the
            // worker doesn't leak.
            fallbackTerminateId = setTimeout(finalizeWorker, 10_000);
        };

        activeWorkerReject = rejectWorker;

        worker.onmessage = ({
            data,
        }: MessageEvent<VisualizeWorkerMessage | number>) => {
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
                return;
            }

            if (data.type === 'metadataReady') {
                sendEstimateData(data);
                finalizeWorker();
            }
        };

        worker.onerror = (event) => {
            rejectWorker(
                event.error ??
                    new Error(event.message || 'Visualize worker failed.'),
            );
        };

        worker.onmessageerror = () => {
            rejectWorker(
                new Error('Visualize worker produced an unreadable message.'),
            );
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
        throw new Error(
            `Failed to upload file: ${response.status} ${response.statusText}`,
        );
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
    // Publish before updateFileInfo so the SVG is updated before React hides the overlay.
    pubsub.publish('file:load', geometry);
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
            )
                .catch((error) => {
                    uploadError = error;
                })
                .finally(() => {
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

export const applyControllerGcodePayload = async (
    payload: GcodeLoadPayload,
) => {
    const processId = ++activeProcessId;
    await processGcodePayload(payload, { upload: false, processId });
};

// Tool-preview worker queue - deliberately separate from activeJobId/
// visualizeWorker/activeWorkerReject above. Those are shared by every real
// file-load/controller-echo call, which fire on their own schedule (e.g. a
// 'gcode:load' echo from the controller); sharing that queue let an
// unrelated real-file job silently cancel a tool's in-flight preview (and
// vice versa) via cancelInFlightWork, so nothing ever rendered.
let previewWorker: Worker | null = null;
let previewReject: ((error: Error) => void) | null = null;
let previewJobId = 0;

/**
 * Visualizes gcode generated by a tool (e.g. Surfacing) without touching the
 * loaded-file redux state or uploading anything to the controller - previewing
 * a tool's output must never replace the file the user actually has loaded.
 */
export const computeGcodePreviewGeometry = (
    payload: GcodeLoadPayload,
): Promise<VisualizeWorkerGeometryMessage> =>
    new Promise((resolve, reject) => {
        previewWorker?.terminate();
        previewReject?.(
            new Error('Preview superseded by a newer request.'),
        );

        const jobId = ++previewJobId;
        const worker = createVisualizeWorker();
        previewWorker = worker;
        previewReject = reject;

        const cleanup = () => {
            if (previewWorker === worker) {
                previewWorker = null;
            }
            if (previewReject === reject) {
                previewReject = null;
            }
            worker.terminate();
        };

        worker.onmessage = ({
            data,
        }: MessageEvent<VisualizeWorkerMessage | number>) => {
            if (!data || typeof data !== 'object' || data.jobId !== jobId) {
                return;
            }
            if (data.type === 'geometryReady') {
                cleanup();
                resolve(data);
            }
        };
        worker.onerror = (event) => {
            cleanup();
            reject(
                event.error ??
                    new Error(event.message || 'Visualize worker failed.'),
            );
        };
        worker.onmessageerror = () => {
            cleanup();
            reject(
                new Error('Visualize worker produced an unreadable message.'),
            );
        };

        worker.postMessage(buildWorkerRequest(payload, jobId));
    });

export const cancelGcodeProcessing = () => {
    activeProcessId += 1;
    activeJobId += 1;
    cancelInFlightWork('Visualize worker cancelled.');
    updateProcessingState({ fileProcessing: false });
};
