import { usePostHog } from '@posthog/react';
import { GRBL_ACTIVE_STATE_IDLE, WORKFLOW_STATE_IDLE } from 'app/constants';
import { runOutline } from 'app/features/JobControl/OutlineButton';
import StartFromLine from 'app/features/JobControl/StartFromLine';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { FileText, X } from 'lucide-react';
import { type JSX, type ReactNode, useEffect, useState } from 'react';
import type { FileActions } from '../../../hooks/useFileActions';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';
import { formatDayTime, formatHMS, formatSize } from '../../../utils/format';
import RecentRow from './RecentRow';

// Same no-op validator JobControls passes ControlButton
const atcValidator = (): [
    boolean,
    { type: string; title: string; body: JSX.Element },
] => [false, { type: '', title: '', body: <span /> }];

const SMALL_BTN =
    'shrink-0 font-mono text-[9px] tracking-[0.05em] uppercase px-[7px] py-[3px] rounded-md border border-outline-strong text-content-secondary disabled:opacity-40';

function InfoRow({
    title,
    sub,
    children,
}: {
    title: string;
    sub: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md bg-surface-raised">
            <div className="flex flex-col gap-px min-w-0">
                <span className="text-[11.5px] font-semibold text-content-primary">
                    {title}
                </span>
                <span className="text-[9px] text-content-disabled">{sub}</span>
            </div>
            {children}
        </div>
    );
}

const BBOX_AXES = [
    { key: 'x', label: 'X', text: 'text-axis-x' },
    { key: 'y', label: 'Y', text: 'text-axis-y' },
    { key: 'z', label: 'Z', text: 'text-axis-z' },
    { key: 'a', label: 'A', text: 'text-axis-a' },
] as const;

const trimNum = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');

const range = (values: number[]) => {
    const finite = values.filter(Number.isFinite);
    if (finite.length === 0) return null;
    const lo = Math.min(...finite);
    const hi = Math.max(...finite);
    return lo === hi ? trimNum(lo) : `${trimNum(lo)}–${trimNum(hi)}`;
};

/** Read-only bounding box, feed/spindle ranges and tools, mirroring the
 * desktop FileInformation Size + Info panels. */
function FileDetails() {
    const { bbox, usedAxes, toolSet, movementSet, spindleSet, fileModal } =
        useTypedSelector((s: RootState) => s.file);
    const { units } = useWorkspaceState();
    const isLaserMode = useTypedSelector(
        (s: RootState) => Number(s.controller.settings.settings.$32 ?? 0) === 1,
    );
    const inches = units === 'in';
    const unitLabel = inches ? 'in' : 'mm';
    // bbox is stored in mm; A is degrees and never converted
    const toUnits = (v: number, axis: string) =>
        axis === 'a' || !inches ? v : v / 25.4;
    const axes = BBOX_AXES.filter(
        ({ key }) => key !== 'a' || usedAxes?.includes('A'),
    );

    // Feeds are in the file's own units; convert to the preferred units
    const fileInches = fileModal?.includes('G20');
    const fileMm = fileModal?.includes('G21');
    const feeds = (movementSet ?? []).map((f: string) => {
        const v = Number(f.replace('F', ''));
        if (fileInches && !inches) return v * 25.4;
        if (fileMm && inches) return v / 25.4;
        return v;
    });
    const speeds = (spindleSet ?? []).map((s: string) =>
        Number(s.replace('S', '')),
    );
    const tools = (toolSet ?? []).map((t: string) => t.replace('T', ''));
    const feedRange = range(feeds);
    const speedRange = range(speeds);

    const ranges = [
        {
            label: 'Feed',
            value: feedRange ? `${feedRange} ${unitLabel}/min` : 'None',
        },
        {
            label: isLaserMode ? 'Power (S)' : 'Spindle',
            value: speedRange
                ? isLaserMode
                    ? `S${speedRange}`
                    : `${speedRange} RPM`
                : 'None',
        },
        {
            label: 'Tools',
            value:
                tools.length === 0
                    ? 'None'
                    : `${tools.length} · T${tools.join(', T')}`,
        },
    ];

    return (
        <div className="flex flex-col gap-2 px-2.5 py-2 rounded-md bg-surface-raised">
            <div className="flex items-baseline justify-between">
                <span className="font-mono text-[8px] tracking-[0.06em] uppercase text-content-disabled">
                    Bounding box
                </span>
                <span className="font-mono text-[8px] text-content-disabled">
                    {unitLabel}
                </span>
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-2 gap-y-1 -mt-1 font-mono text-[10.5px] tabular-nums">
                <span />
                {['Size', 'Min', 'Max'].map((h) => (
                    <span
                        key={h}
                        className="text-right text-[8px] tracking-[0.06em] uppercase text-content-disabled"
                    >
                        {h}
                    </span>
                ))}
                {axes.map(({ key, label, text }) => (
                    <div key={key} className="contents">
                        <span className={cn('font-bold', text)}>{label}</span>
                        <span className="text-right font-semibold text-content-primary">
                            {toUnits(bbox.delta[key], key).toFixed(2)}
                        </span>
                        <span className="text-right text-content-secondary">
                            {toUnits(bbox.min[key], key).toFixed(2)}
                        </span>
                        <span className="text-right text-content-secondary">
                            {toUnits(bbox.max[key], key).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-1 pt-1.5 border-t border-outline-subtle">
                {ranges.map(({ label, value }) => (
                    <div
                        key={label}
                        className="flex items-baseline justify-between gap-2 min-w-0"
                    >
                        <span className="shrink-0 font-mono text-[8px] tracking-[0.06em] uppercase text-content-disabled">
                            {label}
                        </span>
                        <span className="font-mono text-[10.5px] font-semibold text-content-primary truncate">
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NoFile({ actions }: { actions: FileActions }) {
    const { recentFiles, handleLoadClick, handleRecentLoad } = actions;

    return (
        <>
            <div
                className="flex flex-col items-center gap-1.5 px-2.5 py-3 shrink-0 rounded-lg border border-outline-subtle bg-surface-raised text-content-muted"
            >
                <FileText className="w-[22px] h-[22px]" strokeWidth={1.8} />
                <span className="text-xs font-semibold text-content-secondary">
                    No file loaded
                </span>
                <span className="text-[9.5px] text-content-disabled text-center">
                    Open a G-code file to get started
                </span>
                <button
                    type="button"
                    onClick={handleLoadClick}
                    className="mt-0.5 h-8 px-4 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold tracking-[0.05em] uppercase active:bg-blue-700"
                >
                    Open file
                </button>
            </div>
            <span className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-content-disabled">
                    Recent files
                </span>
                {recentFiles.length > 0 && (
                    <span className="text-[9px] text-content-disabled">
                        Hold to load
                    </span>
                )}
            </span>
            <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-auto">
                {recentFiles.length === 0 ? (
                    <p className="m-0 text-[10.5px] text-content-disabled">
                        No recent files.
                    </p>
                ) : (
                    recentFiles.map((r) => (
                        <RecentRow
                            key={`${r.filePath || r.fileName}-${r.timeLoaded}`}
                            file={r}
                            onLoad={handleRecentLoad}
                        />
                    ))
                )}
            </div>
        </>
    );
}

const CLOSE_RING_R = 13;
const CLOSE_RING_C = 2 * Math.PI * CLOSE_RING_R;

/** Closes the file only after a full 1 s hold; a ring closes around the X
 * as the hold progresses. */
function HoldCloseButton({ onClose }: { onClose: () => void }) {
    const { progress, holding, showProgress, hintNode, bind } =
        useHoldToActivate(onClose, { hint: 'Hold to close file' });

    return (
        <button
            type="button"
            aria-label="Hold to close file"
            {...bind}
            className={cn(
                'relative shrink-0 w-8 h-8 flex items-center justify-center rounded-sm select-none touch-none transition-colors',
                holding ? 'text-state-alarm' : 'text-content-muted',
            )}
        >
            <X className="w-4 h-4" strokeWidth={2.25} />
            <svg
                aria-hidden
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="absolute inset-0 -rotate-90 pointer-events-none"
            >
                <circle
                    cx="16"
                    cy="16"
                    r={CLOSE_RING_R}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="stroke-state-alarm"
                    strokeDasharray={CLOSE_RING_C}
                    strokeDashoffset={CLOSE_RING_C * (1 - progress)}
                    opacity={showProgress ? 1 : 0}
                />
            </svg>
            {hintNode}
        </button>
    );
}

function LoadedFile({
    actions,
    onOpenEditor,
}: {
    actions: FileActions;
    onOpenEditor: () => void;
}) {
    const posthog = usePostHog();
    const file = useTypedSelector((s: RootState) => s.file);
    const workflowState = useTypedSelector(
        (s: RootState) => s.controller.workflow.state,
    );
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state.status?.activeState ?? '',
    );
    const total = Number(file.total) || 0;
    const [line, setLine] = useState(1);

    useEffect(() => {
        setLine(1);
    }, [file.name]);

    // The desktop JobControl rule for Outline and Start From
    const jobToolsDisabled =
        !file.fileLoaded ||
        workflowState !== WORKFLOW_STATE_IDLE ||
        activeState !== GRBL_ACTIVE_STATE_IDLE;

    const stats = [
        { label: 'Lines', value: total ? total.toLocaleString() : '—' },
        { label: 'Size', value: formatSize(file.size) },
        {
            label: 'Est. time',
            value: file.estimatedTime
                ? `~${formatHMS(file.estimatedTime)}`
                : '—',
        },
        { label: 'Loaded', value: formatDayTime(actions.loadedAt) },
    ];

    const stepLine = (delta: number) =>
        setLine((l) => Math.min(Math.max(1, l + delta), Math.max(1, total)));

    return (
        <>
            <div className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-md border border-outline-subtle bg-surface-raised">
                <FileText
                    className="w-3.5 h-3.5 shrink-0 text-blue-400"
                    aria-hidden
                />
                <span
                    className="flex-1 min-w-0 font-mono text-[11px] font-semibold text-content-primary truncate"
                    title={file.name}
                >
                    {file.name}
                </span>
                <HoldCloseButton onClose={actions.handleUnload} />
            </div>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-[7px] px-2.5 py-2 rounded-md bg-surface-raised">
                {stats.map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-px min-w-0">
                        <span className="font-mono text-[8px] tracking-[0.06em] uppercase text-content-disabled">
                            {label}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-content-primary truncate">
                            {value}
                        </span>
                    </div>
                ))}
            </div>
            <FileDetails />
            <InfoRow
                title="Trace outline"
                sub="Confirm stock fits before cutting"
            >
                <button
                    type="button"
                    className={SMALL_BTN}
                    disabled={jobToolsDisabled}
                    // The pendant has no visualizer outline handler, so it
                    // always uses the outline worker
                    onClick={() => runOutline(posthog, { liteMode: true })}
                >
                    Run
                </button>
            </InfoRow>
            <InfoRow title="Editor" sub="View or edit the raw G-code">
                <button
                    type="button"
                    className={SMALL_BTN}
                    onClick={onOpenEditor}
                >
                    Open
                </button>
            </InfoRow>
            <InfoRow
                title="Start from line"
                sub="Resume without re-running finished passes"
            >
                <div className="flex items-center gap-0.5 shrink-0 p-0.5 rounded-sm bg-surface-elevated">
                    <button
                        type="button"
                        aria-label="Previous line"
                        disabled={jobToolsDisabled || line <= 1}
                        onClick={() => stepLine(-1)}
                        className="w-[18px] h-[18px] rounded-sm flex items-center justify-center font-mono text-[11px] font-bold text-content-muted disabled:opacity-40"
                    >
                        −
                    </button>
                    {/* Keyed so the modal opens prefilled with this line */}
                    <StartFromLine
                        key={line}
                        disabled={jobToolsDisabled}
                        lastLine={line}
                        initialStartLine={line}
                        atcValidator={atcValidator}
                        renderTrigger={(open) => (
                            <button
                                type="button"
                                disabled={jobToolsDisabled}
                                onClick={open}
                                aria-label={`Start from line ${line}`}
                                className="min-w-4 px-1 font-mono text-[10.5px] text-content-secondary underline decoration-dotted underline-offset-2 disabled:no-underline disabled:opacity-40"
                            >
                                {line}
                            </button>
                        )}
                    />
                    <button
                        type="button"
                        aria-label="Next line"
                        disabled={jobToolsDisabled || line >= total}
                        onClick={() => stepLine(1)}
                        className="w-[18px] h-[18px] rounded-sm flex items-center justify-center font-mono text-[11px] font-bold text-content-muted disabled:opacity-40"
                    >
                        +
                    </button>
                </div>
            </InfoRow>
        </>
    );
}

export default function FileTab({
    actions,
    onOpenEditor,
}: {
    actions: FileActions;
    onOpenEditor: () => void;
}) {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-2 px-2.5 py-[9px] overflow-auto">
            {fileLoaded ? (
                <LoadedFile actions={actions} onOpenEditor={onOpenEditor} />
            ) : (
                <NoFile actions={actions} />
            )}
        </div>
    );
}
