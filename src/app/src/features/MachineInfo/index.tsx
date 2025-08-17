import { useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import useKeybinding from 'app/lib/useKeybinding.ts';
import useShuttleEvents from 'app/hooks/useShuttleEvents.ts';
import { TOOLBAR_CATEGORY } from 'app/constants';

import { MachineInfoDisplay } from './MachineInfoDisplay.tsx';

import icon from './assets/icon.svg';

const MachineInfo = () => {
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

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <Popover open={open || pinned} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button className="z-50 w-[24px] max-sm:hidden">
                    <img src={icon} className="w-[24px]" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="max-sm:block mt-4 -ml-4 p-4 pt-2 absolute z-10 flex flex-col justify-center w-[400px] min-h-[300px] rounded-md [box-shadow:_0px_0px_2px_1px_var(--tw-shadow-color)] shadow-gray-400 dark:border-dark-lighter"
                align="start"
            >
                <MachineInfoDisplay pinned={pinned} setPinned={setPinned} />
            </PopoverContent>
        </Popover>
    );
};

export default MachineInfo;
