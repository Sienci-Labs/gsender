import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
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
// Neutral surfaces/borders/text come from the Workshop CSS variables (see
// index.css) so nothing neutral is hardcoded here. Only the brand play/accent
// blue is theme-specific.

const ACCENT = { dark: '#4a9eff', light: '#1a6fc4' };

// ── ActionTile ─────────────────────────────────────────────────────────────────

interface ActionTileProps {
    label: string;
    Icon: LucideIcon;
    onClick: () => void;
}

function ActionTile({ label, Icon, onClick }: ActionTileProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'flex-1 relative rounded-xl border border-transparent p-[1px] overflow-hidden select-none',
                'cursor-pointer bg-transparent',
            )}
        >
            <div
                className={clsx(
                    'relative z-10 flex flex-col items-center justify-center gap-2 rounded-xl',
                    'min-h-[80px] px-2 py-4 border transition-colors',
                    'bg-gray-100 dark:bg-surface-raised border-gray-300 dark:border-outline',
                    'text-gray-500 dark:text-content-muted',
                    'hover:bg-gray-200 dark:hover:bg-surface-hover',
                )}
            >
                <Icon size={24} />
                <span className="text-[11px] font-semibold">{label}</span>
            </div>
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
    const accent = isDark ? ACCENT.dark : ACCENT.light;
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

    const btnTransform = pressed && !disabled ? 'translateY(1px)' : 'none';

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
                    // Flat neutral control surface (doc §18: no decorative gradients).
                    background: disabled
                        ? 'var(--surface-disabled)'
                        : pressed
                            ? 'var(--surface-active)'
                            : 'var(--surface-raised)',
                    border: `1px solid ${disabled ? 'var(--outline-disabled)' : 'var(--outline-default)'}`,
                    transform: btnTransform,
                    transition: 'background 0.08s ease, transform 0.08s ease',
                    cursor: disabled ? 'default' : 'pointer',
                    userSelect: 'none',
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
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--outline-subtle)',
                    }}
                >
                    <Play size={9} color={accent} fill={accent} />
                </div>

                {/* Macro name */}
                <span style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: disabled ? 'var(--content-disabled)' : 'var(--content-primary)',
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
                        color: accent,
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
                    <MoreHorizontal size={13} color="var(--content-muted)" />
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
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--outline-default)',
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
                                    : 'var(--content-secondary)',
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
            <div className="flex flex-shrink-0 gap-3 px-4 py-3">
                <ActionTile label="Add" Icon={Plus} onClick={() => setShowAddModal(true)} />
                <ActionTile label="Import" Icon={Upload} onClick={() => importInputRef.current?.click()} />
                <ActionTile label="Export" Icon={Download} onClick={handleExport} />
            </div>

            {mode === 'expanded' && (
                <>
                    {/* Divider */}
                    <div style={{ height: 1, margin: '0 10px', background: 'var(--outline-subtle)', flexShrink: 0 }} />

                    {/* Macro grid */}
                    <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: '8px 10px' }}>
                        {macros.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-2"
                                style={{ color: 'var(--content-muted)' }}>
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
                    <p className="text-sm text-gray-600 dark:text-content-muted">
                        Delete <strong>{macroToDelete?.name}</strong>? This cannot be undone.
                    </p>
                    <DialogFooter>
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-outline text-gray-700 dark:text-content-secondary hover:bg-gray-50 dark:hover:bg-surface-hover"
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
