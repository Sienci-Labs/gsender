import { useEffect, useMemo, useState } from 'react';
import controller from 'app/lib/controller.ts';
import _throttle from 'lodash/throttle';
import cn from 'classnames';
import { ProgressBar } from 'app/components/ProgressBar';

interface FlashMessage {
    content: string;
    type: 'Info' | 'Error' | 'Success' | 'Warning';
    timestamp: string;
}

export function FlashingProgress({ type }: { type: string }) {
    const [curValue, setCurValue] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [notifications, setNotifications] = useState<FlashMessage[]>([]);

    const notificationText = useMemo(() => {
        return notifications
            .map(
                (message) =>
                    `[${message.timestamp}] ${message.type}: ${message.content}`,
            )
            .join('\n');
    }, [notifications]);

    function addNotification(message: FlashMessage) {
        setNotifications((prev) => [message, ...prev]);
    }

    function getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    useEffect(() => {
        controller.addListener('flash:progress', (value, total) => {
            setCurValue(value);
            setTotalSize((prev) => (prev !== total ? total : prev));
        });

        controller.addListener('flash:message', (msg) => {
            const type =
                msg.type === 'Error' ||
                msg.type === 'Info' ||
                msg.type === 'Success' ||
                msg.type === 'Warning'
                    ? msg.type
                    : 'Info';
            addNotification({
                type,
                content: msg.content,
                timestamp: getTimestamp(),
            });
        });

        controller.addListener('flash:end', () => {
            addNotification({
                type: 'Success',
                content: 'Flash completed, please reconnect to your device.',
                timestamp: getTimestamp(),
            });
        });

        controller.addListener(
            'task:error',
            _throttle(
                (data) => {
                    addNotification({
                        type: 'Error',
                        content: data,
                        timestamp: getTimestamp(),
                    });
                },
                250,
                { trailing: false },
            ),
        );

        return () => {
            controller.removeListener('flash:progress');
            controller.removeListener('flash:message');
            controller.removeListener('task:error');
            controller.removeListener('flash:end');
        };
    }, []);
    return (
        <>
            <ProgressBar
                sent={curValue}
                total={totalSize}
                className={cn({ hidden: type === 'grbl' })}
            />
            <div className="border rounded bg-white text-sm">
                <div className="px-3 py-2 border-b text-gray-600">
                    Flash log
                </div>
                <div className="px-3 py-2 h-40 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-gray-500">Waiting for logs...</div>
                    ) : (
                        notifications.map((message, index) => {
                            const typeClass = {
                                Info: 'text-sky-700',
                                Success: 'text-emerald-700',
                                Warning: 'text-amber-700',
                                Error: 'text-red-700',
                            }[message.type];
                            return (
                                <div key={`${message.timestamp}-${index}`}>
                                    <span className="text-gray-500">
                                        [{message.timestamp}]
                                    </span>{' '}
                                    <span className={typeClass}>
                                        {message.type}:
                                    </span>{' '}
                                    <span className="text-gray-800">
                                        {message.content}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <textarea
                aria-hidden="true"
                className="sr-only"
                readOnly={true}
                value={notificationText}
            />
        </>
    );
}
