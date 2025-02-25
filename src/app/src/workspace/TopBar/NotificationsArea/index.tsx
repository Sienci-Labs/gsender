import { LuBell } from 'react-icons/lu';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

import TabList from './TabList';
import Header from './Header';
import { NotificationDisplay } from 'app/workspace/TopBar/NotificationsArea/NotificationDisplay.tsx';

const NotificationsArea = () => {
    const notifications = useTypedSelector(
        (state) => state.preferences.notifications,
    );

    return (
        <Popover>
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
