import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import api from 'app/api';
import { toast } from 'app/lib/toaster';
import axios from 'axios';
import { Switch } from 'app/components/shadcn/Switch';
import { CheckCircle2, File as FileIcon, Upload, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PairWithQr from './PairWithQr';
import TabletPicker from './TabletPicker';
import { type PendantTablet, usePendantTablets } from './usePendantTablets';

const STORAGE_KEY = 'sendToPendant.lastTabletId';
const DEFAULT_PORT = 8010;
const GCODE_ACCEPT = '.gcode,.nc,.tap,.cnc,.g,.gc';

// 'pick' shows the paired target, 'qr' shows the pairing QR, and
// 'manual' is the IP + code fallback for networks that block mDNS.
type View = 'pick' | 'qr' | 'manual';

function loadLastTabletId(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function saveLastTabletId(id: string) {
    try {
        localStorage.setItem(STORAGE_KEY, id);
    } catch {
        // Only a convenience - nothing to do.
    }
}

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

interface SendToPendantDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SendToPendantDialog: React.FC<SendToPendantDialogProps> = ({
    isOpen,
    onClose,
}) => {
    const [view, setView] = useState<View>('pick');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [ip, setIp] = useState('');
    const [port, setPort] = useState(DEFAULT_PORT);
    const [code, setCode] = useState('');
    const [loadActive, setLoadActive] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [sending, setSending] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendComplete, setSendComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { desktopId, tablets, forget, refresh } = usePendantTablets(isOpen);

    useEffect(() => {
        if (isOpen) {
            setView('pick');
            setSelectedId(loadLastTabletId());
            setCode('');
        }
    }, [isOpen]);

    const pairedTablets = useMemo(
        () => tablets.filter((t) => t.paired),
        [tablets],
    );

    // Keep a valid target selected - prefer one that's online. The target card
    // makes the choice obvious and "Change" switches it.
    useEffect(() => {
        if (pairedTablets.some((t) => t.id === selectedId)) return;
        const fallback =
            pairedTablets.find((t) => t.online) ?? pairedTablets[0];
        if (fallback) setSelectedId(fallback.id);
    }, [pairedTablets, selectedId]);

    const selected = pairedTablets.find((t) => t.id === selectedId);

    const handlePaired = useCallback(
        (tablet: PendantTablet) => {
            toast.success(`Paired with ${tablet.name}`, {
                position: 'bottom-right',
            });
            setSelectedId(tablet.id);
            saveLastTabletId(tablet.id);
            setView('pick');
            refresh();
        },
        [refresh],
    );

    const startManual = (tablet?: PendantTablet) => {
        if (tablet?.host) {
            setIp(tablet.host);
            setPort(tablet.port || DEFAULT_PORT);
        }
        setCode('');
        setView('manual');
    };

    // Only one file can be "the" active job, so multiple files only go to the
    // library. The preference is kept so it comes back at one file.
    const multipleFiles = files.length > 1;
    const willLoadActive = loadActive && !multipleFiles;

    const handleFileSelect = (fileList: FileList | null) => {
        if (!fileList) return;

        const valid: File[] = [];
        for (const picked of Array.from(fileList)) {
            const extension = `.${picked.name.split('.').pop()?.toLowerCase()}`;
            if (!GCODE_ACCEPT.split(',').includes(extension)) {
                toast.error(`${picked.name}: Unsupported file type`);
                continue;
            }
            valid.push(picked);
        }
        if (valid.length === 0) return;

        setFiles((prev) => {
            const existingKeys = new Set(
                prev.map((f) => `${f.name}:${f.size}`),
            );
            const merged = [...prev];
            for (const f of valid) {
                const key = `${f.name}:${f.size}`;
                if (!existingKeys.has(key)) {
                    merged.push(f);
                    existingKeys.add(key);
                }
            }
            return merged;
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setView('pick');
            setFiles([]);
            setSending(false);
            setCurrentIndex(0);
            setUploadProgress(0);
            setSendComplete(false);
            onClose();
        }
    };

    // Manual flow: trade the tablet's on-screen code for a persistent key so
    // this is the last time it has to be typed.
    const pairWithCode = async (): Promise<PendantTablet | null> => {
        try {
            const res = await api.pendantPairing.claim({
                host: ip,
                port,
                code,
            });
            await refresh();
            return { ...res.data.tablet, paired: true, online: true };
        } catch (error: any) {
            toast.error(
                error?.response?.data?.msg ||
                    `Could not reach the tablet at ${ip}:${port}`,
            );
            return null;
        }
    };

    const handleSend = async () => {
        if (files.length === 0) {
            toast.error('Add at least one file to send');
            return;
        }

        let target: PendantTablet | null | undefined = selected;
        if (view === 'manual') {
            if (!ip || !port || !code) {
                toast.error('Tablet IP, port and pairing code are required');
                return;
            }
            setSending(true);
            target = await pairWithCode();
            if (!target) {
                setSending(false);
                return;
            }
            // pairWithCode doesn't hand back the key - pick it up from the
            // refreshed list.
            const res = await api.pendantPairing.listTablets();
            target = res.data.tablets.find(
                (t: PendantTablet) => t.id === target?.id,
            );
            setSelectedId(target?.id ?? null);
            setView('pick');
        }

        if (!target?.host || !target.port || !target.key) {
            toast.error('Choose a paired tablet to send to');
            setSending(false);
            return;
        }

        const { host, port: targetPort, key, name } = target;
        setSending(true);

        for (let i = 0; i < files.length; i++) {
            const current = files[i];
            setCurrentIndex(i);
            setUploadProgress(0);

            try {
                const formData = new FormData();
                formData.append('gcode', current, current.name);
                formData.append('mode', willLoadActive ? 'active' : 'library');

                await axios.post(
                    `http://${host}:${targetPort}/pendant/file`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${key}`,
                            'X-Pendant-Desktop-Id': desktopId,
                            'X-Pendant-Filename': encodeURIComponent(
                                current.name,
                            ),
                        },
                        timeout: 30000,
                        onUploadProgress: (event) => {
                            const total = event.total ?? current.size;
                            if (!total) return;
                            setUploadProgress(
                                Math.round((event.loaded / total) * 100),
                            );
                        },
                    },
                );
            } catch (error: any) {
                if (error?.response?.status === 401) {
                    // The tablet forgot us - drop the stale key and re-pair.
                    toast.error(
                        `${name} is no longer paired with this computer. Pair it again to send.`,
                    );
                    await forget(target.id);
                    setView('qr');
                } else if (error?.code === 'ECONNABORTED') {
                    toast.error('Timed out reaching the tablet');
                } else {
                    toast.error(
                        `Could not reach ${name} at ${host}:${targetPort}. Make sure Remote File Receive is turned on.`,
                    );
                }
                if (i > 0) {
                    toast.error(
                        `Sent ${i} of ${files.length} files before the error`,
                        {
                            position: 'bottom-right',
                        },
                    );
                }
                setSending(false);
                setUploadProgress(0);
                return;
            }
        }

        saveLastTabletId(target.id);
        setUploadProgress(100);
        setSendComplete(true);
        toast.success(
            willLoadActive
                ? `Added to the library and loaded on ${name}`
                : files.length === 1
                  ? `Sent to ${name}'s file library`
                  : `Sent ${files.length} files to ${name}'s file library`,
            { position: 'bottom-right' },
        );
        setTimeout(() => handleOpenChange(false), 600);
    };

    const currentFile = files[currentIndex];
    const hasTarget = view === 'manual' || pairedTablets.length > 0;

    const inputClass =
        'w-full rounded-md border border-gray-200 dark:border-outline bg-white dark:bg-surface-base px-3 py-2 text-gray-900 dark:text-content-primary focus:outline-none focus:ring-2 focus:ring-robin-500/40 focus:border-robin-500 disabled:opacity-50';
    const labelClass =
        'block text-xs font-medium text-gray-600 dark:text-content-muted mb-1';

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-surface-raised">
                <DialogHeader>
                    <DialogTitle>Send to Pendant</DialogTitle>
                    <DialogDescription>
                        Send g-code files to a tablet running the gSender
                        pendant with Remote File Receive turned on.
                    </DialogDescription>
                </DialogHeader>

                {view === 'qr' ? (
                    <div className="my-2">
                        <PairWithQr
                            onPaired={handlePaired}
                            onUseCode={() => startManual()}
                            onCancel={() => setView('pick')}
                        />
                    </div>
                ) : (
                    <div className="space-y-5 my-2 text-sm">
                        {view === 'pick' ? (
                            <TabletPicker
                                tablets={pairedTablets}
                                selectedId={selected?.id ?? null}
                                disabled={sending}
                                onSelect={(id) => setSelectedId(id)}
                                onPairNew={() => setView('qr')}
                                onPairManual={() => startManual()}
                                onForget={forget}
                            />
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-content-muted">
                                        Pair with code
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setView('pick')}
                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-content-muted dark:hover:text-content-primary"
                                    >
                                        Back
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label
                                            htmlFor="pendant-ip"
                                            className={labelClass}
                                        >
                                            Tablet IP
                                        </label>
                                        <input
                                            id="pendant-ip"
                                            className={inputClass}
                                            value={ip}
                                            placeholder="192.168.1.42"
                                            disabled={sending}
                                            onChange={(e) =>
                                                setIp(e.target.value.trim())
                                            }
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label
                                            htmlFor="pendant-port"
                                            className={labelClass}
                                        >
                                            Port
                                        </label>
                                        <input
                                            id="pendant-port"
                                            type="number"
                                            className={inputClass}
                                            value={port}
                                            disabled={sending}
                                            onChange={(e) =>
                                                setPort(Number(e.target.value))
                                            }
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="pendant-code"
                                        className={labelClass}
                                    >
                                        Pairing code (shown on the tablet)
                                    </label>
                                    <input
                                        id="pendant-code"
                                        className={`${inputClass} font-mono tracking-widest`}
                                        value={code}
                                        maxLength={6}
                                        placeholder="000000"
                                        disabled={sending}
                                        onChange={(e) =>
                                            setCode(e.target.value.trim())
                                        }
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-content-muted">
                                        The tablet stays paired after the first
                                        send.
                                    </p>
                                </div>
                            </div>
                        )}

                        {hasTarget && (
                            <>
                                <div
                                    className={`rounded-lg border-2 border-dashed transition-colors duration-150 ${
                                        sending
                                            ? 'border-gray-200 dark:border-outline opacity-60 pointer-events-none'
                                            : dragOver
                                              ? 'border-robin-500 bg-robin-500/5'
                                              : 'border-gray-200 dark:border-outline hover:border-gray-300 dark:hover:border-content-muted'
                                    } ${files.length > 0 ? 'p-2' : 'p-6'}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                >
                                    {files.length > 0 ? (
                                        <div className="space-y-1">
                                            <div className="max-h-36 overflow-y-auto space-y-1">
                                                {files.map((f, i) => (
                                                    <div
                                                        key={`${f.name}:${f.size}`}
                                                        className="group flex items-center gap-2 rounded-md px-2 py-1.5 bg-gray-50 dark:bg-surface-base hover:bg-gray-100 dark:hover:bg-surface-base/70"
                                                    >
                                                        <FileIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                                        <span className="flex-1 min-w-0 truncate text-left text-gray-800 dark:text-content-primary">
                                                            {f.name}
                                                        </span>
                                                        <span className="text-xs text-gray-400 tabular-nums shrink-0">
                                                            {formatFileSize(
                                                                f.size,
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            title="Remove"
                                                            onClick={() =>
                                                                removeFile(i)
                                                            }
                                                            disabled={sending}
                                                            className="p-0.5 rounded shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-content-primary"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                disabled={sending}
                                                className="w-full py-1.5 text-xs font-medium text-robin-700 dark:text-robin-400 hover:underline"
                                            >
                                                + Add more files
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <Upload className="w-6 h-6 mb-2 text-gray-400" />
                                            <p className="text-gray-600 dark:text-content-muted">
                                                Drop g-code files here, or{' '}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    className="font-medium text-robin-700 dark:text-robin-400 hover:underline"
                                                >
                                                    browse
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept={GCODE_ACCEPT}
                                        onChange={(e) =>
                                            handleFileSelect(e.target.files)
                                        }
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <label
                                        htmlFor="pendant-load-active"
                                        className={`min-w-0 ${multipleFiles ? 'opacity-60' : 'cursor-pointer'}`}
                                    >
                                        <span className="block font-medium text-gray-900 dark:text-content-primary">
                                            Load as active job
                                        </span>
                                        <span className="block text-xs text-gray-500 dark:text-content-muted">
                                            {multipleFiles
                                                ? 'Only one file can be the active job, so multiple files go to the library.'
                                                : "Always added to the pendant's file library too."}
                                        </span>
                                    </label>
                                    <Switch
                                        id="pendant-load-active"
                                        checked={willLoadActive}
                                        disabled={sending || multipleFiles}
                                        onChange={(checked) =>
                                            setLoadActive(checked)
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {sending && (
                            <div className="space-y-2">
                                {sendComplete ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in-0 duration-300">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="font-medium">
                                            Sent!
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-content-muted">
                                            <span className="font-medium truncate">
                                                {files.length > 1
                                                    ? `Sending ${currentIndex + 1} of ${files.length}: ${currentFile?.name}…`
                                                    : `Sending ${currentFile?.name}…`}
                                            </span>
                                            <span className="tabular-nums">
                                                {uploadProgress}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-surface-base">
                                            <div
                                                className="h-full rounded-full bg-robin-500 transition-[width] duration-150 ease-out"
                                                style={{
                                                    width: `${uploadProgress}%`,
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-content-primary dark:bg-surface-base dark:hover:bg-surface-base/70"
                    >
                        Cancel
                    </button>
                    {hasTarget && view !== 'qr' && (
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={
                                files.length === 0 ||
                                sending ||
                                (view === 'pick' && !selected)
                            }
                            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-robin-700 hover:bg-robin-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sendComplete
                                ? 'Sent'
                                : sending
                                  ? `Sending… ${uploadProgress}%`
                                  : files.length > 1
                                    ? `Send ${files.length} files`
                                    : 'Send'}
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendToPendantDialog;
