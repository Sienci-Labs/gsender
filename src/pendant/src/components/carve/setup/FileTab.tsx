import { usePostHog } from '@posthog/react';
import { GRBL_ACTIVE_STATE_IDLE, WORKFLOW_STATE_IDLE } from 'app/constants';
import { runOutline } from 'app/features/JobControl/OutlineButton';
import StartFromLine from 'app/features/JobControl/StartFromLine';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { FileText } from 'lucide-react';
import { type JSX, type ReactNode, useEffect, useState } from 'react';
import type { FileActions } from '../../../hooks/useFileActions';
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

function NoFile({ actions }: { actions: FileActions }) {
    const { recentFiles, handleLoadClick, handleRecentLoad, applyBrowserFile } =
        actions;

    return (
        <>
            <div
                className="flex flex-col items-center gap-1.5 px-2.5 py-3 shrink-0 rounded-lg border-[1.5px] border-dashed border-outline-strong text-content-muted"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) void applyBrowserFile(f);
                }}
            >
                <FileText className="w-[22px] h-[22px]" strokeWidth={1.8} />
                <span className="text-xs font-semibold text-content-secondary">
                    No file loaded
                </span>
                <span className="text-[9.5px] text-content-disabled text-center">
                    Drop a G-code file here, or browse for one
                </span>
                <button
                    type="button"
                    onClick={handleLoadClick}
                    className="mt-0.5 h-8 px-4 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold tracking-[0.05em] uppercase active:bg-blue-700"
                >
                    Load file
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
