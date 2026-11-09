import { ChevronDown, QrCode, Tablet, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import type { PendantTablet } from './usePendantTablets';

interface TabletPickerProps {
    // Paired tablets only - unpaired discoveries aren't sendable.
    tablets: PendantTablet[];
    selectedId: string | null;
    disabled: boolean;
    onSelect: (id: string) => void;
    onPairNew: () => void;
    onPairManual: () => void;
    onForget: (id: string) => void;
}

const StatusLine: React.FC<{ tablet: PendantTablet }> = ({ tablet }) => (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-content-muted">
        <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
                tablet.online ? 'bg-green-500' : 'bg-gray-400'
            }`}
        />
        {tablet.online ? 'Online' : 'Offline'}
        {tablet.host && (
            <span className="text-gray-400 dark:text-content-muted">
                · {tablet.online ? '' : 'last seen '}
                {tablet.host}
            </span>
        )}
    </span>
);

export const TabletPicker: React.FC<TabletPickerProps> = ({
    tablets,
    selectedId,
    disabled,
    onSelect,
    onPairNew,
    onPairManual,
    onForget,
}) => {
    const [expanded, setExpanded] = useState(false);
    const selected = tablets.find((t) => t.id === selectedId);

    if (tablets.length === 0) {
        return (
            <div className="flex flex-col items-center text-center rounded-lg border border-gray-200 dark:border-outline bg-gray-50 dark:bg-surface-base px-6 py-6">
                <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-robin-500/10 text-robin-700 dark:text-robin-400">
                    <Tablet className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-900 dark:text-content-primary">
                    No pendant paired yet
                </p>
                <p className="mt-1 mb-4 text-xs text-gray-500 dark:text-content-muted">
                    Pair once and it's remembered for future sends.
                </p>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onPairNew}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-robin-700 hover:bg-robin-800 disabled:opacity-50"
                >
                    <QrCode className="w-4 h-4" />
                    Pair with QR code
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onPairManual}
                    className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-content-muted dark:hover:text-content-primary"
                >
                    Enter IP & code instead
                </button>
            </div>
        );
    }

    const canChange = tablets.length > 1;

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-content-muted">
                Sending to
            </p>
            <div className="rounded-lg border border-robin-500/60 bg-robin-500/5 dark:bg-robin-500/10">
                <div className="flex items-center gap-3 px-3 py-3">
                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-robin-500/15 text-robin-700 dark:text-robin-400">
                        <Tablet className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        {selected ? (
                            <>
                                <p className="font-medium truncate text-gray-900 dark:text-content-primary">
                                    {selected.name}
                                </p>
                                <StatusLine tablet={selected} />
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-content-muted">
                                Choose a tablet
                            </p>
                        )}
                    </div>
                    {canChange ? (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setExpanded((v) => !v)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-robin-700 dark:text-robin-400 hover:bg-robin-500/10 disabled:opacity-50"
                        >
                            Change
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                        </button>
                    ) : (
                        selected && (
                            <button
                                type="button"
                                title="Forget this tablet"
                                disabled={disabled}
                                onClick={() => onForget(selected.id)}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 dark:hover:bg-surface-base dark:hover:text-content-primary"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )
                    )}
                </div>

                {canChange && expanded && (
                    <div className="border-t border-robin-500/20 py-1">
                        {tablets.map((t) => (
                            <div
                                key={t.id}
                                className="group flex items-center gap-2 px-3 hover:bg-robin-500/10"
                            >
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        onSelect(t.id);
                                        setExpanded(false);
                                    }}
                                    className="flex flex-1 min-w-0 items-center gap-2 py-2 text-left"
                                >
                                    <span
                                        className={`inline-block w-1.5 h-1.5 shrink-0 rounded-full ${
                                            t.online
                                                ? 'bg-green-500'
                                                : 'bg-gray-400'
                                        }`}
                                    />
                                    <span
                                        className={`truncate ${
                                            t.id === selectedId
                                                ? 'font-medium text-gray-900 dark:text-content-primary'
                                                : 'text-gray-700 dark:text-content-primary'
                                        }`}
                                    >
                                        {t.name}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400 shrink-0">
                                        {t.host}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    title="Forget this tablet"
                                    disabled={disabled}
                                    onClick={() => onForget(t.id)}
                                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-content-primary"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3 text-xs">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onPairNew}
                    className="flex items-center gap-1 font-medium text-robin-700 dark:text-robin-400 hover:underline"
                >
                    <QrCode className="w-3.5 h-3.5" />
                    Pair another tablet
                </button>
                <span className="text-gray-300 dark:text-outline">·</span>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onPairManual}
                    className="text-gray-500 hover:text-gray-700 dark:text-content-muted dark:hover:text-content-primary"
                >
                    Enter IP manually
                </button>
            </div>
        </div>
    );
};

export default TabletPicker;
