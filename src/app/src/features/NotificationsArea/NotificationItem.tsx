import { Notification } from 'app/workspace/definitions';

const colorsMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
    const notificationColor = colorsMap[notification.type];

    return (
        <div className="flex border bg-gray-200 w-full dark:bg-dark-lighter dark:text-white dark:border-dark-lighter">
            <div className={`min-h-full min-w-4 ${notificationColor}`} />
            <div className="py-2 px-4 flex items-center">
                {notification.message}
            </div>
        </div>
    );
};

export { NotificationItem };
