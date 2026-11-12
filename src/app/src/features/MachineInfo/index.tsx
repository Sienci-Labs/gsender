import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import Tooltip from 'app/components/Tooltip';
import { TOOLBAR_CATEGORY } from 'app/constants';
import useShuttleEvents from 'app/hooks/useShuttleEvents.ts';
import { useAppTranslation } from 'app/i18n';
import useKeybinding from 'app/lib/useKeybinding.ts';
import { useEffect, useState } from 'react';
import minfo from './assets/minfo.svg';
import { MachineInfoDisplay } from './MachineInfoDisplay.tsx';

const MachineInfo = () => {
    const { t } = useAppTranslation();
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        if (!pinned) {
            setOpen(isOpen);
        }
    };

    const shuttleControlEvents = {
        DISPLAY_MACHINE_INFO: {
            title: 'Display Machine Info',
            keys: '',
            cmd: 'DISPLAY_MACHINE_INFO',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => setOpen((prev) => !prev),
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useEffect(() => {
        useKeybinding(shuttleControlEvents);
    }, []);

    return (
        <Popover open={open || pinned} onOpenChange={handleOpenChange}>
            <Tooltip content={t('workspace:machineInfo.title')}>
                <PopoverTrigger asChild>
                    <button
                        className="z-50 w-[24px] max-sm:hidden"
                        aria-label={t('workspace:machineInfo.title')}
                    >
                        <img src={minfo} className="w-[24px]" />
                    </button>
                </PopoverTrigger>
            </Tooltip>
            <PopoverContent
                className="max-sm:block mt-4 p-4 pt-2 z-[10000] flex flex-col justify-center w-[400px] max-w-[calc(100vw-2rem)] min-h-[300px] rounded-md [box-shadow:_0px_0px_2px_1px_var(--tw-shadow-color)] shadow-gray-400 dark:border-outline"
                align="end"
                sideOffset={8}
                collisionPadding={16}
            >
                <MachineInfoDisplay
                    pinned={pinned}
                    setPinned={setPinned}
                    onClose={() => setOpen(false)}
                />
            </PopoverContent>
        </Popover>
    );
};

export default MachineInfo;
