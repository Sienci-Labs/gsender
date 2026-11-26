import { WORKFLOW_STATE_PAUSED } from 'app/constants';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import cn from 'classnames';
import { TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useJobProgress } from '../../../hooks/useJobProgress';
import { useStartingFromLine } from '../../../hooks/useStartingFromLine';
import {
    type TimelineTool,
    useToolTimeline,
} from '../../../hooks/useToolTimeline';
import { formatClock } from '../../../utils/format';

const STAT_LABEL =
    'text-[11px] tracking-[0.08em] uppercase text-content-disabled';

/** Seconds since the job was paused; resets whenever it resumes. */
function usePausedSeconds(paused: boolean) {
    const [pausedAt, setPausedAt] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        setPausedAt(paused ? Date.now() : null);
    }, [paused]);

    useEffect(() => {
        if (!paused) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [paused]);

    return pausedAt ? Math.max(0, (now - pausedAt) / 1000) : 0;
}

/** Multi-tool progress: one colored segment per tool (toolpath colors), a
 * tick at each change, and the unsent part dimmed. */
function SegmentedTrack({
    tools,
    totalLines,
    progressPercent,
    paused,
    isFlashingComplete,
    onFlashAnimationEnd,
}: {
    tools: TimelineTool[];
    totalLines: number;
    progressPercent: number;
    paused: boolean;
    isFlashingComplete: boolean;
    onFlashAnimationEnd: () => void;
}) {
    const pct = (line: number) =>
        Math.min(100, Math.max(0, (line / totalLines) * 100));

    return (
        <div
            className={cn(
                'relative h-9 rounded-md border border-outline bg-surface-elevated overflow-hidden',
                paused && 'ring-2 ring-state-hold',
                isFlashingComplete && 'pendant-progress-complete',
            )}
            onAnimationEnd={onFlashAnimationEnd}
        >
            {tools.map((tool, i) => (
                <div
                    key={`${tool.startLine}-${tool.toolNumber}`}
                    className={cn(
                        'absolute inset-y-0',
                        i > 0 && 'border-l-2 border-surface-base',
                    )}
                    style={{
                        left: `${pct(tool.startLine)}%`,
                        width: `${pct(tool.endLine + 1) - pct(tool.startLine)}%`,
                        backgroundColor: tool.color,
                    }}
                />
            ))}
            {/* Unsent part: faded and hatched, with a bright leading edge */}
            {progressPercent < 100 && (
                <div
                    className={cn(
                        'absolute inset-y-0 right-0 bg-surface-elevated/80 pendant-progress-unsent transition-[left] duration-200 ease-out',
                        progressPercent > 0 && 'border-l-2 border-white/90',
                    )}
                    style={{ left: `${progressPercent}%` }}
                />
            )}
            {progressPercent > 0 && (
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-7 min-w-10 px-1.5 rounded-[5px] border border-white/80 bg-white/75 text-sm leading-none text-gray-900 font-semibold tabular-nums flex items-center justify-center transition-[left] duration-200 ease-out"
                    style={{
                        left: `clamp(4px, calc(${progressPercent}% - 48px), calc(100% - 48px))`,
                    }}
                >
                    {Math.round(progressPercent)}%
                </div>
            )}
        </div>
    );
}

/** Current tool and the distance to the next change. */
function ToolStatusRow({
    tools,
    received,
}: {
    tools: TimelineTool[];
    received: number;
}) {
    const currentIndex = Math.max(
        0,
        tools.findIndex((t) => received <= t.endLine),
    );
    const current = tools[currentIndex];
    const next = tools[currentIndex + 1];

    return (
        <div className="flex items-center justify-between gap-2 font-mono text-sm tabular-nums">
            <span className="flex items-center gap-1.5 min-w-0">
                <span
                    aria-hidden
                    className="w-3 h-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: current.color }}
                />
                <span className="font-bold text-content-primary">
                    {current.label}
                </span>
                {current.comment && (
                    <span className="text-content-muted truncate">
                        {current.comment}
                    </span>
                )}
            </span>
            <span className="shrink-0 flex items-center gap-1.5 text-content-muted">
                {next ? (
                    <>
                        Next:
                        <span
                            aria-hidden
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: next.color }}
                        />
                        <span className="font-semibold text-content-primary">
                            {next.label}
                        </span>
                        in{' '}
                        {Math.max(
                            0,
                            next.startLine - received,
                        ).toLocaleString()}{' '}
                        lines
                    </>
                ) : (
                    'Last tool'
                )}
            </span>
        </div>
    );
}

/** Shown while start from line runs its setup moves, before any file lines
 * are sent; the sender's numbers are stale until then. */
function StartingFromLineCard({ line }: { line: number }) {
    return (
        <div className="shrink-0 px-2.5 pt-2.5">
            <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-state-hold/60 bg-state-hold/10">
                <div className="flex items-center gap-3">
                    <TriangleAlert
                        aria-hidden
                        className="w-8 h-8 shrink-0 text-state-hold"
                    />
                    <span className="flex flex-col min-w-0">
                        <span className="text-xl font-bold text-content-primary tabular-nums">
                            {line > 0
                                ? `Starting from line ${line.toLocaleString()}`
                                : 'Starting from line'}
                        </span>
                        <span className="text-sm text-content-muted">
                            Raising Z, restoring spindle and modal state, and
                            moving to the start position. The job begins once
                            setup finishes.
                        </span>
                    </span>
                </div>
                <div className="h-9 rounded-md border border-outline bg-surface-elevated pendant-progress-unsent animate-pulse" />
            </div>
        </div>
    );
}

/** Full-width job progress: time and line stats over the progress bar
 * (panels 07, 11). */
export default function RunProgress() {
    const {
        senderStatus,
        workflowState,
        displaySent,
        totalLines,
        progressPercent,
        received,
        isFlashingComplete,
        onFlashAnimationEnd,
    } = useJobProgress();
    const tools = useToolTimeline();
    const multiTool = tools.length > 1 && totalLines > 0;

    const paused = workflowState === WORKFLOW_STATE_PAUSED;
    const pausedSeconds = usePausedSeconds(paused);
    const elapsedMs = Number(senderStatus?.elapsedTime) || 0;
    const remainingSeconds = Number(senderStatus?.remainingTime) || 0;
    const startingFromLine = useStartingFromLine();
    // Keep a minimum fill width so the percent pill always fits
    const fillWidth =
        progressPercent <= 0
            ? '0%'
            : `min(100%, max(${progressPercent}%, 64px))`;

    if (startingFromLine !== null) {
        return <StartingFromLineCard line={startingFromLine} />;
    }

    return (
        <div className="shrink-0 px-2.5 pt-2.5">
            <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-outline-subtle bg-surface-raised">
                <div className="flex justify-between items-end gap-4 font-mono tabular-nums">
                    <span className="flex flex-col">
                        <span className={STAT_LABEL}>
                            {paused ? 'Paused' : 'Elapsed'}
                        </span>
                        <span
                            className={cn(
                                'text-lg font-semibold leading-6',
                                paused
                                    ? 'text-state-hold'
                                    : 'text-content-primary',
                            )}
                        >
                            {paused
                                ? formatClock(pausedSeconds)
                                : convertMillisecondsToTimeStamp(elapsedMs)}
                        </span>
                    </span>
                    <span className="flex flex-col items-center">
                        <span className={STAT_LABEL}>Lines sent</span>
                        <span className="text-lg font-semibold leading-6 text-content-primary">
                            {displaySent.toLocaleString()} /{' '}
                            {totalLines.toLocaleString()}
                        </span>
                    </span>
                    <span className="flex flex-col items-end">
                        <span className={STAT_LABEL}>Remaining</span>
                        <span
                            className={cn(
                                'text-4xl font-bold leading-10',
                                paused ? 'text-state-hold' : 'text-state-run',
                            )}
                        >
                            {remainingSeconds > 0
                                ? `~${formatClock(remainingSeconds)}`
                                : '—'}
                        </span>
                    </span>
                </div>
                {multiTool ? (
                    <>
                        <SegmentedTrack
                            tools={tools}
                            totalLines={totalLines}
                            progressPercent={progressPercent}
                            paused={paused}
                            isFlashingComplete={isFlashingComplete}
                            onFlashAnimationEnd={onFlashAnimationEnd}
                        />
                        <ToolStatusRow tools={tools} received={received} />
                    </>
                ) : (
                    <div className="h-9 rounded-md border border-outline bg-surface-elevated pendant-progress-track overflow-hidden">
                        <div
                            className={cn(
                                'relative h-full rounded-md transition-[width] duration-200 ease-out',
                                paused ? 'bg-state-hold' : 'bg-state-run',
                                isFlashingComplete &&
                                    'pendant-progress-complete',
                            )}
                            style={{ width: fillWidth }}
                            onAnimationEnd={onFlashAnimationEnd}
                        >
                            {progressPercent > 0 && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 h-7 min-w-10 px-1.5 rounded-[5px] border border-white/80 bg-white/75 text-sm leading-none text-gray-900 font-semibold tabular-nums flex items-center justify-center">
                                    {Math.round(progressPercent)}%
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
