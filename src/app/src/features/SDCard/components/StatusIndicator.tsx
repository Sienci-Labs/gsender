import { CheckCircle, HardDrive, XCircle } from 'lucide-react';
import { ActionButtons } from 'app/features/SDCard/components/ActionButtons.tsx';
import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';
import { UploadProgressBar } from 'app/features/SDCard/components/UploadProgressBar.tsx';

export function StatusIndicator({ isMounted }) {
    const { uploadState, uploadProgress } = useSDCard();
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
                        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                            isMounted
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                    >
                        {isMounted ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        <span>{isMounted ? 'Mounted' : 'Unmounted'}</span>
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
