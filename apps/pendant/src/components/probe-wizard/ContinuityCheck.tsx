import { useEffect, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { AlertCircle } from 'lucide-react';
import { ContinuityIndicator, ContinuityPhase } from './ContinuityIndicator';

export const CONTINUITY_CHECK_SUCCESS_DELAY_MS = 1500;

interface ContinuityCheckProps {
    onComplete: () => void;
    onPhaseChange?: (phase: ContinuityPhase) => void;
}

export function ContinuityCheck({ onComplete, onPhaseChange }: ContinuityCheckProps) {
    const [phase, setPhase] = useState<ContinuityPhase>('checking-idle');

    const probePinOn = useTypedSelector(
        (state: RootState) => state.controller.state.status?.pinState.P ?? false,
    );

    // Detect an idle/stuck-on pin immediately, without waiting for a timeout.
    useEffect(() => {
        if (phase !== 'checking-idle') return;
        setPhase(probePinOn ? 'stuck-on' : 'waiting');
    }, [phase, probePinOn]);

    // Detect a successful press while waiting. No timeout — wait indefinitely
    // for continuity.
    useEffect(() => {
        if (phase !== 'waiting') return;
        if (probePinOn) {
            setPhase('success');
        }
    }, [phase, probePinOn]);

    useEffect(() => {
        onPhaseChange?.(phase);
    }, [phase, onPhaseChange]);

    // On success, delay onComplete so the user has time to see the success
    // banner before the wizard advances.
    useEffect(() => {
        if (phase !== 'success') return;
        const completeTimeout = setTimeout(() => {
            onComplete();
        }, CONTINUITY_CHECK_SUCCESS_DELAY_MS);
        return () => clearTimeout(completeTimeout);
    }, [phase, onComplete]);

    const handleRetry = () => {
        setPhase('checking-idle');
    };

    const isWaiting = phase === 'waiting';
    const isError = phase === 'stuck-on';

    return (
        <div className="flex flex-col gap-5 justify-start">
            <div className="flex flex-col items-center justify-center gap-6 py-8">
                <ContinuityIndicator phase={phase} size={220} />

                {isWaiting && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                        Touch the probe to the workpiece to verify the connection.
                    </p>
                )}

                {isError && (
                    <div className="flex flex-col items-center gap-4 max-w-md">
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="rounded-xl border border-red-500/45 bg-red-500/15 shadow-sm backdrop-blur-sm"
                        >
                            <div className="flex items-start gap-3 p-4">
                                <div className="mt-0.5 rounded-full bg-red-500/25 p-1.5">
                                    <AlertCircle
                                        size={20}
                                        className="text-red-800 dark:text-red-100"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-red-800/80 dark:text-red-100/80">
                                        Error
                                    </p>
                                    <p className="text-base font-semibold text-red-900 dark:text-red-100">
                                        Sensor triggered immediately. Check
                                        your wiring or probe for a short and
                                        confirm $6 (Invert Probe Pin) is set
                                        correctly.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-900 hover:bg-gray-300"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
