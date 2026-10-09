import Console from 'app/features/Console';
import GcodeEditor from 'app/features/Visualizer/GcodeEditor';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import type { RootState } from 'app/store/redux';
import {
    ChevronsUp,
    ChevronUp,
    Clock,
    FileCode,
    HardDrive,
    Hash,
    Move,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFileActions } from '../hooks/useFileActions';
import { formatHMS, formatSize } from '../utils/format';
import ATCPanel from './ATCPanel';
import CoolantPanel from './CoolantPanel';
import MacrosPanel from './MacrosPanel';
import MovePanel from './MovePanel';
import ProbePanel from './ProbePanel';
import SpindlePanel from './SpindlePanel';

const ALL_TABS = [
    'File',
    'Move',
    'Probe',
    'Spindle',
    'Macros',
    'ATC',
    'Coolant',
    'Console',
] as const;
type DrawerTab = (typeof ALL_TABS)[number];
type DrawerMode = 'closed' | 'minimal' | 'expanded';

// Compute bounding box from raw G-code by scanning X/Y/Z coordinates in motion lines

const formatAgo = (ts: number | null) => {
    if (!ts) return 'Just now';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)}h ago`;
};

export default function BottomDrawer() {
    const HEADER_HEIGHT_REM = 3.5;
    const DOUBLE_TAP_MS = 260;
    const [mode, setMode] = useState<DrawerMode>('closed');
    const [activeTab, setActiveTab] = useState<DrawerTab>('File');
    const {
        recentFiles,
        loadedAt,
        fileInputRef,
        handleLoadClick,
        handleUnload,
        handleFileChange,
        handleRecentLoad,
    } = useFileActions();
    const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTapRef = useRef(0);
    const file = useTypedSelector((s: RootState) => s.file);
    const { coolantFunctions = false, atcEnabled = false } =
        useWorkspaceState();
    const atcReport = useTypedSelector(
        (s: RootState) => s.controller.settings.info?.NEWOPT?.ATC,
    );
    const atcEnabledOrCompiled = atcEnabled || atcReport === '1';
    const TABS = ALL_TABS.filter(
        (t) =>
            (t !== 'Coolant' || coolantFunctions) &&
            (t !== 'ATC' || atcEnabledOrCompiled),
    );

    useEffect(() => {
        if (!coolantFunctions && activeTab === 'Coolant') {
            setActiveTab('File');
        }
        if (!atcEnabledOrCompiled && activeTab === 'ATC') {
            setActiveTab('File');
        }
    }, [coolantFunctions, atcEnabledOrCompiled, activeTab]);

    useEffect(
        () => () => {
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }
        },
        [],
    );

    // Bounds from bbox.delta (populated when server parses; zeros when offline)
    const { delta } = file.bbox ?? { delta: { x: 0, y: 0, z: 0 } };
    const boundsStr =
        delta.x || delta.y || delta.z
            ? `${Math.round(delta.x)} × ${Math.round(delta.y)} × ${Math.round(delta.z)}`
            : '—';

    const stats = [
        {
            label: '# LINES',
            Icon: Hash,
            value: file.total ? file.total.toLocaleString() : '—',
        },
        {
            label: 'EST. TIME',
            Icon: Clock,
            value: formatHMS(file.estimatedTime),
        },
        { label: 'BOUNDS', Icon: Move, value: boundsStr },
        { label: 'SIZE', Icon: HardDrive, value: formatSize(file.size) },
    ];

    // Total drawer height includes header so the header rises with expansion.
    const panelHeight =
        mode === 'expanded'
            ? `calc(60vh + ${HEADER_HEIGHT_REM}rem)`
            : mode === 'minimal'
              ? `calc(10.5rem + ${HEADER_HEIGHT_REM}rem)`
              : `${HEADER_HEIGHT_REM}rem`;
    const handleTabChange = (tab: DrawerTab) => {
        setActiveTab(tab);
        if (tab === 'Console') {
            setMode('expanded');
        } else if (mode === 'closed') {
            setMode('minimal');
        }
    };
    const handleHeaderTap = (target: EventTarget | null) => {
        const el = target as HTMLElement | null;
        if (el?.closest('button, a, input, select, textarea, label')) {
            return;
        }

        const now = Date.now();
        const isDoubleTap = now - lastTapRef.current <= DOUBLE_TAP_MS;

        if (isDoubleTap) {
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
                tapTimeoutRef.current = null;
            }
            lastTapRef.current = 0;
            setMode((currentMode) =>
                currentMode === 'expanded' ? 'closed' : 'expanded',
            );
            return;
        }

        lastTapRef.current = now;
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }
        tapTimeoutRef.current = setTimeout(() => {
            setMode((currentMode) => {
                if (currentMode === 'closed') return 'minimal';
                if (currentMode === 'minimal') return 'expanded';
                return currentMode;
            });
            tapTimeoutRef.current = null;
        }, DOUBLE_TAP_MS);
    };

    return (
        <div
            className={`relative shrink-0 h-14 ${mode !== 'closed' ? 'z-40' : ''}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".gcode,.nc,.tap,.cnc,.g,.gc"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Backdrop — closes drawer when tapping outside it */}
            {mode !== 'closed' && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMode('closed')}
                    aria-hidden="true"
                />
            )}

            {/* Sliding panel */}
            <div
                className={`absolute left-0 right-0 bottom-0 z-30 overflow-hidden transition-all duration-300 bg-gray-100 dark:bg-surface-raised border-t-2 border-gray-400 dark:border-outline ${mode !== 'closed' ? 'shadow-[0_-8px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.55)]' : ''}`}
                style={{ height: panelHeight }}
            >
                <div className="flex flex-col h-full">
                    {/* Header bar */}
                    <div
                        className="w-full h-14 shrink-0 flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-surface-raised border-b border-gray-200 dark:border-outline"
                        onClick={(e) => handleHeaderTap(e.target)}
                    >
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            {TABS.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => handleTabChange(t)}
                                    className={`px-2.5 h-8 text-xs rounded border transition-colors ${
                                        activeTab === t
                                            ? 'border-robin-500 text-robin-600 dark:text-robin-400 bg-robin-50/60 dark:bg-robin-500/10'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:text-content-muted dark:hover:text-gray-300 dark:hover:bg-surface-hover/30'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-[8px] pl-[9px] pr-[7px] border-l border-gray-300 dark:border-outline self-stretch">
                            <button
                                onClick={() =>
                                    setMode(
                                        mode === 'closed'
                                            ? 'minimal'
                                            : mode === 'minimal'
                                              ? 'expanded'
                                              : 'closed',
                                    )
                                }
                                style={{
                                    width: 40,
                                    height: 32,
                                    borderRadius: 6,
                                }}
                                className={`flex items-center justify-center border transition-colors ${
                                    mode === 'minimal' || mode === 'expanded'
                                        ? 'bg-[#ddeaf8] border-[#7aadd8] text-[#185FA5] dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-outline text-gray-600 dark:text-content-muted hover:bg-gray-50 dark:hover:bg-surface-hover'
                                }`}
                            >
                                {mode === 'expanded' ? (
                                    <ChevronsUp size={16} />
                                ) : (
                                    <ChevronUp size={16} />
                                )}
                            </button>
                            <button
                                onClick={() => setMode('closed')}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 6,
                                }}
                                className="flex items-center justify-center border border-gray-200 dark:border-outline text-gray-600 dark:text-content-muted hover:bg-gray-50 dark:hover:bg-surface-hover transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* File tab — always mounted */}
                    <div
                        className={
                            activeTab === 'File'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        {file.fileLoaded ? (
                            <div className="shrink-0 px-3 py-2 flex flex-col gap-2">
                                <div className="flex items-center gap-3 bg-gray-200/70 dark:bg-surface-elevated rounded-lg px-3 py-2">
                                    <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-surface-raised flex items-center justify-center shrink-0">
                                        <FileCode
                                            size={15}
                                            className="text-gray-600 dark:text-content-muted"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-800 dark:text-content-primary truncate">
                                                {file.name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {formatAgo(loadedAt)} ·{' '}
                                            {formatSize(file.size)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleUnload}
                                        className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-400 bg-red-50 text-red-600 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400 active:brightness-90"
                                    >
                                        <X size={12} />
                                        Close
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {stats.map(({ label, Icon, value }) => (
                                        <div
                                            key={label}
                                            className="bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-outline px-2 py-2"
                                        >
                                            <div className="flex items-center gap-1 text-[8px] text-gray-400 uppercase tracking-wide mb-1 font-medium">
                                                <Icon
                                                    size={8}
                                                    className="shrink-0"
                                                />
                                                {label}
                                            </div>
                                            <span className="text-xs font-bold text-gray-800 dark:text-content-primary leading-none">
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="shrink-0 px-3 py-3 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-outline">
                                <span className="text-xs text-gray-600 dark:text-content-muted">
                                    No file loaded
                                </span>
                                <button
                                    onClick={handleLoadClick}
                                    className="flex items-center gap-2 text-sm bg-robin-600 hover:bg-robin-500 rounded-lg px-4 py-2 text-white font-semibold shrink-0"
                                >
                                    <Upload size={14} /> Load File
                                </button>
                            </div>
                        )}
                        {mode === 'expanded' && (
                            <div className="flex-1 overflow-hidden min-h-0">
                                {file.fileLoaded ? (
                                    <div className="h-full overflow-auto px-3 py-2">
                                        <div className="h-full rounded-lg border border-gray-200 dark:border-outline bg-white dark:bg-surface-elevated overflow-hidden">
                                            <GcodeEditor
                                                onClose={() =>
                                                    setMode('minimal')
                                                }
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full overflow-auto px-3 py-2">
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">
                                            Recent files
                                        </p>
                                        {recentFiles.length === 0 ? (
                                            <p className="text-xs text-gray-400">
                                                No recent files.
                                            </p>
                                        ) : (
                                            recentFiles.map((r, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-outline last:border-0 gap-2"
                                                >
                                                    <span className="text-xs text-gray-700 dark:text-content-secondary truncate">
                                                        {r.fileName}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] text-gray-400">
                                                            {formatSize(
                                                                r.fileSize,
                                                            )}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                handleRecentLoad(
                                                                    r,
                                                                )
                                                            }
                                                            disabled={
                                                                !r.filePath
                                                            }
                                                            className={`text-xs font-semibold rounded px-3 py-1.5 border transition-colors ${
                                                                r.filePath
                                                                    ? 'text-robin-600 dark:text-robin-400 border-robin-300 dark:border-robin-600 hover:bg-robin-50 dark:hover:bg-robin-500/15'
                                                                    : 'text-gray-400 dark:text-content-muted border-gray-200 dark:border-outline cursor-default'
                                                            }`}
                                                        >
                                                            Load
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Move tab — always mounted */}
                    <div
                        className={
                            activeTab === 'Move'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        <MovePanel mode={mode} setMode={setMode} />
                    </div>

                    {/* Console tab — always mounted; Console is the same
                        component the desktop app uses (app/features/Console),
                        positioned absolutely against this relative wrapper. */}
                    <div
                        className={
                            activeTab === 'Console'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0 relative'
                                : 'hidden'
                        }
                    >
                        <Console
                            isActive={activeTab === 'Console'}
                            isChildWindow={false}
                        />
                    </div>

                    {/* Macros tab — always mounted */}
                    <div
                        className={
                            activeTab === 'Macros'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        <MacrosPanel mode={mode} />
                    </div>

                    {/* ATC tab — always mounted */}
                    <div
                        className={
                            activeTab === 'ATC'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        <ATCPanel mode={mode} />
                    </div>

                    {/* Coolant tab — always mounted */}
                    <div
                        className={
                            activeTab === 'Coolant'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        <CoolantPanel />
                    </div>

                    {/* Spindle tab — always mounted */}
                    <div
                        className={
                            activeTab === 'Spindle'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        <SpindlePanel mode={mode} />
                    </div>

                    {/* Probe tab — always mounted */}
                    <div
                        className={
                            activeTab === 'Probe'
                                ? 'flex-1 flex flex-col overflow-hidden min-h-0'
                                : 'hidden'
                        }
                    >
                        <ProbePanel mode={mode} />
                    </div>
                </div>
            </div>
        </div>
    );
}
