import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ValidationResult } from '../../types/wizard';

interface ValidationBannerProps {
    validations?: (() => ValidationResult)[];
}

export function ValidationBanner({ validations }: ValidationBannerProps) {
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (validations && validations.length > 0) {
            for (const validation of validations) {
                const result = validation();
                console.log('result:', result);
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
            <div className="bg-red-50/50 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle
                    className="text-red-500 flex-shrink-0 mt-0.5"
                    size={24}
                />
                <div className="flex-1">
                    <p className="text-red-500">{validationError}</p>
                </div>
            </div>
        </div>
    );
}
