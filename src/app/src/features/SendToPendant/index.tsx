import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { toast } from 'app/lib/toaster';
import axios from 'axios';
import { CheckCircle2, File as FileIcon, Upload, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'sendToPendant.lastTarget';
const DEFAULT_PORT = 8010;
const GCODE_ACCEPT = '.gcode,.nc,.tap,.cnc,.g,.gc';

type SendMode = 'library' | 'active';

type LastTarget = { ip: string; port: number };

function loadLastTarget(): LastTarget {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ip: '', port: DEFAULT_PORT };
        const parsed = JSON.parse(raw);
        return {
            ip: String(parsed.ip || ''),
            port: Number(parsed.port) || DEFAULT_PORT,
        };
    } catch {
        return { ip: '', port: DEFAULT_PORT };
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
    const [ip, setIp] = useState('');
    const [port, setPort] = useState(DEFAULT_PORT);
    const [code, setCode] = useState('');
    const [mode, setMode] = useState<SendMode>('library');
    const [files, setFiles] = useState<File[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [sending, setSending] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendComplete, setSendComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const last = loadLastTarget();
            setIp(last.ip);
            setPort(last.port);
        }
    }, [isOpen]);

    // Only one file can ever be "the" active job - fall back to library mode
    // as soon as a second file is queued.
    useEffect(() => {
        if (files.length > 1 && mode === 'active') {
            setMode('library');
        }
    }, [files.length, mode]);

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
            setFiles([]);
            setSending(false);
            setCurrentIndex(0);
            setUploadProgress(0);
            setSendComplete(false);
            onClose();
        }
    };

    const handleSend = async () => {
        if (files.length === 0 || !ip || !port || !code) {
            toast.error(
                'Tablet IP, port, pairing code and at least one file are required',
            );
            return;
        }

        setSending(true);

        for (let i = 0; i < files.length; i++) {
            const current = files[i];
            setCurrentIndex(i);
            setUploadProgress(0);

            try {
                const formData = new FormData();
                formData.append('gcode', current, current.name);
                formData.append('mode', mode);

                await axios.post(`http://${ip}:${port}/pendant/file`, formData, {
                    headers: {
                        'X-Pendant-Token': code,
                        'X-Pendant-Filename': encodeURIComponent(current.name),
                    },
                    timeout: 30000,
                    onUploadProgress: (event) => {
                        const total = event.total ?? current.size;
                        if (!total) return;
                        setUploadProgress(
                            Math.round((event.loaded / total) * 100),
                        );
                    },
                });
            } catch (error: any) {
                if (i > 0) {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify({ ip, port }),
                    );
                }
                if (error?.response?.status === 401) {
                    toast.error('Incorrect pairing code');
                } else if (error?.code === 'ECONNABORTED') {
                    toast.error('Timed out reaching the tablet');
                } else {
                    toast.error(
                        `Could not reach the tablet at ${ip}:${port}. Make sure Remote File Receive is turned on.`,
                    );
                }
                if (i > 0) {
                    toast.error(
                        `Sent ${i} of ${files.length} files before the error`,
                        { position: 'bottom-right' },
                    );
                }
                setSending(false);
                setUploadProgress(0);
                return;
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ip, port }));
        setUploadProgress(100);
        setSendComplete(true);
        toast.success(
            mode === 'active'
                ? `Sent and loaded as the active job on ${ip}`
                : files.length === 1
                  ? `Sent to ${ip}'s file library`
                  : `Sent ${files.length} files to ${ip}'s file library`,
            { position: 'bottom-right' },
        );
        setTimeout(() => handleOpenChange(false), 600);
    };

    const currentFile = files[currentIndex];

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-surface-raised">
                <DialogHeader>
                    <DialogTitle>Send to Pendant</DialogTitle>
                    <DialogDescription>
                        Send one or more g-code files to a tablet running the
                        gSender pendant with Remote File Receive turned on.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2 text-sm">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label
                                htmlFor="pendant-ip"
                                className="block text-xs text-gray-600 dark:text-content-muted mb-1"
                            >
                                Tablet IP
                            </label>
                            <input
                                id="pendant-ip"
                                className="w-full border border-gray-200 dark:border-outline rounded p-2 dark:bg-surface-base dark:text-content-primary disabled:opacity-50"
                                value={ip}
                                placeholder="192.168.1.42"
                                disabled={sending}
                                onChange={(e) => setIp(e.target.value.trim())}
                            />
                        </div>
                        <div className="w-24">
                            <label
                                htmlFor="pendant-port"
                                className="block text-xs text-gray-600 dark:text-content-muted mb-1"
                            >
                                Port
                            </label>
                            <input
                                id="pendant-port"
                                type="number"
                                className="w-full border border-gray-200 dark:border-outline rounded p-2 dark:bg-surface-base dark:text-content-primary disabled:opacity-50"
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
                            className="block text-xs text-gray-600 dark:text-content-muted mb-1"
                        >
                            Pairing code (shown on the tablet)
                        </label>
                        <input
                            id="pendant-code"
                            className="w-full border border-gray-200 dark:border-outline rounded p-2 font-mono tracking-widest dark:bg-surface-base dark:text-content-primary disabled:opacity-50"
                            value={code}
                            maxLength={6}
                            placeholder="000000"
                            disabled={sending}
                            onChange={(e) => setCode(e.target.value.trim())}
                        />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={mode === 'library'}
                                disabled={sending}
                                onChange={() => setMode('library')}
                            />
                            Add to file library
                        </label>
                        <label
                            className={`flex items-center gap-2 ${files.length > 1 ? 'opacity-50' : ''}`}
                        >
                            <input
                                type="radio"
                                checked={mode === 'active'}
                                disabled={sending || files.length > 1}
                                onChange={() => setMode('active')}
                            />
                            Load as active job
                        </label>
                    </div>
                    {files.length > 1 && mode === 'library' && (
                        <p className="-mt-2 text-xs text-gray-500">
                            Only one file can be the active job, so multiple
                            files always go to the file library.
                        </p>
                    )}

                    <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 ${
                            sending
                                ? 'border-gray-200 opacity-60 pointer-events-none'
                                : dragOver
                                  ? 'border-blue-400 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        {files.length > 0 ? (
                            <div className="space-y-2">
                                <div className="max-h-36 overflow-y-auto space-y-1.5">
                                    {files.map((f, i) => (
                                        <div
                                            key={`${f.name}:${f.size}`}
                                            className="flex items-center gap-2 bg-gray-50 dark:bg-surface-base rounded px-2 py-1.5"
                                        >
                                            <FileIcon className="w-4 h-4 shrink-0 text-gray-500" />
                                            <span className="flex-1 min-w-0 truncate text-left">
                                                {f.name}
                                            </span>
                                            <span className="text-xs text-gray-500 shrink-0">
                                                {formatFileSize(f.size)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                disabled={sending}
                                                className="p-0.5 hover:bg-gray-200 rounded shrink-0"
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
                                    className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                                >
                                    + Add more files
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                    Drag & drop g-code files, or{' '}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="text-blue-600 dark:text-blue-400 font-medium"
                                    >
                                        browse
                                    </button>
                                </p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={GCODE_ACCEPT}
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                        />
                    </div>

                    {sending && (
                        <div className="space-y-2">
                            {sendComplete ? (
                                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in-0 duration-300">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Sent!</span>
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
                                    <div className="relative w-full bg-gray-200 dark:bg-surface-base rounded-full h-2.5 overflow-hidden border border-gray-300/60 dark:border-outline">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-[width] duration-150 ease-out"
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

                <DialogFooter>
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={files.length === 0 || sending}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sendComplete
                            ? 'Sent'
                            : sending
                              ? `Sending… ${uploadProgress}%`
                              : files.length > 1
                                ? `Send ${files.length} files`
                                : 'Send'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendToPendantDialog;
