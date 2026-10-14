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
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [sending, setSending] = useState(false);
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

    const handleFileSelect = (files: FileList | null) => {
        const picked = files?.[0];
        if (!picked) return;

        const extension = `.${picked.name.split('.').pop()?.toLowerCase()}`;
        if (!GCODE_ACCEPT.split(',').includes(extension)) {
            toast.error(`${picked.name}: Unsupported file type`);
            return;
        }

        setFile(picked);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setFile(null);
            setSending(false);
            setUploadProgress(0);
            setSendComplete(false);
            onClose();
        }
    };

    const handleSend = async () => {
        if (!file || !ip || !port || !code) {
            toast.error('Tablet IP, port, pairing code and a file are required');
            return;
        }

        setSending(true);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('gcode', file, file.name);
            formData.append('mode', mode);

            await axios.post(`http://${ip}:${port}/pendant/file`, formData, {
                headers: {
                    'X-Pendant-Token': code,
                    'X-Pendant-Filename': encodeURIComponent(file.name),
                },
                timeout: 30000,
                onUploadProgress: (event) => {
                    const total = event.total ?? file.size;
                    if (!total) return;
                    setUploadProgress(
                        Math.round((event.loaded / total) * 100),
                    );
                },
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ip, port }));
            setUploadProgress(100);
            setSendComplete(true);
            toast.success(
                mode === 'active'
                    ? `Sent and loaded as the active job on ${ip}`
                    : `Sent to ${ip}'s file library`,
                { position: 'bottom-right' },
            );
            setTimeout(() => handleOpenChange(false), 600);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                toast.error('Incorrect pairing code');
            } else if (error?.code === 'ECONNABORTED') {
                toast.error('Timed out reaching the tablet');
            } else {
                toast.error(
                    `Could not reach the tablet at ${ip}:${port}. Make sure Remote File Receive is turned on.`,
                );
            }
            setSending(false);
            setUploadProgress(0);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-surface-raised">
                <DialogHeader>
                    <DialogTitle>Send to Pendant</DialogTitle>
                    <DialogDescription>
                        Send a g-code file to a tablet running the gSender
                        pendant with Remote File Receive turned on.
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
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={mode === 'active'}
                                disabled={sending}
                                onChange={() => setMode('active')}
                            />
                            Load as active job
                        </label>
                    </div>

                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
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
                        {file ? (
                            <div className="flex items-center justify-center gap-2">
                                <FileIcon className="w-5 h-5" />
                                <span className="truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    disabled={sending}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                    Drag & drop a g-code file, or{' '}
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
                                            Sending {file?.name}…
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
                        disabled={!file || sending}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sendComplete
                            ? 'Sent'
                            : sending
                              ? `Sending… ${uploadProgress}%`
                              : 'Send'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendToPendantDialog;
