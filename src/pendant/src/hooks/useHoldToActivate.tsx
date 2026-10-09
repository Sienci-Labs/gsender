import {
    type ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

/** A release before this counts as a tap, not an attempted hold. */
export const HOLD_TAP_MAX_MS = 300;
/** How long the "Hold to …" bubble stays up after a tap. */
export const HOLD_HINT_MS = 1500;
/** How long an unfinished hold takes to drain back to empty. */
export const HOLD_DRAIN_MS = 200;

interface HoldOptions {
    durationMs?: number;
    disabled?: boolean;
    /** Bubble text shown when the control is tapped instead of held; false
     * turns the bubble off. */
    hint?: string | false;
    /** Gives a tap its own meaning (e.g. open an info card) instead of the
     * hint. */
    onTap?: () => void;
}

/**
 * Press-and-hold confirmation: progress runs 0→1 over `durationMs` while the
 * pointer stays down, and onActivate fires only if the full duration is
 * reached. Releasing early drains the progress back to empty, and a quick tap
 * also shows a "Hold to …" bubble (render `hintNode` anywhere; it portals to
 * the body so clipped buttons can still show it). A browser cancel (e.g. the
 * list scrolled) drains without the bubble.
 *
 * Draw progress while `showProgress` is true, not `holding`, so the drain
 * is visible.
 */
export function useHoldToActivate(
    onActivate: () => void,
    {
        durationMs = 1000,
        disabled = false,
        hint = 'Hold to confirm',
        onTap,
    }: HoldOptions = {},
) {
    const [progress, setProgress] = useState(0);
    const [holding, setHolding] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const rafRef = useRef<number | null>(null);
    const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startRef = useRef(0);
    const progressRef = useRef(0);
    const pressingRef = useRef(false);
    const anchorRef = useRef<HTMLElement | null>(null);
    // Latest callbacks/disabled without restarting a hold in progress
    const activateRef = useRef(onActivate);
    activateRef.current = onActivate;
    const onTapRef = useRef(onTap);
    onTapRef.current = onTap;
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;

    const setP = (p: number) => {
        progressRef.current = p;
        setProgress(p);
    };

    const cancelFrame = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const hideHint = () => {
        if (hintTimerRef.current) {
            clearTimeout(hintTimerRef.current);
            hintTimerRef.current = null;
        }
        setHintVisible(false);
    };

    /** Drop everything immediately, no drain (unmount, or a host reset). */
    const reset = useCallback(() => {
        cancelFrame();
        hideHint();
        pressingRef.current = false;
        setHolding(false);
        setP(0);
    }, []);

    useEffect(() => reset, [reset]);

    const drain = () => {
        cancelFrame();
        const from = progressRef.current;
        if (from <= 0) return;
        const start = performance.now();
        const step = (now: number) => {
            const p = from * Math.max(0, 1 - (now - start) / HOLD_DRAIN_MS);
            setP(p);
            rafRef.current = p > 0 ? requestAnimationFrame(step) : null;
        };
        rafRef.current = requestAnimationFrame(step);
    };

    const tick = (now: number) => {
        const pct = Math.min((now - startRef.current) / durationMs, 1);
        setP(pct);
        if (pct >= 1) {
            rafRef.current = null;
            pressingRef.current = false;
            setHolding(false);
            setP(0);
            if (!disabledRef.current) activateRef.current();
            if (navigator.vibrate) navigator.vibrate(12);
            return;
        }
        rafRef.current = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: React.PointerEvent) => {
        if (disabledRef.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        cancelFrame();
        hideHint();
        anchorRef.current = (e.currentTarget as HTMLElement) ?? null;
        pressingRef.current = true;
        startRef.current = performance.now();
        setHolding(true);
        setP(0);
        rafRef.current = requestAnimationFrame(tick);
    };

    /** An unfinished press ends: drain, and on a tap show the hint. */
    const endPress = (released: boolean) => {
        if (!pressingRef.current) return;
        pressingRef.current = false;
        setHolding(false);
        drain();
        if (!released) return;
        if (performance.now() - startRef.current >= HOLD_TAP_MAX_MS) return;
        if (onTapRef.current) {
            onTapRef.current();
        } else if (hint !== false) {
            setHintVisible(true);
            hintTimerRef.current = setTimeout(hideHint, HOLD_HINT_MS);
        }
    };

    const hintNode =
        hintVisible && hint !== false && anchorRef.current ? (
            <HoldHint anchor={anchorRef.current} text={hint} />
        ) : null;

    return {
        progress,
        holding,
        /** True while holding or draining. */
        showProgress: holding || progress > 0,
        hintVisible,
        hintNode,
        reset,
        bind: {
            onPointerDown,
            onPointerUp: () => endPress(true),
            onPointerLeave: () => endPress(false),
            onPointerCancel: () => endPress(false),
            onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        },
    };
}

const GAP = 6;
const EDGE = 8;

/** A small bubble above (or, near the top, below) the anchor, clamped to
 * the viewport. Fixed-positioned in a portal so overflow can't clip it. */
function HoldHint({
    anchor,
    text,
}: {
    anchor: HTMLElement;
    text: string;
}): ReactNode {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(
        null,
    );

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const a = anchor.getBoundingClientRect();
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const left = Math.min(
            Math.max(EDGE, a.left + a.width / 2 - w / 2),
            window.innerWidth - w - EDGE,
        );
        const above = a.top - GAP - h;
        const top = above >= EDGE ? above : a.bottom + GAP;
        setPos({ left, top });
    }, [anchor, text]);

    return createPortal(
        <div
            ref={ref}
            role="status"
            className="fixed z-[1000] px-2 py-1 rounded-md border border-outline-strong bg-surface-elevated text-content-primary text-[10.5px] font-semibold whitespace-nowrap shadow-[0_4px_14px_rgba(0,0,0,0.45)] pointer-events-none transition-opacity duration-150"
            style={{
                left: pos?.left ?? 0,
                top: pos?.top ?? 0,
                opacity: pos ? 1 : 0,
            }}
        >
            {text}
        </div>,
        document.body,
    );
}
