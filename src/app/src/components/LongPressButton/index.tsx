
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LongPressCallbackReason, useLongPress } from 'use-long-press';

import { cn } from 'app/lib/utils';

export type LongPressButtonOptions = {
    holdDurationMs: number;
    progressDelayMs: number;
    progressHideDelayMs: number;
    flashDurationMs: number;
};

export type LongPressButtonProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'onClick'
    | 'onPointerDown'
    | 'onPointerUp'
    | 'onPointerLeave'
    | 'onPointerCancel'
    | 'onTouchCancel'
> & {
    label: React.ReactNode;
    icon?: React.ReactNode;
    secondaryLabel?: React.ReactNode;
    onClick?: () => void;
    onLongPress?: () => void;
    options?: Partial<LongPressButtonOptions>;
    containerClassName?: string;
    secondaryLabelClassName?: string;
};

const defaultOptions: LongPressButtonOptions = {
    holdDurationMs: 1000,
    progressDelayMs: 100,
    progressHideDelayMs: 140,
    flashDurationMs: 160,
};

const isTouchInput = (
    event:
        | React.MouseEvent<Element>
        | React.TouchEvent<Element>
        | React.PointerEvent<Element>,
) => {
    if ('pointerType' in event && typeof event.pointerType === 'string') {
        return event.pointerType === 'touch';
    }

    return 'touches' in event;
};

export const LongPressButton: React.FC<LongPressButtonProps> = ({
    label,
    icon,
    secondaryLabel,
    onClick,
    onLongPress,
    options,
    className,
    containerClassName,
    secondaryLabelClassName,
    disabled,
    ...rest
}: LongPressButtonProps) => {
    const resolvedOptions = useMemo(
        () => ({ ...defaultOptions, ...(options ?? {}) }),
        [options],
    );

    const [progress, setProgress] = useState(0);
    const [isProgressVisible, setIsProgressVisible] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const hasIcon = Boolean(icon);

    const startTimeRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const progressDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pressCancelledRef = useRef(false);

    const clearPressTimers = useCallback(() => {
        if (progressDelayTimeoutRef.current) {
            clearTimeout(progressDelayTimeoutRef.current);
            progressDelayTimeoutRef.current = null;
        }
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const clearAllTimers = useCallback(() => {
        clearPressTimers();
        if (progressHideTimeoutRef.current) {
            clearTimeout(progressHideTimeoutRef.current);
            progressHideTimeoutRef.current = null;
        }
        if (flashTimeoutRef.current) {
            clearTimeout(flashTimeoutRef.current);
            flashTimeoutRef.current = null;
        }
    }, [clearPressTimers]);

    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    const stopProgress = useCallback(
        (delayMs = 0) => {
            if (delayMs <= 0) {
                setIsProgressVisible(false);
                setProgress(0);
                return;
            }
            if (progressHideTimeoutRef.current) {
                clearTimeout(progressHideTimeoutRef.current);
            }
            progressHideTimeoutRef.current = setTimeout(() => {
                setIsProgressVisible(false);
                setProgress(0);
            }, delayMs);
        },
        [setIsProgressVisible],
    );

    const flashButton = useCallback(() => {
        setIsFlashing(true);
        if (flashTimeoutRef.current) {
            clearTimeout(flashTimeoutRef.current);
        }
        flashTimeoutRef.current = setTimeout(() => {
            setIsFlashing(false);
        }, resolvedOptions.flashDurationMs);
    }, [resolvedOptions.flashDurationMs]);

    const startProgressLoop = useCallback(() => {
        const update = (now: number) => {
            const elapsed = now - startTimeRef.current;
            const ratio = Math.min(elapsed / resolvedOptions.holdDurationMs, 1);
            setProgress(ratio);
            rafRef.current = requestAnimationFrame(update);
        };
        rafRef.current = requestAnimationFrame(update);
    }, [resolvedOptions.holdDurationMs]);

    const handlePressCancel = useCallback(() => {
        pressCancelledRef.current = true;
        clearPressTimers();
        stopProgress(0);
    }, [clearPressTimers, stopProgress]);

    const longPressHandlers = useLongPress(
        () => {
            if (disabled) {
                return;
            }
            if (onLongPress) {
                onLongPress();
            }
            setIsProgressVisible(true);
            setProgress(1);
            flashButton();
            stopProgress(resolvedOptions.progressHideDelayMs);
        },
        {
            threshold: resolvedOptions.holdDurationMs,
            cancelOnMovement: true,
            filterEvents: (event) => {
                if (disabled) {
                    return false;
                }
                if ('button' in event && typeof event.button === 'number') {
                    return event.button === 0;
                }
                return true;
            },
            onStart: (event) => {
                if (disabled) {
                    return;
                }
                if (isTouchInput(event)) {
                    event.preventDefault();
                }

                pressCancelledRef.current = false;
                startTimeRef.current = performance.now();
                setProgress(0);
                setIsFlashing(false);
                setIsProgressVisible(false);
                if (progressHideTimeoutRef.current) {
                    clearTimeout(progressHideTimeoutRef.current);
                    progressHideTimeoutRef.current = null;
                }
                if (progressDelayTimeoutRef.current) {
                    clearTimeout(progressDelayTimeoutRef.current);
                }
                progressDelayTimeoutRef.current = setTimeout(() => {
                    setIsProgressVisible(true);
                }, resolvedOptions.progressDelayMs);
                startProgressLoop();
            },
            onCancel: (event, meta) => {
                clearPressTimers();
                stopProgress(0);
                if (pressCancelledRef.current) {
                    pressCancelledRef.current = false;
                    return;
                }
                if (disabled) {
                    return;
                }
                if (meta.reason !== LongPressCallbackReason.CancelledByRelease) {
                    return;
                }

                if (isTouchInput(event)) {
                    event.preventDefault();
                }

                if (onClick) {
                    onClick();
                }
            },
            onFinish: () => {
                pressCancelledRef.current = false;
                clearPressTimers();
                stopProgress(resolvedOptions.progressHideDelayMs);
            },
        },
    )();

    return (
        <div className={cn('flex w-full flex-col items-center gap-2', containerClassName)}>
            <button
                type="button"
                className={cn(
                    'relative w-full min-h-12 select-none overflow-hidden rounded-lg border border-blue-500 bg-blue-500 px-4 py-3    text-center text-white shadow-md transition duration-150 hover:opacity-95',
                    'active:shadow-[inset_7px_4px_6px_0px_rgba(30,_64,_175,_0.25)]',
                    'disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-100 disabled:hover:bg-gray-300 dark:disabled:bg-dark',
                    'touch-manipulation',
                    isFlashing && 'ring-2 ring-white/70 brightness-110',
                    className,
                )}
                disabled={disabled}
                {...longPressHandlers}
                onContextMenu={(event) => event.preventDefault()}
                onPointerCancel={handlePressCancel}
                onTouchCancel={handlePressCancel}
                {...rest}
            >
                {isProgressVisible && (
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 z-0 w-full origin-left bg-blue-600 will-change-transform"
                        style={{ transform: `scaleX(${Math.min(Math.max(progress, 0), 1)})` }}
                    />
                )}
                <span
                    className={cn(
                        'relative z-10 grid w-full items-center font-semibold',
                        hasIcon
                            ? 'grid-cols-[1.25rem_1fr_1.25rem] gap-1'
                            : 'grid-cols-1',
                    )}
                >
                    {hasIcon ? (
                        <span className="flex h-5 w-5 items-center justify-center">
                            {icon}
                        </span>
                    ) : null}
                    <span className={cn(hasIcon ? 'text-center' : 'text-center')}>
                        {label}
                    </span>
                    {hasIcon ? <span aria-hidden="true" className="h-5 w-5" /> : null}
                </span>
            </button>
            {secondaryLabel ? (
                <span
                    className={cn(
                        'text-xs font-medium text-blue-300',
                        secondaryLabelClassName,
                    )}
                >
                    {secondaryLabel}
                </span>
            ) : null}
        </div>
    );
};
