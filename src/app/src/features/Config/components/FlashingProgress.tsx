import { useEffect, useState } from 'react';
import controller from 'app/lib/controller.ts';
import _throttle from 'lodash/throttle';
import cn from 'classnames';
import { ProgressBar } from 'app/components/ProgressBar';

export function FlashingProgress({ type }: { type: string }) {
    const [curValue, setCurValue] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [notifications, setNotifications] = useState<string[]>([]);

    function getNotifications() {
        return notifications.join('\n');
    }

    function addNotification(msg) {
        setNotifications([msg, ...notifications]);
    }

    useEffect(() => {
        controller.addListener('flash:progress', (value, total) => {
            setCurValue(value);
            if (totalSize !== total) {
                setTotalSize(total);
            }
        });

        controller.addListener('flash:message', (msg) => {
            let data = `${msg.type}: ${msg.content}`;
            addNotification(data);
        });

        controller.addListener('flash:end', () => {
            setNotifications([
                'Flash Completed, please reconnect to your device.',
                ...notifications,
            ]);
        });

        controller.addListener(
            'task:error',
            _throttle(
                (data) => {
                    setNotifications((prev) => [data, ...prev]);
                },
                250,
                { trailing: false },
            ),
        );

        return () => {
            controller.removeListener('flash:progress');
            controller.removeListener('flash:message');
            controller.removeListener('task:error');
        };
    }, [notifications]);
    return (
        <>
            <ProgressBar
                sent={curValue}
                total={totalSize}
                className={cn({ hidden: type === 'grbl' })}
            />
            <textarea
                cols={70}
                rows={6}
                readOnly={true}
                className="outline-none focus:outline-none resize-none border"
                value={getNotifications()}
            />
        </>
    );
}
