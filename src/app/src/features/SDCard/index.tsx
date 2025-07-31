import controller from 'app/lib/controller';
import Button from 'app/components/Button';
import { handleSDCardMount } from './utils';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import FileExplorer from './FileExplorer';
import YModemTransfer from './components/YModemTransfer';

const SDCard = () => {
    const isMounted = useTypedSelector(
        (state) => state.controller.sdcard.isMounted,
    );

    const handleGetFiles = () => {
        controller.command('sdcard:list:files');
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col gap-2">
                <Button onClick={handleSDCardMount}>Mount SD Card</Button>
                {isMounted && (
                    <Button onClick={handleGetFiles}>Get Files</Button>
                )}
            </div>

            {/* {isMounted && <Button onClick={handleGetFiles}>Get Files</Button>} */}
            <Button onClick={handleGetFiles}>Get Files</Button>

            <div className="flex-1">
                <FileExplorer />
            </div>
            {/* YMODEM Transfer Section */}
            <YModemTransfer
                onComplete={() => {
                    // Refresh file list after successful transfer
                    if (isMounted) {
                        handleGetFiles();
                    }
                }}
            />
        </div>
    );
};

export default SDCard;
