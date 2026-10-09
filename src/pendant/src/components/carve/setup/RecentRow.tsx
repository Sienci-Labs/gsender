import cn from 'classnames';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';
import { canLoadRecent, type RecentFile } from '../../../hooks/useFileActions';
import { formatDay, formatSize } from '../../../utils/format';

const HOLD_MS = 1000;
const RING_R = 7;
const RING_C = 2 * Math.PI * RING_R;

/** A recent-file row that loads only after a full 1 s hold; a fill sweeps
 * across the row and a ring closes as the hold progresses. */
export default function RecentRow({
    file,
    onLoad,
}: {
    file: RecentFile;
    onLoad: (file: RecentFile) => void;
}) {
    const loadable = canLoadRecent(file);
    const { progress, holding, bind } = useHoldToActivate(() => onLoad(file), {
        durationMs: HOLD_MS,
        disabled: !loadable,
    });

    return (
        <button
            type="button"
            disabled={!loadable}
            aria-label={`Hold to load ${file.fileName}`}
            {...bind}
            className={cn(
                // touch-pan-y keeps the list scrollable; a scroll cancels the hold
                'relative flex items-center gap-2 px-[9px] py-[7px] rounded-md border bg-surface-raised text-left overflow-hidden select-none touch-pan-y transition-colors',
                holding ? 'border-blue-500/60' : 'border-outline-subtle',
                !loadable && 'opacity-50',
            )}
        >
            <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-blue-500/20 pointer-events-none"
                style={{ width: `${progress * 100}%` }}
            />
            <span className="relative flex-1 min-w-0 font-mono text-[10.5px] text-content-primary truncate">
                {file.fileName}
            </span>
            <span className="relative shrink-0 font-mono text-[9px] text-content-muted">
                {formatSize(file.fileSize)} · {formatDay(file.timeLoaded)}
            </span>
            {loadable && (
                <svg
                    aria-hidden
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className="relative shrink-0 -rotate-90"
                >
                    <circle
                        cx="9"
                        cy="9"
                        r={RING_R}
                        fill="none"
                        strokeWidth="2"
                        className="stroke-outline-subtle"
                    />
                    <circle
                        cx="9"
                        cy="9"
                        r={RING_R}
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="stroke-blue-400"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - progress)}
                        opacity={holding ? 1 : 0}
                    />
                </svg>
            )}
        </button>
    );
}
