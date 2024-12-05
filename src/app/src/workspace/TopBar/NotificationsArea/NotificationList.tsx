import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

import { NotificationItem } from './NotificationItem';
import { Notification } from 'app/workspace/definitions';

type Props = {
    value: 'all' | Notification['type'];
};

const NotificationList = ({ value }: Props) => {
    const { notifications = [] } = useWorkspaceState();

    const filteredNotifications =
        value === 'all'
            ? notifications
            : notifications?.filter(
                  (notification) => notification.type === value,
              );

    if (filteredNotifications.length === 0) {
        return (
            <div className="min-h-[200px] flex items-center justify-center">
                No notifications
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 pr-1 items-center text-sm text-black max-h-[200px] min-h-[200px] overflow-y-auto">
            {filteredNotifications.toReversed().map((tab) => (
                <NotificationItem key={tab.id} notification={tab} />
            ))}
        </div>
    );
};

export default NotificationList;
