import { useEffect, useState } from 'react';
import controller from 'app/lib/controller.ts';
import _throttle from 'lodash/throttle';

export function FlashingProgress() {
    const [curValue, setCurValue] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [notifications, setNotifications] = useState<string[]>([]);
    useEffect(() => {
        controller.addListener('flash:progress', (value, total) => {
            setCurValue(value);
            if (totalSize !== total) {
                setTotalSize(total);
            }
        });

        controller.addListener('flash:message', (msg) => {
            let data = `${msg.type}: ${msg.content}`;
            setNotifications([data, ...notifications]);
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
            controller.removeListener('task:error');
        };
    }, []);
    return (
        <>
            <p>i'm a progress bar</p>
            <textarea
                cols={70}
                rows={6}
                readOnly={true}
                className="outline-none focus:outline-none resize-none border"
            />
        </>
    );
}
