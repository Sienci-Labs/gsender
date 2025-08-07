import controller from 'app/lib/controller';
import Button from 'app/components/Button';
import { handleSDCardMount } from './utils';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

const SDCard = () => {
    const isMounted = useTypedSelector(
        (state) => state.controller.sdcard.isMounted,
    );

    const handleGetFiles = () => {
        controller.command('sdcard:list');
    };

    return (
        <div className="flex flex-col gap-2 h-full justify-center">
            <Button onClick={handleSDCardMount}>Mount SD Card</Button>

            {isMounted && <Button onClick={handleGetFiles}>Get Files</Button>}
        </div>
    );
};

export default SDCard;
