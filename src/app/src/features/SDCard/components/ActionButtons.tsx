import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';
import { useState } from 'react';
import { UploadModal } from 'app/features/SDCard/components/UploadModal.tsx';
import { HardDrive, RefreshCw, Upload } from 'lucide-react';
import {
    mountSDCard,
    refreshSDCardFiles,
} from 'app/features/SDCard/utils/utils.ts';
import Button from 'app/components/Button';

export function ActionButtons() {
    const { isMounted, isConnected, isLoading, setIsLoading } = useSDCard();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const disabled = !isConnected || !isMounted;

    return (
        <>
            <div className="flex flex-wrap gap-3">
                {!isMounted && (
                    <button
                        onClick={() => mountSDCard()}
                        disabled={!isConnected}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <HardDrive className="w-4 h-4" />
                        <span>Mount</span>
                    </button>
                )}

                {isMounted && (
                    <Button
                        onClick={() => mountSDCard()}
                        disabled={!isConnected}
                        className="flex flex-row items-center gap-2"
                    >
                        <HardDrive className="w-4 h-4" />
                        <span>Re-mount</span>
                    </Button>
                )}

                <Button
                    onClick={refreshSDCardFiles}
                    disabled={disabled}
                    className="flex flex-row items-center gap-2"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh Files</span>
                </Button>

                <Button
                    onClick={() => setUploadModalOpen(true)}
                    disabled={disabled}
                    className="flex flex-row items-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                </Button>
            </div>

            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
            />
        </>
    );
}
