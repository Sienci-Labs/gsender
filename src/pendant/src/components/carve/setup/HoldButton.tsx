import cn from 'classnames';
import type { ReactNode } from 'react';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';

const HOLD_MS = 1000;

/** A button that fires only after a full 1 s hold; a fill sweeps across it
 * as the hold progresses (same feedback as RecentRow). */
export default function HoldButton({
    onActivate,
    disabled,
    className,
    holdingClassName = 'ring-1 ring-blue-400/70',
    fillClassName = 'bg-blue-500/25',
    'aria-label': ariaLabel,
    children,
}: {
    onActivate: () => void;
    disabled?: boolean;
    className?: string;
    /** Extra classes while held. A ring, since a border class would lose to
     * the caller's border on source order. */
    holdingClassName?: string;
    fillClassName?: string;
    'aria-label'?: string;
    children: ReactNode;
}) {
    const { progress, holding, hintNode, bind } = useHoldToActivate(
        onActivate,
        { durationMs: HOLD_MS, disabled, hint: ariaLabel ?? 'Hold to confirm' },
    );

    return (
        <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            {...bind}
            className={cn(
                'relative overflow-hidden select-none touch-none transition-colors',
                className,
                holding && holdingClassName,
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'absolute inset-y-0 left-0 pointer-events-none',
                    fillClassName,
                )}
                style={{ width: `${progress * 100}%` }}
            />
            <span className="relative flex items-center justify-center gap-[inherit]">
                {children}
            </span>
            {hintNode}
        </button>
    );
}
