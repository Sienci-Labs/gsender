import { StatusIndicator } from 'app/features/SDCard/components/StatusIndicator.tsx';
import { ActionButtons } from 'app/features/SDCard/components/ActionButtons.tsx';
import { FileList } from 'app/features/SDCard/components/FileList.tsx';
import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';

const SDCardElement = () => {
    const { isMounted } = useSDCard();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        SD Card Manager
                    </h1>
                    <p className="text-gray-600">
                        Manage files on your CNC SD card
                    </p>
                </div>

                <div className="space-y-8">
                    <StatusIndicator isMounted={isMounted} />
                    <FileList />
                </div>
            </div>
        </div>
    );
};

const SDCard = () => {
    return <SDCardElement />;
};

export default SDCard;
