import { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

type ButtonState = 'available' | 'running' | 'finished' | 'error';

interface StepActionButtonProps {
    label: string;
    runningLabel?: string;
    finishedLabel?: string;
    errorLabel?: string;
    onApply: () => void;
    isComplete?: boolean;
    error?: string | null;
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
    className = '',
    variant = 'primary',
    icon,
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
            'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors min-w-[180px]';

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
                disabled={state === 'running' || state === 'finished'}
                className={`${getButtonStyles()} ${className}`}
            >
                {getButtonContent()}
            </button>

            {state === 'error' && error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle
                        className="text-red-600 flex-shrink-0 mt-0.5"
                        size={18}
                    />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
}
