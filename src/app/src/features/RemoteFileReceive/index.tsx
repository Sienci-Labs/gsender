import Button from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { Switch } from 'app/components/shadcn/Switch';
import controller from 'app/lib/controller.ts';
import { toast } from 'app/lib/toaster';
import type { RootState } from 'app/store/redux';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    actions,
    type IncomingFile,
    type RemoteFileReceiveSettings,
} from './apiActions';
import IncomingFileProgressBar from './IncomingFileProgressBar';
import { useIncomingFileTransfer } from './useIncomingFileTransfer';

const DEFAULT_PORT = 8010;

type GcodeFilePayload = {
    name: string;
    size: number;
    content: string;
    path: string;
};

type RemoteFileReceiveProps = {
    /** Platform-specific "load this file" action - see fileLoader.ts callers. */
    onOpenFile?: (payload: GcodeFilePayload) => void;
};

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RemoteFileReceive({
    onOpenFile,
}: RemoteFileReceiveProps) {
    const [settings, setSettings] = useState<RemoteFileReceiveSettings | null>(
        null,
    );
    const [port, setPort] = useState(DEFAULT_PORT);
    const [busy, setBusy] = useState(false);
    const [openingFile, setOpeningFile] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);

    const ipList = useSelector((state: RootState) => state.preferences.ipList);
    const usableAddresses = ipList.filter((entry) => entry.usable);
    const incomingTransfer = useIncomingFileTransfer();

    const refresh = () => {
        actions.fetchSettings((data) => {
            setSettings(data);
            setPort(data.port || DEFAULT_PORT);
        });
    };

    useEffect(() => {
        refresh();
        controller.listAllIps();
    }, []);

    // Picks up files pushed in while this panel is open, without a manual refresh.
    useEffect(() => {
        const onReceived = () => refresh();
        controller.addListener('remote:file-received', onReceived);
        return () => {
            controller.removeListener('remote:file-received', onReceived);
        };
    }, []);

    // remote:file-received only covers library-mode transfers; this also
    // catches active-mode ones so the progress bar still reaches 100%.
    useEffect(() => {
        if (incomingTransfer.state === 'complete') {
            refresh();
        }
    }, [incomingTransfer.state]);

    function toggle() {
        if (!settings) return;
        setBusy(true);
        actions.setEnabled(
            !settings.enabled,
            port,
            (data) => {
                setBusy(false);
                refresh();
                toast.success(
                    data.enabled
                        ? 'Remote file receive turned on'
                        : 'Remote file receive turned off',
                    { position: 'bottom-right' },
                );
            },
            () => {
                setBusy(false);
                toast.error('Failed to update remote file receive settings');
            },
        );
    }

    function regenerateToken() {
        actions.regenerateToken(
            () => {
                refresh();
                toast.success('Pairing code regenerated', {
                    position: 'bottom-right',
                });
            },
            () => toast.error('Failed to regenerate the pairing code'),
        );
    }

    async function openIncomingFile(file: IncomingFile) {
        if (!onOpenFile) return;
        setOpeningFile(file.savedName);
        const result = await actions.readFile(file.savedName);
        setOpeningFile(null);
        if (!result) {
            toast.error(`Could not open ${file.name}`);
            return;
        }
        onOpenFile({
            name: file.name,
            size: file.size,
            content: result.gcode,
            path: '',
        });
    }

    function toggleSelected(savedName: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(savedName)) {
                next.delete(savedName);
            } else {
                next.add(savedName);
            }
            return next;
        });
    }

    function toggleSelectAll() {
        setSelected((prev) =>
            prev.size === files.length
                ? new Set()
                : new Set(files.map((file) => file.savedName)),
        );
    }

    function handleDeleteSelected() {
        const names = Array.from(selected);
        if (names.length === 0) return;

        Confirm({
            title: 'Delete files?',
            content: `Delete ${names.length} file${names.length > 1 ? 's' : ''} from this tablet? This can't be undone.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            onConfirm: () => {
                setDeleting(true);
                actions.deleteFiles(
                    names,
                    () => {
                        setDeleting(false);
                        setSelected(new Set());
                        refresh();
                        toast.success(
                            `Deleted ${names.length} file${names.length > 1 ? 's' : ''}`,
                            { position: 'bottom-right' },
                        );
                    },
                    () => {
                        setDeleting(false);
                        toast.error('Failed to delete the selected files');
                    },
                );
            },
        });
    }

    const running = settings?.running ?? false;
    const token = settings?.token ?? null;
    const files = settings?.files ?? [];

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto gap-4">
            <p className="text-sm text-gray-600 dark:text-content-muted">
                Let a desktop gSender send a g-code file to this tablet over
                Wi-Fi, without copying it over first.
            </p>

            <div className="flex flex-row items-center gap-4">
                <span className="font-bold dark:text-content-primary">
                    Enabled
                </span>
                <Switch onChange={toggle} checked={running} disabled={busy} />
            </div>

            {running && (
                <div className="flex flex-col gap-3 rounded-md border border-gray-200 dark:border-outline p-3">
                    <div>
                        <span className="text-xs text-gray-600 dark:text-content-muted">
                            Address(es) a desktop can send to:
                        </span>
                        <div className="flex flex-col gap-1 mt-1">
                            {usableAddresses.length === 0 && (
                                <span className="text-sm text-gray-500">
                                    No network connection detected.
                                </span>
                            )}
                            {usableAddresses.map((entry) => (
                                <span
                                    key={entry.address}
                                    className="font-mono text-sm dark:text-content-primary"
                                >
                                    {entry.address}:{port}{' '}
                                    <span className="text-xs text-gray-500">
                                        ({entry.label})
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <span className="text-xs text-gray-600 dark:text-content-muted">
                                Pairing code
                            </span>
                            <div className="font-mono text-2xl tracking-widest dark:text-content-primary">
                                {token}
                            </div>
                        </div>
                        <Button variant="secondary" onClick={regenerateToken}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            New code
                        </Button>
                    </div>
                </div>
            )}

            {incomingTransfer.state !== 'idle' && (
                <IncomingFileProgressBar transfer={incomingTransfer} />
            )}

            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold dark:text-content-primary">
                        Received files
                    </h2>
                    {selected.size > 0 && (
                        <button
                            type="button"
                            onClick={handleDeleteSelected}
                            disabled={deleting}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-red-300 text-red-600 dark:border-red-500/40 dark:text-red-400 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selected.size})
                        </button>
                    )}
                </div>
                {files.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Files sent here with "Add to library" will show up in
                        this list.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-content-muted px-1">
                            <input
                                type="checkbox"
                                checked={
                                    selected.size === files.length &&
                                    files.length > 0
                                }
                                onChange={toggleSelectAll}
                            />
                            Select all
                        </label>
                        {files.map((file) => (
                            <div
                                key={file.savedName}
                                className="flex items-center justify-between gap-2 text-sm p-2 bg-gray-50 dark:bg-surface-raised rounded"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(file.savedName)}
                                        onChange={() =>
                                            toggleSelected(file.savedName)
                                        }
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate dark:text-content-primary">
                                            {file.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openIncomingFile(file)}
                                    disabled={
                                        !onOpenFile ||
                                        openingFile === file.savedName
                                    }
                                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-outline dark:text-content-primary disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    {openingFile === file.savedName
                                        ? 'Opening...'
                                        : 'Open'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
