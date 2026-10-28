import cn from 'classnames';
import { FileText, Wifi } from 'lucide-react';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';
import { canLoadRecent, type RecentFile } from '../../../hooks/useFileActions';
import { formatDay, formatSize } from '../../../utils/format';

const RING_R = 14;
const RING_C = 2 * Math.PI * RING_R;

/** A recent-file row that loads only after a full hold; a fill sweeps
 * across the row and a ring closes as the hold progresses. */
export default function RecentRow({
    file,
    onLoad,
}: {
    file: RecentFile;
    onLoad: (file: RecentFile) => void;
}) {
    const loadable = canLoadRecent(file);
    const { progress, holding, showProgress, hintNode, bind } =
        useHoldToActivate(() => onLoad(file), {
            disabled: !loadable,
            hint: 'Hold to load',
        });

    return (
        <button
            type="button"
            disabled={!loadable}
            aria-label={`Hold to load ${file.fileName}`}
            {...bind}
            className={cn(
                // touch-pan-y keeps the list scrollable; a scroll cancels the hold
                'relative shrink-0 flex items-center gap-3 px-3 py-[14px] rounded-md border bg-surface-raised text-left overflow-hidden select-none touch-pan-y transition-colors',
                holding ? 'border-blue-500/60' : 'border-outline-subtle',
                !loadable && 'opacity-50',
            )}
        >
            <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-blue-500/20 pointer-events-none"
                style={{ width: `${progress * 100}%` }}
            />
            {file.source === 'remote' ? (
                <Wifi
                    aria-label="Received from a desktop"
                    className="relative shrink-0 w-6 h-6 text-blue-400"
                />
            ) : (
                <FileText
                    aria-hidden
                    className="relative shrink-0 w-6 h-6 text-content-muted"
                />
            )}
            <span className="relative flex-1 min-w-0 font-mono text-[21px] text-content-primary truncate">
                {file.fileName}
            </span>
            <span className="relative shrink-0 font-mono text-[18px] text-content-muted">
                {formatSize(file.fileSize)} · {formatDay(file.timeLoaded)}
            </span>
            {loadable && (
                <svg
                    aria-hidden
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    className="relative shrink-0 -rotate-90"
                >
                    <circle
                        cx="18"
                        cy="18"
                        r={RING_R}
                        fill="none"
                        strokeWidth="4"
                        className="stroke-outline-subtle"
                    />
                    <circle
                        cx="18"
                        cy="18"
                        r={RING_R}
                        fill="none"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="stroke-blue-400"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - progress)}
                        opacity={showProgress ? 1 : 0}
                    />
                </svg>
            )}
            {hintNode}
        </button>
    );
}
