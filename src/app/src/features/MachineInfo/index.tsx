import { useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import useKeybinding from 'app/lib/useKeybinding.ts';
import useShuttleEvents from 'app/hooks/useShuttleEvents.ts';
import { GENERAL_CATEGORY } from 'app/constants';

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
            title: 'Toggle Machine Info Disply',
            keys: '',
            cmd: 'DISPLAY_MACHINE_INFO',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
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
            <PopoverContent className="p-0 w-auto" align="start">
                <MachineInfoDisplay
                    open={open}
                    pinned={pinned}
                    onClose={() => setOpen(false)}
                    setPinned={setPinned}
                />
            </PopoverContent>
        </Popover>
    );
};

export default MachineInfo;
