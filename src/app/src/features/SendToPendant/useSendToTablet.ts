import api from 'app/api';
import { toast } from 'app/lib/toaster';
import axios from 'axios';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type PendantTablet, usePendantTablets } from './usePendantTablets';

const STORAGE_KEY = 'sendToPendant.lastTabletId';
export const DEFAULT_PORT = 8010;
export const GCODE_ACCEPT = '.gcode,.nc,.tap,.cnc,.g,.gc';

// How long the "Sent" state stays up before the form clears for the next send.
const SENT_RESET_MS = 1500;

// 'pick' shows the paired tablets, 'qr' shows the pairing QR, and
// 'manual' is the IP + code fallback for networks that block mDNS.
export type PairingView = 'pick' | 'qr' | 'manual';

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

const fileKey = (f: File) => `${f.name}:${f.size}`;

/**
 * Pairing and file-sending state for the Tablet Connect tool.
 * Files go straight from this renderer to the tablet's Remote File Receive
 * server; the desktop server only handles discovery and pairing.
 */
export function useSendToTablet() {
    const [view, setView] = useState<PairingView>('pick');
    const [selectedId, setSelectedId] = useState<string | null>(
        loadLastTabletId,
    );
    const [ip, setIp] = useState('');
    const [port, setPort] = useState(DEFAULT_PORT);
    const [code, setCode] = useState('');
    const [loadActive, setLoadActive] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendComplete, setSendComplete] = useState(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { desktopId, tablets, forget, refresh } = usePendantTablets(true);

    useEffect(
        () => () => {
            if (resetTimer.current) {
                clearTimeout(resetTimer.current);
            }
        },
        [],
    );

    const pairedTablets = useMemo(
        () => tablets.filter((t) => t.paired),
        [tablets],
    );

    // Keep a valid target selected - prefer one that's online.
    useEffect(() => {
        if (pairedTablets.some((t) => t.id === selectedId)) return;
        const fallback =
            pairedTablets.find((t) => t.online) ?? pairedTablets[0];
        if (fallback) setSelectedId(fallback.id);
    }, [pairedTablets, selectedId]);

    const selected = pairedTablets.find((t) => t.id === selectedId);

    const selectTablet = useCallback((id: string) => {
        setSelectedId(id);
        saveLastTabletId(id);
    }, []);

    const handlePaired = useCallback(
        (tablet: PendantTablet) => {
            toast.success(`Paired with ${tablet.name}`, {
                position: 'bottom-right',
            });
            selectTablet(tablet.id);
            setView('pick');
            refresh();
        },
        [refresh, selectTablet],
    );

    const startManual = useCallback((tablet?: PendantTablet) => {
        if (tablet?.host) {
            setIp(tablet.host);
            setPort(tablet.port || DEFAULT_PORT);
        }
        setCode('');
        setView('manual');
    }, []);

    // Only one file can be "the" active job, so multiple files only go to the
    // library. The preference is kept so it comes back at one file.
    const multipleFiles = files.length > 1;
    const willLoadActive = loadActive && !multipleFiles;

    const addFiles = useCallback((picked: File[]) => {
        const valid = picked.filter((f) => {
            const extension = `.${f.name.split('.').pop()?.toLowerCase()}`;
            if (!GCODE_ACCEPT.split(',').includes(extension)) {
                toast.error(`${f.name}: Unsupported file type`);
                return false;
            }
            return true;
        });
        if (valid.length === 0) return;

        setSendComplete(false);
        setFiles((prev) => {
            const existing = new Set(prev.map(fileKey));
            const merged = [...prev];
            for (const f of valid) {
                if (!existing.has(fileKey(f))) {
                    merged.push(f);
                    existing.add(fileKey(f));
                }
            }
            return merged;
        });
    }, []);

    const handleFileSelect = useCallback(
        (fileList: FileList | null) => {
            if (fileList) addFiles(Array.from(fileList));
        },
        [addFiles],
    );

    /** Adds G-code that's already in memory (e.g. the loaded job). */
    const addContent = useCallback(
        (name: string, content: string) => {
            addFiles([new File([content], name, { type: 'text/plain' })]);
        },
        [addFiles],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files);
        },
        [handleFileSelect],
    );

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const resetSend = useCallback(() => {
        setFiles([]);
        setSending(false);
        setCurrentIndex(0);
        setUploadProgress(0);
        setSendComplete(false);
    }, []);

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

    /** Manual pairing without sending anything. */
    const submitManualPairing = async (): Promise<void> => {
        if (!ip || !port || !code) {
            toast.error('Tablet IP, port and pairing code are required');
            return;
        }
        const tablet = await pairWithCode();
        if (tablet) handlePaired(tablet);
    };

    const handleSend = async () => {
        if (files.length === 0) {
            toast.error('Add at least one file to send');
            return;
        }

        const target = selected;
        if (!target?.host || !target.port || !target.key) {
            toast.error('Choose a paired tablet to send to');
            setSending(false);
            return;
        }

        const { host, port: targetPort, key, name } = target;
        setSending(true);
        setSendComplete(false);

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
        resetTimer.current = setTimeout(resetSend, SENT_RESET_MS);
    };

    return {
        // pairing
        view,
        setView,
        pairedTablets,
        selected,
        selectTablet,
        handlePaired,
        startManual,
        submitManualPairing,
        forget,
        ip,
        setIp,
        port,
        setPort,
        code,
        setCode,
        // files
        files,
        addContent,
        handleFileSelect,
        handleDrop,
        removeFile,
        loadActive,
        setLoadActive,
        multipleFiles,
        willLoadActive,
        // sending
        handleSend,
        sending,
        sendComplete,
        currentIndex,
        uploadProgress,
    };
}
