import { CheckCircle2 } from 'lucide-react';
import cn from 'classnames';
import { UploadState } from '../hooks/useSDCard';
import { useEffect, useState } from 'react';

interface UploadProgressBarProps {
    uploadState: UploadState;
    uploadProgress: number;
    className?: string;
}

export function UploadProgressBar({
    uploadState,
    uploadProgress,
    className,
}: UploadProgressBarProps) {
    const [showComplete, setShowComplete] = useState(false);

    useEffect(() => {
        if (uploadState === 'complete') {
            setShowComplete(true);
            const timer = setTimeout(() => {
                setShowComplete(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [uploadState]);

    // Don't render anything for idle state
    if (uploadState === 'idle') {
        return null;
    }

    return (
        <div className={cn('w-full max-w-md mx-auto', className)}>
            {uploadState === 'uploading' && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm text-slate-600">
                        <span className="font-medium">Uploading...</span>
                        <span className="tabular-nums">
                            {Math.round(uploadProgress)}%
                        </span>
                    </div>

                    <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Complete state with fade animation */}
            {showComplete && (
                <div className="flex items-center justify-center space-x-2 text-green-600 animate-in fade-in-0 duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Upload complete!</span>
                </div>
            )}
        </div>
    );
}
