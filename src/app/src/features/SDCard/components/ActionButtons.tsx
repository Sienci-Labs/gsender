import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';
import { useState } from 'react';
import { UploadModal } from 'app/features/SDCard/components/UploadModal.tsx';
import { HardDrive, RefreshCw, Upload } from 'lucide-react';
import {
    mountSDCard,
    refreshSDCardFiles,
} from 'app/features/SDCard/utils/utils.ts';

export function ActionButtons() {
    const { isMounted, isLoading, setIsLoading } = useSDCard();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    return (
        <>
            <div className="flex flex-wrap gap-3">
                {!isMounted && (
                    <button
                        onClick={() => mountSDCard()}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <HardDrive className="w-4 h-4" />
                        <span>Mount</span>
                    </button>
                )}

                {isMounted && (
                    <button
                        onClick={() => mountSDCard()}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <HardDrive className="w-4 h-4" />
                        <span>Re-mount</span>
                    </button>
                )}

                <button
                    onClick={refreshSDCardFiles}
                    disabled={false}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh Files</span>
                </button>

                <button
                    onClick={() => setUploadModalOpen(true)}
                    disabled={false}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                </button>
            </div>

            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
            />
        </>
    );
}
