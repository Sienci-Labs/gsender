import { Switch } from 'app/components/shadcn/Switch';
import { WORKFLOW_STATE_RUNNING } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import {
    CheckCircle2,
    File as FileIcon,
    FileCode,
    Plus,
    Upload,
    X,
} from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';

import PairWithQr from './PairWithQr';
import TabletPicker from './TabletPicker';
import { GCODE_ACCEPT, useSendToTablet } from './useSendToTablet';

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Both cards share one fixed height so the layout doesn't jump between
// states (picking, QR pairing, manual pairing, file lists, sending). Content
// that doesn't fit scrolls inside the card body.
const cardClass =
    'flex flex-col h-[34rem] rounded-xl bg-white dark:bg-surface-raised shadow border border-gray-200 dark:border-outline p-5 text-sm';
const cardHeaderClass = 'shrink-0 mb-4';
const cardBodyClass =
    'flex-1 min-h-0 overflow-y-auto space-y-4 -mx-1 px-1 py-1';
const cardFooterClass = 'shrink-0 pt-4 space-y-3';
const headingClass =
    'text-base font-semibold text-gray-900 dark:text-content-primary';
const mutedClass = 'text-xs text-gray-500 dark:text-content-muted';
const inputClass =
    'w-full rounded-md border border-gray-200 dark:border-outline bg-white dark:bg-surface-base px-3 py-2 text-gray-900 dark:text-content-primary focus:outline-none focus:ring-2 focus:ring-robin-500/40 focus:border-robin-500 disabled:opacity-50';
const labelClass =
    'block text-xs font-medium text-gray-600 dark:text-content-muted mb-1';
const primaryButtonClass =
    'px-4 py-2 text-sm font-medium rounded-md text-white bg-robin-700 hover:bg-robin-800 disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButtonClass =
    'px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-content-primary dark:bg-surface-base dark:hover:bg-surface-base/70';

/**
 * Tools → Tablet Connect: pair tablets running the gSender pendant and send
 * them g-code files over Wi-Fi.
 */
export const TabletConnect: React.FC = () => {
    const s = useSendToTablet();
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadedFile = useTypedSelector((state) => state.file);
    const jobRunning = useTypedSelector(
        (state) => state.controller.workflow.state === WORKFLOW_STATE_RUNNING,
    );

    const loadedName = loadedFile.fileLoaded ? loadedFile.name : null;
    const canAddLoaded = Boolean(loadedName && loadedFile.content);
    const loadedAlreadyAdded = s.files.some((f) => f.name === loadedName);

    const hasTablet = Boolean(s.selected);
    const sendDisabled =
        !hasTablet || s.files.length === 0 || s.sending || jobRunning;
    const currentFile = s.files[s.currentIndex];

    return (
        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
            {/* Tablets */}
            <section
                className={cardClass}
                aria-labelledby="tablet-connect-tablets"
            >
                <div className={cardHeaderClass}>
                    <h2 id="tablet-connect-tablets" className={headingClass}>
                        Tablets
                    </h2>
                    <p className={mutedClass}>
                        On the tablet, open Tools → Remote File Receive and turn
                        it on. Then scan this computer's QR code, or enter the
                        IP and code it shows.
                    </p>
                </div>

                <div className={cardBodyClass}>
                    {s.view === 'qr' && (
                        <PairWithQr
                            onPaired={s.handlePaired}
                            onUseCode={() => s.startManual()}
                            onCancel={() => s.setView('pick')}
                        />
                    )}

                    {s.view === 'manual' && (
                        <form
                            className="space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                s.submitManualPairing();
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-content-muted">
                                    Pair with code
                                </p>
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
                                        value={s.ip}
                                        placeholder="192.168.1.42"
                                        onChange={(e) =>
                                            s.setIp(e.target.value.trim())
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
                                        value={s.port}
                                        onChange={(e) =>
                                            s.setPort(Number(e.target.value))
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
                                    value={s.code}
                                    maxLength={6}
                                    placeholder="000000"
                                    onChange={(e) =>
                                        s.setCode(e.target.value.trim())
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className={secondaryButtonClass}
                                    onClick={() => s.setView('pick')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={primaryButtonClass}
                                    disabled={!s.ip || !s.port || !s.code}
                                >
                                    Pair
                                </button>
                            </div>
                        </form>
                    )}

                    {s.view === 'pick' && (
                        <TabletPicker
                            tablets={s.pairedTablets}
                            selectedId={s.selected?.id ?? null}
                            disabled={s.sending}
                            onSelect={s.selectTablet}
                            onPairNew={() => s.setView('qr')}
                            onPairManual={() => s.startManual()}
                            onForget={s.forget}
                        />
                    )}
                </div>
            </section>

            {/* Send files */}
            <section
                className={`${cardClass} ${hasTablet ? '' : 'opacity-60'}`}
                aria-labelledby="tablet-connect-send"
                aria-disabled={!hasTablet}
            >
                <div className={cardHeaderClass}>
                    <h2 id="tablet-connect-send" className={headingClass}>
                        Send files
                    </h2>
                    <p className={mutedClass}>
                        {hasTablet
                            ? `Files go to ${s.selected?.name}'s file library.`
                            : 'Pair a tablet to send files to it.'}
                    </p>
                </div>

                <div className={cardBodyClass}>
                    {canAddLoaded && (
                        <button
                            type="button"
                            disabled={
                                !hasTablet || s.sending || loadedAlreadyAdded
                            }
                            onClick={() =>
                                s.addContent(
                                    loadedName as string,
                                    loadedFile.content,
                                )
                            }
                            className="w-full flex items-center gap-3 rounded-lg border border-gray-200 dark:border-outline px-3 py-2.5 text-left hover:border-robin-500 hover:bg-robin-500/5 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                        >
                            <FileCode className="w-5 h-5 shrink-0 text-robin-700 dark:text-robin-400" />
                            <span className="flex-1 min-w-0">
                                <span className="block font-medium text-gray-900 dark:text-content-primary">
                                    {loadedAlreadyAdded
                                        ? 'Loaded file added'
                                        : 'Send loaded file'}
                                </span>
                                <span className="block truncate text-xs text-gray-500 dark:text-content-muted">
                                    {loadedName}
                                </span>
                            </span>
                            {!loadedAlreadyAdded && (
                                <Plus className="w-4 h-4 shrink-0 text-gray-400" />
                            )}
                        </button>
                    )}

                    <div
                        className={`rounded-lg border-2 border-dashed transition-colors duration-150 ${
                            !hasTablet || s.sending
                                ? 'border-gray-200 dark:border-outline pointer-events-none'
                                : dragOver
                                  ? 'border-robin-500 bg-robin-500/5'
                                  : 'border-gray-200 dark:border-outline hover:border-gray-300 dark:hover:border-content-muted'
                        } ${s.files.length > 0 ? 'p-2' : 'p-6'}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            setDragOver(false);
                            s.handleDrop(e);
                        }}
                    >
                        {s.files.length > 0 ? (
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    {s.files.map((f, i) => (
                                        <div
                                            key={`${f.name}:${f.size}`}
                                            className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-gray-50 dark:bg-surface-base"
                                        >
                                            <FileIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                            <span className="flex-1 min-w-0 truncate text-left text-gray-800 dark:text-content-primary">
                                                {f.name}
                                            </span>
                                            <span className="text-xs text-gray-400 tabular-nums shrink-0">
                                                {formatFileSize(f.size)}
                                            </span>
                                            <button
                                                type="button"
                                                title="Remove"
                                                aria-label={`Remove ${f.name}`}
                                                onClick={() => s.removeFile(i)}
                                                disabled={s.sending}
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
                                    disabled={s.sending}
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
                                        disabled={!hasTablet}
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
                            data-testid="tablet-connect-file-input"
                            onChange={(e) => {
                                s.handleFileSelect(e.target.files);
                                e.target.value = '';
                            }}
                            className="hidden"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <label
                            htmlFor="pendant-load-active"
                            className={`min-w-0 ${s.multipleFiles ? 'opacity-60' : 'cursor-pointer'}`}
                        >
                            <span className="block font-medium text-gray-900 dark:text-content-primary">
                                Load as active job
                            </span>
                            <span className={`block ${mutedClass}`}>
                                {s.multipleFiles
                                    ? 'Only one file can be the active job, so multiple files go to the library.'
                                    : "Always added to the pendant's file library too."}
                            </span>
                        </label>
                        <Switch
                            id="pendant-load-active"
                            checked={s.willLoadActive}
                            disabled={
                                !hasTablet || s.sending || s.multipleFiles
                            }
                            onChange={(checked) => s.setLoadActive(checked)}
                        />
                    </div>
                </div>

                <div className={cardFooterClass}>
                    {s.sending && (
                        <div className="space-y-2" aria-live="polite">
                            {s.sendComplete ? (
                                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Sent!</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center text-xs text-gray-600 dark:text-content-muted">
                                        <span className="font-medium truncate">
                                            {s.files.length > 1
                                                ? `Sending ${s.currentIndex + 1} of ${s.files.length}: ${currentFile?.name}…`
                                                : `Sending ${currentFile?.name}…`}
                                        </span>
                                        <span className="tabular-nums">
                                            {s.uploadProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-surface-base">
                                        <div
                                            className="h-full rounded-full bg-robin-500 transition-[width] duration-150 ease-out"
                                            style={{
                                                width: `${s.uploadProgress}%`,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {jobRunning && (
                        <p className={mutedClass}>
                            Sending is paused while a job is running.
                        </p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={s.handleSend}
                            disabled={sendDisabled}
                            className={primaryButtonClass}
                        >
                            {s.sendComplete
                                ? 'Sent'
                                : s.sending
                                  ? `Sending… ${s.uploadProgress}%`
                                  : s.files.length > 1
                                    ? `Send ${s.files.length} files`
                                    : 'Send'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TabletConnect;
