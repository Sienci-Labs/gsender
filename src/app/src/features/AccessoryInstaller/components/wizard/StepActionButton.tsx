import { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

type ButtonState = 'available' | 'running' | 'finished' | 'error';

interface StepActionButtonProps {
    label: string;
    runningLabel?: string;
    finishedLabel?: string;
    errorLabel?: string;
    onApply: () => Promise<void> | void;
    onComplete?: () => void;
    onUncomplete?: () => void;
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
    onComplete,
    onUncomplete,
    className = '',
    variant = 'primary',
    icon,
}: StepActionButtonProps) {
    const [state, setState] = useState<ButtonState>('available');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (state === 'finished' || state === 'error') {
            const timeout = setTimeout(() => {
                setState('available');
                setErrorMessage('');
            }, 4000);

            return () => clearTimeout(timeout);
        }
    }, [state]);

    const handleClick = async () => {
        if (state === 'running' || state === 'finished') return;

        setState('running');
        setErrorMessage('');
        onUncomplete?.();

        try {
            await onApply();
            setState('finished');
            onComplete?.();
        } catch (error) {
            setState('error');
            setErrorMessage(
                error instanceof Error ? error.message : 'An error occurred',
            );
        }
    };

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

            {state === 'error' && errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle
                        className="text-red-600 flex-shrink-0 mt-0.5"
                        size={18}
                    />
                    <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
            )}
        </div>
    );
}
