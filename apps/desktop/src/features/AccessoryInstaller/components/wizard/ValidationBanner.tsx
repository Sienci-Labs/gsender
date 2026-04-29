import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { ValidationResult } from '../../types/wizard';

interface ValidationBannerProps {
    validations?: (() => ValidationResult)[];
}

export function ValidationBanner({ validations }: ValidationBannerProps) {
    const [validationError, setValidationError] = useState<ReactNode | null>(null);

    useEffect(() => {
        if (validations && validations.length > 0) {
            for (const validation of validations) {
                const result = validation();
                if (!result.success) {
                    setValidationError(result.reason || 'Validation failed');
                    return;
                }
            }
            setValidationError(null);
        }
    }, [validations]);

    if (!validationError) {
        return <div className="mt-4 max-w-3/5 h-14"></div>;
    }

    return (
        <div className="mt-4 max-w-3/5">
            <div className="rounded-lg border-2 border-red-500 bg-red-50/70 p-4 flex items-start gap-3 dark:border-red-500/70 dark:bg-red-950/60">
                <AlertCircle
                    className="text-red-600 dark:text-red-300 flex-shrink-0 mt-0.5"
                    size={24}
                />
                <div className="flex-1">
                    <p className="text-red-700 dark:text-red-100">
                        {validationError}
                    </p>
                </div>
            </div>
        </div>
    );
}
