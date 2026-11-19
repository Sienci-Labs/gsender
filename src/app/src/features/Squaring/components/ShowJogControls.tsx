import Button from 'app/components/Button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { Jogging } from 'app/features/Jogging';
import { useAppTranslation } from 'app/i18n';

const ShowJogControls = () => {
    const { t } = useAppTranslation();
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    {t('tools:squaring.showJogControls')}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 bg-white">
                <div className="w-full">
                    <Jogging />
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ShowJogControls;
