import { useEffect, useState } from 'react';

/**
 * Keeps an "opened" surface (popover/dialog) inert for a short window after
 * it opens, so a synthetic click/touch from the same gesture that opened it
 * can't immediately land on a newly-mounted control at the same coordinates.
 */
export function useOpenInteractionGuard(
    isOpen: boolean,
    delayMs = 300,
): boolean {
    const [isInteractive, setIsInteractive] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsInteractive(false);
            return;
        }
        setIsInteractive(false);
        const timer = setTimeout(() => setIsInteractive(true), delayMs);
        return () => clearTimeout(timer);
    }, [isOpen, delayMs]);

    return isInteractive;
}
