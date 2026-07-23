import { clsx } from 'clsx';

// direction encoding matches RunProbe.tsx's directionLabels: 0=bl, 1=tl, 2=tr, 3=br
// BracketIcon's base path elbows at the bottom-left of the (centered) viewBox,
// so rotation is measured relative to that (0deg = bottom-left), rotating
// clockwise: 90deg = top-left, 180deg = top-right, 270deg = bottom-right.
const CORNERS: { direction: number; label: string; rotation: number }[] = [
    { direction: 1, label: 'Top left', rotation: 90 },
    { direction: 2, label: 'Top right', rotation: 180 },
    { direction: 0, label: 'Bottom left', rotation: 0 },
    { direction: 3, label: 'Bottom right', rotation: 270 },
];

const DEFAULT_DIRECTION = 0; // bottom-left

interface CornerSelectorProps {
    direction: number;
    onChange: (direction: number) => void;
}

function BracketIcon({ rotation, selected }: { rotation: number; selected: boolean }) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 28 28"
            fill="none"
            style={{ transform: `rotate(${rotation}deg)` }}
            aria-hidden="true"
        >
            <path
                d="M8 8 V20 H20"
                stroke={selected ? '#4ade80' : 'var(--content-muted)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

export default function CornerSelector({ direction, onChange }: CornerSelectorProps) {
    const selectedCorner = CORNERS.find((c) => c.direction === direction);
    const isNonDefault = direction !== DEFAULT_DIRECTION;

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
                {CORNERS.map((corner) => {
                    const selected = corner.direction === direction;
                    return (
                        <button
                            key={corner.direction}
                            type="button"
                            onClick={() => onChange(corner.direction)}
                            className={clsx(
                                'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 transition-colors',
                                selected
                                    ? 'border-green-400 bg-green-400/10'
                                    : 'border-gray-300 dark:border-outline bg-white dark:bg-dark',
                            )}
                        >
                            <BracketIcon rotation={corner.rotation} selected={selected} />
                            <span
                                className={clsx(
                                    'text-sm font-medium',
                                    selected
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-600 dark:text-content-secondary',
                                )}
                            >
                                {corner.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="text-sm text-gray-500 dark:text-content-muted text-center">
                <span className="font-bold text-gray-700 dark:text-content-secondary">
                    {selectedCorner?.label ?? 'Unknown'}
                </span>{' '}
                selected
            </p>

            <div
                className={clsx(
                    'rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 transition-opacity',
                    isNonDefault ? 'opacity-100 visible' : 'opacity-0 invisible',
                )}
                aria-hidden={!isNonDefault}
            >
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    Non-default corner selected. Confirm this is correct for
                    the current job.
                </p>
            </div>
        </div>
    );
}
