import { useState } from 'react';
import { LuBell } from 'react-icons/lu';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { NotificationDisplay } from 'app/features/NotificationsArea/NotificationDisplay';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { GENERAL_CATEGORY } from 'app/constants';

const NotificationsArea = () => {
    const [open, setOpen] = useState(false);
    const notifications = useTypedSelector((state) =>
        state.preferences.notifications?.filter(
            (notification) => notification.type === 'error',
        ),
    );

    const shuttleControlEvents = {
        DISPLAY_NOTIFICATIONS: {
            title: 'Toggle Notifications Display',
            keys: '',
            cmd: 'DISPLAY_NOTIFICATIONS',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: () => setOpen((prev) => !prev),
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="relative max-sm:hidden">
                    <LuBell className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
                    {notifications && notifications.length > 0 && (
                        <div className="absolute -top-2 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 min-h-4 flex items-center justify-center">
                            {notifications.length}
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 bg-white" align="start">
                <NotificationDisplay />
            </PopoverContent>
        </Popover>
    );
};

export default NotificationsArea;
