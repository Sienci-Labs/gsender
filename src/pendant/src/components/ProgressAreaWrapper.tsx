import { WORKFLOW_STATE_PAUSED, WORKFLOW_STATE_RUNNING } from 'app/constants';
import { clamp, useJobProgress } from '../hooks/useJobProgress';

const interpolateProgressGreen = (percent: number): string => {
    const t = clamp(percent, 0, 100) / 100;
    const from = { r: 134, g: 239, b: 172 }; // green-300
    const to = { r: 34, g: 197, b: 94 }; // green-500

    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);

    return `rgb(${r} ${g} ${b})`;
};

export default function ProgressAreaWrapper() {
    const {
        workflowState,
        displaySent,
        totalLines,
        progressPercent,
        isFlashingComplete,
        onFlashAnimationEnd,
    } = useJobProgress();

    const roundedProgress = Math.round(progressPercent);
    const fillWidth =
        progressPercent <= 0
            ? '0%'
            : `min(100%, max(${progressPercent}%, 56px))`;
    const showExpandedBar =
        workflowState === WORKFLOW_STATE_RUNNING ||
        workflowState === WORKFLOW_STATE_PAUSED ||
        isFlashingComplete;
    const fillColor = interpolateProgressGreen(progressPercent);

    return (
        <div className="flex flex-col gap-1 px-1">
            <div className="flex justify-between text-xs text-gray-400 dark:text-content-muted">
                <span>Progress</span>
                <span>{`Line ${displaySent} / ${totalLines}`}</span>
            </div>
            <div className="h-7 flex items-center">
                <div
                    className={`relative w-full overflow-hidden transition-all duration-300 ease-out ${
                        showExpandedBar
                            ? 'h-7 rounded-md bg-gray-200 dark:bg-surface-raised opacity-100 pendant-progress-track border border-gray-400/80 dark:border-outline'
                            : 'h-2 rounded-full bg-gray-300 dark:bg-surface-raised opacity-100 border border-gray-400/80 dark:border-outline'
                    }`}
                >
                    <div
                        className={`relative h-full rounded-md transition-[width,background-color] duration-200 ease-out ${
                            isFlashingComplete
                                ? 'pendant-progress-complete'
                                : ''
                        }`}
                        style={{ width: fillWidth, backgroundColor: fillColor }}
                        onAnimationEnd={onFlashAnimationEnd}
                    >
                        {progressPercent > 0 && (
                            <div className="absolute z-10 right-1 top-1/2 -translate-y-1/2 h-6 min-w-8 px-1 rounded-[5px] border border-white/80 bg-white/75 shadow-[0_1px_2px_var(--overlay-disabled)] text-[11px] leading-none text-green-900 font-semibold tabular-nums flex items-center justify-center">
                                {roundedProgress}%
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
