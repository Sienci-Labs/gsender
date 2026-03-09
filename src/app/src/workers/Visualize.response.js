import pubsub from 'pubsub-js';
import { store as reduxStore } from 'app/store/redux';
import _get from 'lodash/get';
import isNumber from 'lodash/isNumber';

import store from 'app/store';
import {
    LIGHTWEIGHT_OPTIONS,
    RENDER_RENDERED,
    RENDER_RENDERING,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import {
    updateFileInfo,
    updateFileProcessing,
    updateFileRenderState,
} from '../store/redux/slices/fileInfo.slice';

const VIS_PROFILE_LAST_KEY = '__vizProfile';
const VIS_PROFILE_RUNS_KEY = '__vizRuns';
const VIS_PROFILE_MAX_RUNS = 50;

const storeVisualizerProfile = (profile) => {
    const root =
        typeof window !== 'undefined'
            ? window
            : typeof globalThis !== 'undefined'
                ? globalThis
                : null;
    if (!root) {
        return;
    }

    const snapshot = {
        ts: new Date().toISOString(),
        ...profile,
    };

    root[VIS_PROFILE_LAST_KEY] = snapshot;

    const runs = Array.isArray(root[VIS_PROFILE_RUNS_KEY])
        ? root[VIS_PROFILE_RUNS_KEY]
        : [];
    runs.push(snapshot);
    if (runs.length > VIS_PROFILE_MAX_RUNS) {
        runs.shift();
    }
    root[VIS_PROFILE_RUNS_KEY] = runs;
};

const VISUALIZE_MESSAGE_TYPE = {
    PROGRESS: 'progress',
    GEOMETRY_READY: 'geometryReady',
    METADATA_READY: 'metadataReady',
};

let activeVisualizeJobId = 0;

export const setActiveVisualizeJobId = (jobId) => {
    const next = Number(jobId);
    if (Number.isFinite(next) && next > 0) {
        activeVisualizeJobId = next;
    }
};

const isStaleJobMessage = (jobId) => {
    const incoming = Number(jobId);
    if (!Number.isFinite(incoming) || incoming <= 0) {
        return false;
    }
    if (!Number.isFinite(activeVisualizeJobId) || activeVisualizeJobId <= 0) {
        return false;
    }
    return incoming !== activeVisualizeJobId;
};

const logProfile = (profile) => {
    if (!profile) {
        return;
    }
    const { durationsMs, bytes, counts, heap, vm } = profile;
    const profileSnapshot = {
        durationsMs,
        bytes,
        counts,
        heap,
        vm,
    };
    storeVisualizerProfile(profileSnapshot);
    console.groupCollapsed('[Visualizer Profile] Parse + Memory Summary');
    if (durationsMs) {
        console.table(durationsMs);
    }
    if (bytes) {
        console.table(bytes);
    }
    if (counts) {
        console.table(counts);
    }
    if (vm) {
        console.table(vm);
    }
    const transferBytes = bytes?.transfer_total_bytes ?? 0;
    const heapPeak = heap?.peak ?? null;
    console.info(
        `[Visualizer Profile] transfer=${transferBytes} bytes, peakHeap=${heapPeak}, heapSupported=${heap?.supported}`,
    );
    console.info(
        '[Visualizer Profile] copy(window.__vizProfile) for latest, copy(window.__vizRuns) for history',
    );
    console.groupEnd();
};

const handleGeometryReady = (data) => {
    const { needsVisualization } = data;
    const info = data.info || {};
    const parsedDataPreview = data.parsedData || {
        info,
        invalidLines: info.invalidLines || [],
    };

    pubsub.publish('file:toolchanges', {
        toolEvents: _get(parsedDataPreview, 'info.spindleToolEvents', {}),
        total: _get(parsedDataPreview, 'info.total', 0),
    });

    const estimatePayload = {
        ...info,
        fileProcessing: false,
    };

    if (data.visualizer !== VISUALIZER_SECONDARY) {
        reduxStore.dispatch(updateFileInfo(estimatePayload));
    }

    reduxStore.dispatch(updateFileProcessing(false));

    const fileLoadPayload = {
        ...data,
        parsedData: parsedDataPreview,
    };

    pubsub.publish('file:load', fileLoadPayload);
    pubsub.publish(
        'placeholder:invalidLines',
        parsedDataPreview.invalidLines || [],
    );

    if (needsVisualization) {
        setTimeout(() => {
            const renderState = _get(reduxStore.getState(), 'file.renderState');
            if (renderState !== RENDER_RENDERED) {
                reduxStore.dispatch(updateFileRenderState(RENDER_RENDERING));
            }
        }, 250);
    } else {
        reduxStore.dispatch(updateFileRenderState(RENDER_RENDERED));
    }
};

const handleMetadataReady = async (data) => {
    logProfile(data.profile);

    const parsedData = data.parsedData || {};
    const estimateData = {
        estimates: Array.isArray(parsedData.estimates)
            ? parsedData.estimates
            : [],
        estimatedTime: _get(parsedData, 'info.estimatedTime', 0),
        jobId: data.jobId,
    };

    pubsub.publish('estimateData:ready', estimateData);

    pubsub.publish('visualizeWorker:terminate');
};

export const visualizeResponse = async ({ data }) => {
    if (isNumber(data)) {
        pubsub.publish('toolpath:progress', data);
        return;
    }

    if (!data || typeof data !== 'object') {
        return;
    }

    if (isStaleJobMessage(data.jobId)) {
        return;
    }

    if (data.type === VISUALIZE_MESSAGE_TYPE.PROGRESS) {
        if (isNumber(data.progress)) {
            pubsub.publish('toolpath:progress', data.progress);
        }
        return;
    }

    if (data.type === VISUALIZE_MESSAGE_TYPE.GEOMETRY_READY) {
        handleGeometryReady(data);
        return;
    }

    if (data.type === VISUALIZE_MESSAGE_TYPE.METADATA_READY) {
        await handleMetadataReady(data);
        return;
    }

    // Backward compatibility with single-message worker responses.
    handleGeometryReady(data);
    await handleMetadataReady(data);
};

export const shouldVisualize = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const isDisabled = liteMode
        ? store.get(
              'widgets.visualizer.liteOption',
              LIGHTWEIGHT_OPTIONS.LIGHT,
          ) === LIGHTWEIGHT_OPTIONS.EVERYTHING
        : store.get('widgets.visualizer.disabled');
    return !isDisabled;
};

export const shouldVisualizeSVG = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const SVGEnabled =
        store.get(
            'widgets.visualizer.liteOption',
            LIGHTWEIGHT_OPTIONS.LIGHT,
        ) === LIGHTWEIGHT_OPTIONS.LIGHT;
    return liteMode && SVGEnabled;
};
