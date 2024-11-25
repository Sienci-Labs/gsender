import { LuBell } from 'react-icons/lu';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

import TabList from './TabList';
import Header from './Header';

const NotificationsArea = () => {
    const { notifications } = useWorkspaceState();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="relative">
                    <LuBell className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
                    {notifications && notifications.length > 0 && (
                        <div className="absolute -top-2 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 min-h-4 flex items-center justify-center">
                            {notifications.length}
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 bg-white" align="start">
                <Header />
                <TabList />
            </PopoverContent>
        </Popover>
    );
};

export default NotificationsArea;
