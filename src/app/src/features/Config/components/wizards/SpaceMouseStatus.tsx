import { useEffect, useState } from 'react';
import { FaCube } from 'react-icons/fa';

import spaceMouse from 'app/lib/spacemouse';
import { toast } from 'app/lib/toaster';

export function SpaceMouseStatus() {
    const [connected, setConnected] = useState(spaceMouse.isConnected);
    const [name, setName] = useState(spaceMouse.deviceName);

    useEffect(() => {
        spaceMouse.init();
        const onConnection = () => {
            setConnected(spaceMouse.isConnected);
            setName(spaceMouse.deviceName);
        };
        spaceMouse.on('connection', onConnection);
        onConnection();
        return () => {
            spaceMouse.removeListener('connection', onConnection);
        };
    }, []);

    if (!spaceMouse.isSupported) {
        return (
            <span className="text-sm text-gray-500">
                Not supported in this browser (WebHID required).
            </span>
        );
    }

    const handleConnect = async () => {
        try {
            const ok = await spaceMouse.requestDevice();
            if (!ok) {
                toast.error('No compatible 6DOF device found.');
            }
        } catch (err) {
            // User dismissed the browser's device picker
            console.warn('SpaceMouse: connection cancelled', err);
        }
    };

    return (
        <div className="flex flex-row items-center gap-2">
            <span
                className={
                    connected
                        ? 'h-3 w-3 rounded-full bg-green-500'
                        : 'h-3 w-3 rounded-full bg-gray-400'
                }
            />
            <span className="text-sm dark:text-white">
                {connected ? name || 'Connected' : 'Not connected'}
            </span>
            {!connected && (
                <button
                    type="button"
                    onClick={handleConnect}
                    className="bg-white shadow p-2 rounded border border-blue-500 flex flex-row gap-2 items-center text-sm text-gray-700 hover:bg-gray-100 dark:bg-dark dark:text-white dark:hover:bg-dark-lighter"
                >
                    <FaCube className="text-lg" />
                    Connect
                </button>
            )}
        </div>
    );
}
