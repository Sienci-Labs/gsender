import { useState, useCallback, useEffect } from 'react';

import { eventToShortcut, isModifierKey } from './utils/keyboardUtils';

const IGNORED_KEYS = [
    'Tab',
    'CapsLock',
    'NumLock',
    'ScrollLock',
    'Insert',
    'Pause',
];

interface KeyboardCaptureHook {
    capturedKeys: string;
    isCapturing: boolean;
    startCapturing: () => void;
    stopCapturing: () => void;
    resetCapture: () => void;
}

export const useKeyboardCapture = (): KeyboardCaptureHook => {
    const [capturedKeys, setCapturedKeys] = useState<string>('');
    const [isCapturing, setIsCapturing] = useState(false);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isCapturing) return;

            e.preventDefault();
            e.stopPropagation();

            if (IGNORED_KEYS.includes(e.key)) {
                return;
            }

            // If it's just a modifier key, don't update the captured keys yet
            if (isModifierKey(e.key)) {
                return;
            }

            const shortcut = eventToShortcut(e);
            setCapturedKeys(shortcut);
            setIsCapturing(false);
        },
        [isCapturing],
    );

    const startCapturing = useCallback(() => {
        setIsCapturing(true);
        setCapturedKeys('');
    }, []);

    const stopCapturing = useCallback(() => {
        setIsCapturing(false);
    }, []);

    const resetCapture = useCallback(() => {
        setCapturedKeys('');
    }, []);

    useEffect(() => {
        if (isCapturing) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCapturing, handleKeyDown]);

    return {
        capturedKeys,
        isCapturing,
        startCapturing,
        stopCapturing,
        resetCapture,
    };
};
