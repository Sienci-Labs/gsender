import { useState, useEffect, useRef } from 'react';
import {
    Upload, X, Minimize2, Maximize2,
    Clock, Hash, Move, HardDrive, FileCode,
} from 'lucide-react';
import controller from '@gsender/controller-client/controller';
import { VISUALIZER_PRIMARY } from 'app/constants';
import GcodeEditor from 'app/features/Visualizer/GcodeEditor';
import { store as reduxStore } from '@gsender/controller-client/store/redux';
import {
    updateFileContent,
    updateFileInfo,
    unloadFileInfo,
} from '@gsender/controller-client/store/redux/slices/fileInfo.slice';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';

const TABS = ['File', 'Probe', 'Spindle', 'Macros'] as const;
type DrawerTab = (typeof TABS)[number];
type DrawerMode = 'closed' | 'minimal' | 'expanded';
type RecentFile = { fileName: string; fileSize: number; timeLoaded: number };

const RECENT_KEY = 'pendant-recent-files';

const formatSize = (b: number) =>
    b < 1024 ? `${b} B`
    : b < 1048576 ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / 1048576).toFixed(1)} MB`;

const formatHMS = (s: number) => {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Compute bounding box from raw G-code by scanning X/Y/Z coordinates in motion lines
const computeBounds = (content: string) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const raw of content.split('\n')) {
        const line = raw.trim().toUpperCase();
        if (!/^G[0123]\b/.test(line)) continue;
        const xm = line.match(/X([+-]?\d*\.?\d+)/); if (xm) { const v = parseFloat(xm[1]); minX = Math.min(minX, v); maxX = Math.max(maxX, v); }
        const ym = line.match(/Y([+-]?\d*\.?\d+)/); if (ym) { const v = parseFloat(ym[1]); minY = Math.min(minY, v); maxY = Math.max(maxY, v); }
        const zm = line.match(/Z([+-]?\d*\.?\d+)/); if (zm) { const v = parseFloat(zm[1]); minZ = Math.min(minZ, v); maxZ = Math.max(maxZ, v); }
    }
    if (!isFinite(minX)) return null;
    const safeZ = isFinite(minZ);
    return {
        min: { x: minX, y: isFinite(minY) ? minY : 0, z: safeZ ? minZ : 0 },
        max: { x: maxX, y: isFinite(maxY) ? maxY : 0, z: safeZ ? maxZ : 0 },
        delta: { x: maxX - minX, y: isFinite(minY) ? maxY - minY : 0, z: safeZ ? maxZ - minZ : 0 },
    };
};

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
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [loadedAt, setLoadedAt] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTapRef = useRef(0);
    const file = useTypedSelector((s: RootState) => s.file);

    useEffect(() => {
        setRecentFiles(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'));
    }, []);

    useEffect(() => () => {
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }
    }, []);

    const handleLoadClick = () => fileInputRef.current?.click();

    const handleUnload = () => {
        reduxStore.dispatch(unloadFileInfo());
        setLoadedAt(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        e.target.value = '';

        const content = await f.text();
        const total = content.split('\n').filter(l => l.trim()).length;
        const toolSet = [...new Set((content.match(/\bT(\d+)/gi) ?? []).map(t => t.toUpperCase()))];
        const spindleSet = [...new Set((content.match(/\bS(\d+)/gi) ?? []).map(s => `S${parseInt(s.slice(1))}`))];

        const bbox = computeBounds(content);
        reduxStore.dispatch(updateFileContent({ content, size: f.size, name: f.name }));
        reduxStore.dispatch(updateFileInfo({ total, toolSet, spindleSet, fileLoaded: true, ...(bbox ? { bbox } : {}) }));
        setLoadedAt(Date.now());

        const entry: RecentFile = { fileName: f.name, fileSize: f.size, timeLoaded: Date.now() };
        const stored: RecentFile[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
        const updated = [entry, ...stored.filter(r => r.fileName !== f.name)].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        setRecentFiles(updated);

        if (controller.port) {
            const formData = new FormData();
            formData.append('gcode', f);
            formData.append('port', controller.port);
            formData.append('visualizer', VISUALIZER_PRIMARY);
            fetch('/api/file', { method: 'POST', body: formData }).catch(() => {});
        }
    };

    // Bounds from bbox.delta (populated when server parses; zeros when offline)
    const { delta } = file.bbox ?? { delta: { x: 0, y: 0, z: 0 } };
    const boundsStr = (delta.x || delta.y || delta.z)
        ? `${Math.round(delta.x)} × ${Math.round(delta.y)} × ${Math.round(delta.z)}`
        : '—';

    const stats = [
        { label: '# LINES',   Icon: Hash,      value: file.total ? file.total.toLocaleString() : '—' },
        { label: 'EST. TIME', Icon: Clock,     value: formatHMS(file.estimatedTime) },
        { label: 'BOUNDS',    Icon: Move,      value: boundsStr },
        { label: 'SIZE',      Icon: HardDrive, value: formatSize(file.size) },
    ];

    // Total drawer height includes header so the header rises with expansion.
    const panelHeight = mode === 'expanded'
        ? `calc(60vh + ${HEADER_HEIGHT_REM}rem)`
        : mode === 'minimal'
            ? `calc(10.5rem + ${HEADER_HEIGHT_REM}rem)`
            : `${HEADER_HEIGHT_REM}rem`;
    const handleTabChange = (tab: DrawerTab) => {
        setActiveTab(tab);
        if (mode === 'closed') {
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
            setMode('expanded');
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
        <div className={`relative shrink-0 h-14 ${mode !== 'closed' ? 'z-40' : ''}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept=".gcode,.nc,.tap,.cnc,.g,.gc"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Sliding panel */}
            <div
                className="absolute left-0 right-0 bottom-0 z-30 overflow-hidden transition-all duration-300 bg-gray-100 dark:bg-dark-darker border border-gray-200 dark:border-dark-lighter shadow-2xl"
                style={{ height: panelHeight }}
            >
                <div className="flex flex-col h-full">
                    {/* Header bar */}
                    <div
                        className="w-full h-14 shrink-0 flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-dark-darker border-b border-gray-200 dark:border-dark-lighter"
                        onClick={(e) => handleHeaderTap(e.target)}
                    >
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            {TABS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleTabChange(t)}
                                    className={`px-2.5 h-8 text-xs rounded border transition-colors ${
                                        activeTab === t
                                            ? 'border-robin-500 text-robin-600 dark:text-robin-400 bg-robin-50/60 dark:bg-robin-500/10'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-dark-lighter/30'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMode('minimal')}
                                className={`p-1.5 rounded border ${mode === 'minimal' ? 'border-robin-500 text-robin-600 dark:text-robin-400' : 'border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400'} hover:bg-gray-50 dark:hover:bg-dark-lighter`}
                            >
                                <Minimize2 size={14} />
                            </button>
                            <button
                                onClick={() => setMode('expanded')}
                                className={`p-1.5 rounded border ${mode === 'expanded' ? 'border-robin-500 text-robin-600 dark:text-robin-400' : 'border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400'} hover:bg-gray-50 dark:hover:bg-dark-lighter`}
                            >
                                <Maximize2 size={14} />
                            </button>
                            <button
                                onClick={() => setMode('closed')}
                                className="p-1.5 rounded border border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {mode === 'closed' ? null : (
                        <>
                    {/* UPPER ZONE */}
                    {activeTab === 'File' ? (
                        file.fileLoaded ? (
                            <div className="shrink-0 px-3 py-2 flex flex-col gap-2">
                                {/* File header card */}
                                <div className="flex items-center gap-3 bg-gray-200/70 dark:bg-dark rounded-lg px-3 py-2">
                                    <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-dark-lighter flex items-center justify-center shrink-0">
                                        <FileCode size={15} className="text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-800 dark:text-white truncate">{file.name}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{formatAgo(loadedAt)} · {formatSize(file.size)}</span>
                                    </div>
                                    <button onClick={handleUnload} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
                                        <X size={13} />
                                    </button>
                                </div>

                                {/* 4 stat blocks */}
                                <div className="grid grid-cols-4 gap-1.5">
                                    {stats.map(({ label, Icon, value }) => (
                                        <div key={label} className="bg-white dark:bg-dark rounded-lg border border-gray-200 dark:border-dark-lighter px-2 py-2">
                                            <div className="flex items-center gap-1 text-[8px] text-gray-400 uppercase tracking-wide mb-1 font-medium">
                                                <Icon size={8} className="shrink-0" />{label}
                                            </div>
                                            <span className="text-xs font-bold text-gray-800 dark:text-white leading-none">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* No file — load prompt */
                            <div className="shrink-0 px-3 py-3 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-dark-lighter">
                                <span className="text-xs text-gray-500 dark:text-gray-400">No file loaded</span>
                                <button
                                    onClick={handleLoadClick}
                                    className="flex items-center gap-1.5 text-xs bg-robin-600 hover:bg-robin-500 rounded-lg px-3 py-1.5 text-white font-semibold shrink-0"
                                >
                                    <Upload size={12} /> Load File
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="shrink-0 px-3 py-3 border-b border-gray-200 dark:border-dark-lighter">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {activeTab} — coming soon
                            </span>
                        </div>
                    )}

                    {/* LOWER ZONE — expanded only */}
                    {mode === 'expanded' && (
                        <div className="flex-1 overflow-hidden min-h-0">
                            {activeTab === 'File' && file.fileLoaded && (
                                <div className="h-full overflow-auto px-3 py-2">
                                    <div className="h-full rounded-lg border border-gray-200 dark:border-dark-lighter bg-white dark:bg-dark overflow-hidden">
                                        <GcodeEditor onClose={() => setMode('minimal')} />
                                    </div>
                                </div>
                            )}
                            {activeTab === 'File' && !file.fileLoaded && (
                                <div className="h-full overflow-auto px-3 py-2">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Recent files</p>
                                    {recentFiles.length === 0
                                        ? <p className="text-xs text-gray-400">No recent files.</p>
                                        : recentFiles.map((r, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-dark-lighter last:border-0 gap-2">
                                                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{r.fileName}</span>
                                                <span className="text-[10px] text-gray-400 shrink-0">{formatSize(r.fileSize)}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            {activeTab !== 'File' && (
                                <div className="h-full flex items-center justify-center text-xs text-gray-400">Coming soon</div>
                            )}
                        </div>
                    )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
