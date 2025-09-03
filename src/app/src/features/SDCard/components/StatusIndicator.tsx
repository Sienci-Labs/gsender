import { CheckCircle, HardDrive, XCircle } from 'lucide-react';
import { ActionButtons } from 'app/features/SDCard/components/ActionButtons.tsx';
import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';
import { UploadProgressBar } from 'app/features/SDCard/components/UploadProgressBar.tsx';
import cn from 'classnames';

export function StatusIndicator({ isMounted }) {
    const { isConnected, uploadState, uploadProgress } = useSDCard();
    let status: string;
    let colourClasses: string;

    if (!isConnected) {
        status = 'Disconnected';
        colourClasses = 'bg-gray-50 text-gray-700 border-gray-200';
    } else if (isMounted) {
        status = 'Mounted';
        colourClasses = 'bg-green-50 text-green-700 border-green-200';
    } else {
        status = 'Unmounted';
        colourClasses = 'bg-red-50 text-red-700 border-red-200';
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <HardDrive className="w-6 h-6 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                            SD Card Status:
                        </span>
                    </div>
                    <div
                        className={cn(
                            `inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border-2`,
                            colourClasses,
                        )}
                    >
                        {isConnected && isMounted ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        <span>{status}</span>
                    </div>
                </div>
            </div>
            <div className="bg-white flex items-center justify-center px-6 py-4 rounded-lg shadow-sm border border-gray-200">
                {uploadState === 'idle' && <ActionButtons />}
                <UploadProgressBar
                    uploadState={uploadState}
                    uploadProgress={uploadProgress}
                />
            </div>
        </div>
    );
}
