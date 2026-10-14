import { useIncomingFileTransfer } from 'app/features/RemoteFileReceive/useIncomingFileTransfer';
import cn from 'classnames';
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react';

/**
 * Persistent top-bar indicator for an in-flight Send to Pendant transfer.
 * Mounted in both CarveTopBar (redesigned) and PendantTopBar (legacy) so
 * it's visible regardless of which screen the operator is on. Renders
 * nothing while idle.
 */
export default function IncomingFilePill() {
    const { state, name, percent } = useIncomingFileTransfer();

    if (state === 'idle') {
        return null;
    }

    const isError = state === 'error';
    const isComplete = state === 'complete';

    return (
        <div
            className={cn(
                'conn-anim-pop-in relative flex items-center gap-1.5 h-8 pl-1 pr-2.5 rounded-full border overflow-hidden max-w-[170px] shrink-0',
                isError
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-green-600 bg-gray-200 dark:bg-surface-raised',
            )}
            title={isError ? `${name}: transfer failed` : name}
        >
            {!isError && (
                <div
                    className="absolute inset-y-0 left-0 bg-green-500/25 transition-[width] duration-150 ease-out pendant-progress-track"
                    style={{ width: `${isComplete ? 100 : percent}%` }}
                />
            )}
            <span className="relative flex items-center justify-center w-6 h-6 shrink-0">
                {isError ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : isComplete ? (
                    <CheckCircle2
                        className={cn(
                            'w-4 h-4 text-green-600',
                            'pendant-progress-complete',
                        )}
                    />
                ) : (
                    <Download className="w-4 h-4 text-green-700 dark:text-green-400" />
                )}
            </span>
            <span className="relative min-w-0 flex-1 text-left leading-tight">
                <span
                    className={cn(
                        'block text-[10.5px] font-semibold truncate',
                        isError
                            ? 'text-red-600'
                            : 'text-gray-900 dark:text-content-primary',
                    )}
                >
                    {isError ? 'Failed' : isComplete ? 'Received' : name}
                </span>
            </span>
            {!isError && !isComplete && (
                <span className="relative text-[10.5px] font-semibold tabular-nums text-green-700 dark:text-green-400 shrink-0">
                    {percent}%
                </span>
            )}
        </div>
    );
}
