/*
 * Estimate-only parse: runs the virtualizer with no geometry callbacks so a
 * loaded file's time estimate can be refreshed cheaply when machine settings
 * change (e.g. connecting after the file was opened).
 */
import GCodeVirtualizer from 'app/lib/GCodeVirtualizer';
import MotionPlanner, {
    type EstimatorConfig,
    estimateLineCount,
} from 'app/lib/timeEstimator/MotionPlanner';

interface EstimateWorkerData {
    jobId: number;
    content: string;
    estimatorConfig?: Partial<EstimatorConfig>;
}

self.onmessage = ({ data }: { data: EstimateWorkerData }) => {
    const { jobId, content, estimatorConfig = {} } = data;
    const noop = () => {};
    const estimator = new MotionPlanner(
        estimatorConfig,
        estimateLineCount(content),
    );
    const vm = new GCodeVirtualizer({
        addLine: noop,
        addArcCurve: noop,
        addCurve: noop,
        estimator,
    });

    // Same line splitting as Visualize.worker so line indexes agree
    const contentLength = content.length;
    let lineStart = 0;
    for (let i = 0; i < contentLength; i++) {
        const ch = content.charCodeAt(i);
        if (ch !== 10 && ch !== 13) {
            continue;
        }
        vm.virtualize(content.slice(lineStart, i));
        if (
            ch === 13 &&
            i + 1 < contentLength &&
            content.charCodeAt(i + 1) === 10
        ) {
            i++;
        }
        lineStart = i + 1;
    }
    vm.virtualize(content.slice(lineStart, contentLength));

    const { lineTime, lineKind, totalTime } = estimator.finish();
    const transferList: ArrayBuffer[] = [
        lineTime.buffer as ArrayBuffer,
        lineKind.buffer as ArrayBuffer,
    ];
    // DOM lib types the worker global as Window; use the Worker signature
    (self as unknown as Worker).postMessage(
        { jobId, lineTime, lineKind, estimatedTime: totalTime },
        transferList,
    );
};
