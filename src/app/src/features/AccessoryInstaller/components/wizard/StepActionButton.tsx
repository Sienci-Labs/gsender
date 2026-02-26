import { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle, CheckCircle } from 'lucide-react';

type ButtonState = 'available' | 'running' | 'finished' | 'error';

interface StepActionButtonProps {
    label: string;
    runningLabel?: string;
    finishedLabel?: string;
    errorLabel?: string;
    onApply: () => void;
    isComplete?: boolean;
    disabled?: boolean;
    error?: string | null;
    success?: string | null;
    className?: string;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
}

export function StepActionButton({
    label,
    runningLabel,
    finishedLabel = 'Complete',
    errorLabel = 'Error',
    onApply,
    isComplete = false,
    error = null,
    success = null,
    className = '',
    variant = 'primary',
    icon,
    disabled = false,
}: StepActionButtonProps) {
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (isComplete || error) {
            setIsRunning(false);
        }
    }, [isComplete, error]);

    const handleClick = () => {
        setIsRunning(true);
        onApply();
    };

    const state: ButtonState = error
        ? 'error'
        : isComplete
          ? 'finished'
          : isRunning
            ? 'running'
            : 'available';

    const getButtonStyles = () => {
        const baseStyles =
            'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors min-w-[180px] disabled:bg-gray-500 disabled:text-gray-600';

        if (variant === 'secondary') {
            switch (state) {
                case 'available':
                    return `${baseStyles} bg-gray-200 text-gray-900 hover:bg-gray-300`;
                case 'running':
                    return `${baseStyles} bg-gray-300 text-gray-600 cursor-not-allowed`;
                case 'finished':
                    return `${baseStyles} bg-green-500 text-white cursor-default`;
                case 'error':
                    return `${baseStyles} bg-red-500 text-white hover:bg-red-600`;
            }
        }

        switch (state) {
            case 'available':
                return `${baseStyles} bg-blue-500 text-white hover:bg-blue-600`;
            case 'running':
                return `${baseStyles} bg-blue-400 text-white cursor-not-allowed`;
            case 'finished':
                return `${baseStyles} bg-green-500 text-white cursor-default`;
            case 'error':
                return `${baseStyles} bg-red-500 text-white hover:bg-red-600`;
        }
    };

    const getButtonContent = () => {
        switch (state) {
            case 'available':
                return (
                    <>
                        {icon}
                        {label}
                    </>
                );
            case 'running':
                return (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        {runningLabel || `${label}...`}
                    </>
                );
            case 'finished':
                return (
                    <>
                        <Check size={20} />
                        {finishedLabel}
                    </>
                );
            case 'error':
                return (
                    <>
                        <AlertCircle size={20} />
                        {errorLabel}
                    </>
                );
        }
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleClick}
                className={`${getButtonStyles()} ${className}`}
                disabled={disabled}
            >
                {getButtonContent()}
            </button>

            {state === 'error' && error && (
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
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!error && success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-green-500/45 bg-green-500/15 shadow-sm backdrop-blur-sm"
                >
                    <div className="flex items-start gap-3 p-4">
                        <div className="mt-0.5 rounded-full bg-green-500/25 p-1.5">
                            <CheckCircle
                                size={20}
                                className="text-green-800 dark:text-green-100"
                            />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-green-800/80 dark:text-green-100/80">
                                Success
                            </p>
                            <p className="text-base font-semibold text-green-900 dark:text-green-100">
                                {success}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
