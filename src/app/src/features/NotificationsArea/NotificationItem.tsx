import type { Notification } from 'app/workspace/definitions';
import { formatDistanceToNow } from 'date-fns';

const colorsMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
    const notificationColor = colorsMap[notification.type];
    const timestamp =
        typeof notification.timestamp === 'string'
            ? new Date(notification.timestamp)
            : notification.timestamp;
    const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

    return (
        <div className="flex border bg-gray-200 w-full dark:bg-surface-raised dark:text-content-primary dark:border-outline">
            <div className={`min-h-full min-w-4 ${notificationColor}`} />
            <div className="py-2 px-4 flex flex-col w-full">
                <div className="flex flex-col">
                    <div>{notification.message}</div>
                    <div className="text-xs text-gray-500 dark:text-content-muted mt-1">
                        {timeAgo}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { NotificationItem };
