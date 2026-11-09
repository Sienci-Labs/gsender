import { CheckCircle2 } from 'lucide-react';
import type { IncomingFileTransfer } from './useIncomingFileTransfer';

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

// Mirrors ProgressAreaWrapper's fill colour so the two progress bars read as
// the same visual system.
const interpolateProgressGreen = (percent: number): string => {
    const t = clamp(percent, 0, 100) / 100;
    const from = { r: 134, g: 239, b: 172 }; // green-300
    const to = { r: 34, g: 197, b: 94 }; // green-500

    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);

    return `rgb(${r} ${g} ${b})`;
};

/**
 * Rich inline progress bar shown in the Remote File Receive panel while a
 * desktop is actively sending a file - same striped-track / green-fill /
 * flash-on-complete visual language as the job progress bar
 * (ProgressAreaWrapper), driven here by useIncomingFileTransfer instead of
 * the job sender's status.
 */
export default function IncomingFileProgressBar({
    transfer,
}: {
    transfer: IncomingFileTransfer;
}) {
    if (transfer.state === 'idle') {
        return null;
    }

    const isError = transfer.state === 'error';
    const isComplete = transfer.state === 'complete';
    const percent = isComplete ? 100 : transfer.percent;
    const fillColor = isError ? '#dc2626' : interpolateProgressGreen(percent);

    return (
        <div className="flex flex-col gap-1 rounded-md border border-gray-200 dark:border-outline p-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-content-muted">
                <span className="truncate">
                    {isError
                        ? `${transfer.name || 'Transfer'} failed`
                        : `Receiving ${transfer.name}…`}
                </span>
                {!isError && (
                    <span className="tabular-nums shrink-0 ml-2">
                        {Math.round(percent)}%
                    </span>
                )}
            </div>
            <div className="h-7 flex items-center">
                <div className="relative w-full h-7 overflow-hidden rounded-md bg-gray-200 dark:bg-surface-raised border border-gray-400/80 dark:border-outline pendant-progress-track">
                    <div
                        className={
                            isComplete
                                ? 'relative h-full rounded-md transition-[width] duration-200 ease-out pendant-progress-complete'
                                : 'relative h-full rounded-md transition-[width] duration-200 ease-out'
                        }
                        style={{
                            width: isError ? '100%' : `${percent}%`,
                            backgroundColor: fillColor,
                        }}
                    >
                        {isComplete && (
                            <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Received
                            </span>
                        )}
                        {isError && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold px-2 truncate">
                                {transfer.message || 'Transfer failed'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
