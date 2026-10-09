import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Press-and-hold confirmation: progress runs 0→1 over `durationMs` while the
 * pointer stays down, and onActivate fires only if the full duration is
 * reached. Releasing, leaving or cancelling early resets without firing.
 */
export function useHoldToActivate(
    onActivate: () => void,
    { durationMs = 1000, disabled = false } = {},
) {
    const [progress, setProgress] = useState(0);
    const [holding, setHolding] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef(0);
    // Latest callback/disabled without restarting a hold in progress
    const activateRef = useRef(onActivate);
    activateRef.current = onActivate;
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;

    const stop = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        setHolding(false);
        setProgress(0);
    }, []);

    useEffect(() => stop, [stop]);

    const tick = useCallback(
        (now: number) => {
            const pct = Math.min((now - startRef.current) / durationMs, 1);
            setProgress(pct);
            if (pct >= 1) {
                rafRef.current = null;
                setHolding(false);
                setProgress(0);
                if (!disabledRef.current) activateRef.current();
                if (navigator.vibrate) navigator.vibrate(12);
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        },
        [durationMs],
    );

    const onPointerDown = (e: React.PointerEvent) => {
        if (disabledRef.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startRef.current = performance.now();
        setHolding(true);
        setProgress(0);
        rafRef.current = requestAnimationFrame(tick);
    };

    return {
        progress,
        holding,
        bind: {
            onPointerDown,
            onPointerUp: stop,
            onPointerLeave: stop,
            onPointerCancel: stop,
            onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        },
    };
}
