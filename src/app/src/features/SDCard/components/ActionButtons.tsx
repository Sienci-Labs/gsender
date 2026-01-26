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

    const disabled = !isConnected;
    const uploadDisabled = !isMounted || !isConnected;
    return (
        <>
            <div className="flex flex-wrap gap-3">
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
                    disabled={uploadDisabled}
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
