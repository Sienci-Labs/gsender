import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Upload, Download, Play, MoreHorizontal, Command, type LucideIcon } from 'lucide-react';
import api from 'app/api';
import controller from '@gsender/controller-client/controller';
import MacroForm from '@gsender/features/Macros/MacroForm';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@gsender/ui/shadcn/Dialog';

interface Macro {
    id: string;
    name: string;
    content: string;
    description: string;
    column: string;
    rowIndex: number;
}

type DrawerMode = 'closed' | 'minimal' | 'expanded';

interface Props {
    mode: DrawerMode;
}

// ── Colour tokens ──────────────────────────────────────────────────────────────

const tokens = {
    dark: {
        tileBg: '#252a38',
        tileAddBg: 'rgba(74,158,255,0.10)',
        tileBorder: 'rgba(255,255,255,0.09)',
        tileAddBorder: 'rgba(74,158,255,0.35)',
        accent: '#4a9eff',
        labelMuted: 'rgba(255,255,255,0.50)',
        divider: 'rgba(255,255,255,0.07)',
        btnBg: 'linear-gradient(180deg, #323b54 0%, #1a2035 100%)',
        btnBorderTop: 'rgba(255,255,255,0.14)',
        btnBorderSide: 'rgba(0,0,0,0.35)',
        btnBorderBottom: 'rgba(0,0,0,0.55)',
        btnShadow: '0 3px 0 #10151f, 0 4px 6px rgba(0,0,0,0.40)',
        btnShadowPressed: '0 1px 0 #10151f, 0 1px 3px rgba(0,0,0,0.35)',
        // Recessed circle: darker than button, dark top border (shadow edge)
        circleBg: 'linear-gradient(180deg, #0f1525 0%, #0a1020 100%)',
        circleBorderTop: 'rgba(0,0,0,0.70)',
        circleBorderBottom: 'rgba(255,255,255,0.07)',
        circleBorderSide: 'rgba(0,0,0,0.50)',
    },
    light: {
        tileBg: '#f4f5f7',
        tileAddBg: '#eaf2ff',
        tileBorder: '#e0e2e8',
        tileAddBorder: '#a8c8f0',
        accent: '#1a6fc4',
        labelMuted: '#7a8299',
        divider: '#e8eaed',
        btnBg: 'linear-gradient(180deg, #ffffff 0%, #e8ecf4 100%)',
        btnBorderTop: 'rgba(255,255,255,0.95)',
        btnBorderSide: 'rgba(0,0,0,0.10)',
        btnBorderBottom: 'rgba(0,0,0,0.18)',
        btnShadow: '0 3px 0 #c8ccd8, 0 4px 7px rgba(0,0,0,0.12)',
        btnShadowPressed: '0 1px 0 #c8ccd8, 0 1px 3px rgba(0,0,0,0.12)',
        circleBg: 'linear-gradient(180deg, #ffffff 0%, #eaeff8 100%)',
        circleBorderTop: 'rgba(255,255,255,0.90)',
        circleBorderBottom: 'rgba(0,0,0,0.15)',
        circleBorderSide: 'rgba(0,0,0,0.10)',
    },
};

// ── ActionTile ─────────────────────────────────────────────────────────────────

interface ActionTileProps {
    label: string;
    Icon: LucideIcon;
    onClick: () => void;
    isAdd?: boolean;
    isDark: boolean;
}

function ActionTile({ label, Icon, onClick, isAdd = false, isDark }: ActionTileProps) {
    const t = isDark ? tokens.dark : tokens.light;
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 8,
                border: `1px solid ${isAdd ? t.tileAddBorder : t.tileBorder}`,
                background: isAdd ? t.tileAddBg : t.tileBg,
                cursor: 'pointer',
            }}
        >
            <Icon size={18} color={t.accent} />
            <span style={{ fontSize: 9, color: isAdd ? t.accent : t.labelMuted, fontWeight: 500 }}>
                {label}
            </span>
        </button>
    );
}

// ── MacroButton ────────────────────────────────────────────────────────────────

interface MacroButtonProps {
    macro: Macro;
    isDark: boolean;
    disabled: boolean;
    onRun: (id: string) => void;
    onEdit: (macro: Macro) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    menuOpenId: string | null;
    onMenuOpen: (id: string | null) => void;
}

function MacroButton({ macro, isDark, disabled, onRun, onEdit, onDuplicate, onDelete, menuOpenId, onMenuOpen }: MacroButtonProps) {
    const t = isDark ? tokens.dark : tokens.light;
    const btnRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const isMenuOpen = menuOpenId === macro.id;

    const [pressed, setPressed] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const handlePointerDown = () => { if (!disabled) setPressed(true); };
    const handlePointerUp = () => {
        if (disabled) return;
        setPressed(false);
        triggerRunAnimation();
        onRun(macro.id);
    };
    const handlePointerLeave = () => setPressed(false);

    const triggerRunAnimation = () => {
        const el = btnRef.current;
        if (!el) return;
        el.classList.remove('running');
        void el.offsetWidth;
        el.classList.add('running');
        setIsRunning(true);
        setTimeout(() => {
            el?.classList.remove('running');
            setIsRunning(false);
        }, 900);
    };

    // Dismiss menu on outside click
    useEffect(() => {
        if (!isMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onMenuOpen(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isMenuOpen, onMenuOpen]);

    const btnShadow = disabled ? 'none' : pressed ? t.btnShadowPressed : t.btnShadow;
    const btnTransform = pressed && !disabled ? 'translateY(2px)' : 'none';

    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={btnRef}
                className="mbtn"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 9px',
                    borderRadius: 8,
                    background: disabled
                        ? (isDark ? '#1c2030' : '#eef0f4')
                        : t.btnBg,
                    borderTop: `1px solid ${disabled ? 'transparent' : t.btnBorderTop}`,
                    borderLeft: `1px solid ${disabled ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)') : t.btnBorderSide}`,
                    borderRight: `1px solid ${disabled ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)') : t.btnBorderSide}`,
                    borderBottom: `1px solid ${disabled ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)') : pressed ? t.btnBorderSide : t.btnBorderBottom}`,
                    boxShadow: btnShadow,
                    transform: btnTransform,
                    transition: 'box-shadow 0.08s ease, transform 0.08s ease',
                    cursor: disabled ? 'default' : 'pointer',
                    userSelect: 'none',
                    opacity: disabled ? 0.5 : 1,
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
            >
                {/* Circular play indicator */}
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 2,
                        background: t.circleBg,
                        borderTop: `1px solid ${t.circleBorderTop}`,
                        borderBottom: `1px solid ${t.circleBorderBottom}`,
                        borderLeft: `1px solid ${t.circleBorderSide}`,
                        borderRight: `1px solid ${t.circleBorderSide}`,
                        boxShadow: `inset 0 2px 5px rgba(0,0,0,${isDark ? '0.55' : '0.15'}), inset 0 1px 2px rgba(0,0,0,0.15)`,
                    }}
                >
                    <Play size={9} color={t.accent} fill={t.accent} />
                </div>

                {/* Macro name */}
                <span style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isDark ? 'rgba(255,255,255,0.85)' : '#374151',
                    position: 'relative',
                    zIndex: 2,
                }}>
                    {macro.name}
                </span>

                {/* Running badge */}
                {isRunning && (
                    <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 10,
                        background: isDark ? 'rgba(74,158,255,0.18)' : 'rgba(26,111,196,0.10)',
                        color: t.accent,
                        border: `1px solid ${isDark ? 'rgba(74,158,255,0.35)' : 'rgba(26,111,196,0.30)'}`,
                        flexShrink: 0,
                        letterSpacing: '0.02em',
                        position: 'relative',
                        zIndex: 2,
                    }}>
                        Running
                    </span>
                )}

                {/* Overflow menu trigger */}
                <div
                    style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginRight: -6,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2,
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMenuOpen(isMenuOpen ? null : macro.id);
                    }}
                >
                    <MoreHorizontal size={13} color={isDark ? 'rgba(255,255,255,0.40)' : '#9ca3af'} />
                </div>
            </div>

            {/* Overflow menu */}
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 4px)',
                        zIndex: 50,
                        background: isDark ? '#1e2436' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#e5e7eb'}`,
                        borderRadius: 8,
                        boxShadow: isDark
                            ? '0 4px 16px rgba(0,0,0,0.55)'
                            : '0 4px 16px rgba(0,0,0,0.12)',
                        minWidth: 130,
                        overflow: 'hidden',
                    }}
                >
                    {[
                        { label: 'Edit', action: () => { onMenuOpen(null); onEdit(macro); } },
                        { label: 'Duplicate', action: () => { onMenuOpen(null); onDuplicate(macro.id); } },
                        { label: 'Delete', action: () => { onMenuOpen(null); onDelete(macro.id); }, danger: true },
                    ].map(({ label, action, danger }) => (
                        <button
                            key={label}
                            onClick={action}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 14px',
                                fontSize: 12,
                                fontWeight: 500,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: danger
                                    ? (isDark ? '#f87171' : '#dc2626')
                                    : (isDark ? 'rgba(255,255,255,0.80)' : '#374151'),
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── MacrosPanel ────────────────────────────────────────────────────────────────

export default function MacrosPanel({ mode }: Props) {
    const { enableDarkMode = false } = useWorkspaceState();
    const isDark = enableDarkMode;
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);

    const [macros, setMacros] = useState<Macro[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editMacro, setEditMacro] = useState<Macro | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const importInputRef = useRef<HTMLInputElement>(null);
    const t = isDark ? tokens.dark : tokens.light;

    const fetchMacros = useCallback(async () => {
        try {
            const res = await api.macros.fetch();
            const records: Macro[] = res.data?.records ?? [];
            const sorted = [...records].sort((a, b) => {
                if (a.column !== b.column) return a.column.localeCompare(b.column);
                return a.rowIndex - b.rowIndex;
            });
            setMacros(sorted);
        } catch (_err) {
            // no-op
        }
    }, []);

    useEffect(() => { fetchMacros(); }, [fetchMacros]);

    const handleAdd = async (data: { name: string; content: string; description: string }) => {
        try {
            await api.macros.create(data);
            await fetchMacros();
            setShowAddModal(false);
        } catch (_err) {
            // no-op
        }
    };

    const handleEdit = async (data: { id?: string; name: string; content: string; description: string }) => {
        if (!data.id) return;
        try {
            await api.macros.update(data.id, { name: data.name, content: data.content, description: data.description });
            await fetchMacros();
            setEditMacro(null);
        } catch (_err) {
            // no-op
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const res = await api.macros.read(id);
            const { name, content, description } = res.data;
            await api.macros.create({ name: `${name} (copy)`, content, description });
            await fetchMacros();
        } catch (_err) {
            // no-op
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.macros.delete(confirmDeleteId);
            await fetchMacros();
        } catch (_err) {
            // no-op
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const handleRun = (id: string) => {
        controller.command('macro:run', id, {});
    };

    const handleExport = async () => {
        try {
            const res = await api.macros.fetch();
            const records: Macro[] = res.data?.records ?? [];
            if (records.length === 0) return;
            const data = records.map(({ id, name, content, description }) => ({ id, name, content, description }));
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const now = new Date();
            const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            a.href = url;
            a.download = `gSender-macros-${stamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (_err) {
            // no-op
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            const text = await file.text();
            const items = JSON.parse(text) as Array<{ id?: string; name?: string; content?: string; description?: string }>;
            if (!Array.isArray(items)) return;

            const existing = new Set(macros.map((m) => m.id));

            await Promise.all(
                items
                    .filter((item) => item.name && item.content)
                    .map((item) =>
                        item.id && existing.has(item.id)
                            ? api.macros.update(item.id, { name: item.name!, content: item.content!, description: item.description ?? '' })
                            : api.macros.create({ name: item.name!, content: item.content!, description: item.description ?? '' }),
                    ),
            );
            await fetchMacros();
        } catch (_err) {
            // no-op
        }
    };

    const macroToDelete = confirmDeleteId ? macros.find((m) => m.id === confirmDeleteId) : null;

    const isMinimal = mode === 'minimal';

    return (
        <div className={`h-full flex flex-col min-h-0${isMinimal ? ' justify-center' : ''}`}>
            {/* Action row */}
            <div style={{ display: 'flex', gap: 6, padding: isMinimal ? '10px 10px' : '4px 10px 8px', flexShrink: 0 }}>
                <ActionTile label="Add" Icon={Plus} onClick={() => setShowAddModal(true)} isAdd isDark={isDark} />
                <ActionTile label="Import" Icon={Upload} onClick={() => importInputRef.current?.click()} isDark={isDark} />
                <ActionTile label="Export" Icon={Download} onClick={handleExport} isDark={isDark} />
            </div>

            {mode === 'expanded' && (
                <>
                    {/* Divider */}
                    <div style={{ height: 1, margin: '0 10px', background: t.divider, flexShrink: 0 }} />

                    {/* Macro grid */}
                    <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: '8px 10px' }}>
                        {macros.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-2"
                                style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>
                                <Command size={24} />
                                <span style={{ fontSize: 12 }}>No macros yet</span>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {macros.map((macro) => (
                                    <MacroButton
                                        key={macro.id}
                                        macro={macro}
                                        isDark={isDark}
                                        disabled={!isConnected}
                                        onRun={handleRun}
                                        onEdit={setEditMacro}
                                        onDuplicate={handleDuplicate}
                                        onDelete={setConfirmDeleteId}
                                        menuOpenId={menuOpenId}
                                        onMenuOpen={setMenuOpenId}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Hidden import input */}
            <input
                ref={importInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
            />

            {/* Add Macro modal */}
            {showAddModal && (
                <MacroForm
                    title="Add Macro"
                    submitLabel="Add Macro"
                    onSubmit={handleAdd}
                    onCancel={() => setShowAddModal(false)}
                />
            )}

            {/* Edit Macro modal */}
            {editMacro && (
                <MacroForm
                    id={editMacro.id}
                    title="Edit Macro"
                    submitLabel="Save Macro"
                    macroName={editMacro.name}
                    macroContent={editMacro.content}
                    macroDescription={editMacro.description}
                    onSubmit={handleEdit}
                    onCancel={() => setEditMacro(null)}
                />
            )}

            {/* Delete confirm dialog */}
            <Dialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Macro</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Delete <strong>{macroToDelete?.name}</strong>? This cannot be undone.
                    </p>
                    <DialogFooter>
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-dark-lighter text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-lighter"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                            Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
