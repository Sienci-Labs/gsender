import { QrCode, Tablet, X } from 'lucide-react';
import type React from 'react';

import type { PendantTablet } from './usePendantTablets';

interface TabletPickerProps {
    tablets: PendantTablet[];
    selectedId: string | null;
    disabled: boolean;
    onSelect: (id: string) => void;
    onPairNew: () => void;
    onPairWithCode: (tablet?: PendantTablet) => void;
    onForget: (id: string) => void;
}

export const TabletPicker: React.FC<TabletPickerProps> = ({
    tablets,
    selectedId,
    disabled,
    onSelect,
    onPairNew,
    onPairWithCode,
    onForget,
}) => {
    const paired = tablets.filter((t) => t.paired);
    const unpaired = tablets.filter((t) => !t.paired);

    return (
        <div className="space-y-3">
            <div>
                <p className="text-xs text-gray-600 dark:text-content-muted mb-1">
                    Paired tablets
                </p>
                {paired.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">
                        No paired tablets yet.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {paired.map((t) => (
                            <div
                                key={t.id}
                                className={`flex items-center gap-2 rounded border px-2 py-1.5 ${
                                    selectedId === t.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                        : 'border-gray-200 dark:border-outline'
                                } ${t.online ? '' : 'opacity-70'}`}
                            >
                                <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={selectedId === t.id}
                                        disabled={disabled}
                                        onChange={() => onSelect(t.id)}
                                    />
                                    <Tablet className="w-4 h-4 shrink-0 text-gray-500" />
                                    <span className="truncate">{t.name}</span>
                                    <span
                                        className={`ml-auto text-xs shrink-0 ${
                                            t.online
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        {t.online
                                            ? 'Online'
                                            : `Not seen${t.host ? ` · last ${t.host}` : ''}`}
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    title="Forget this tablet"
                                    disabled={disabled}
                                    onClick={() => onForget(t.id)}
                                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-surface-base rounded shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {unpaired.length > 0 && (
                <div>
                    <p className="text-xs text-gray-600 dark:text-content-muted mb-1">
                        Found on this network
                    </p>
                    <div className="space-y-1.5">
                        {unpaired.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center gap-2 rounded border border-dashed border-gray-300 dark:border-outline px-2 py-1.5"
                            >
                                <Tablet className="w-4 h-4 shrink-0 text-gray-500" />
                                <span className="flex-1 min-w-0 truncate">
                                    {t.name}
                                </span>
                                <span className="text-xs text-gray-500 shrink-0">
                                    {t.host}
                                </span>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={onPairNew}
                                    className="text-xs text-blue-600 dark:text-blue-400 font-medium shrink-0"
                                >
                                    Pair
                                </button>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onPairWithCode(t)}
                                    className="text-xs text-gray-600 dark:text-content-muted shrink-0"
                                >
                                    Use code
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 text-xs">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onPairNew}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"
                >
                    <QrCode className="w-3.5 h-3.5" />
                    Pair a new tablet
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPairWithCode()}
                    className="text-gray-600 dark:text-content-muted"
                >
                    Enter IP manually
                </button>
            </div>
        </div>
    );
};

export default TabletPicker;
