import { StatusIndicator } from 'app/features/SDCard/components/StatusIndicator.tsx';
import { FileList } from 'app/features/SDCard/components/FileList.tsx';
import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';

const SDCardElement = () => {
    const { isMounted } = useSDCard();

    return (
        <div className="bg-gray-50 h-full">
            <div className="max-w-6xl mx-auto px-4 py-8">
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
