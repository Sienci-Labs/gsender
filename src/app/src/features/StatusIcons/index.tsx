import { useEffect, useState } from 'react';
import cx from 'classnames';
import { Link } from 'react-router';
import { MdPhonelinkRing } from 'react-icons/md';
import { LuGamepad2 } from 'react-icons/lu';
import { FaRegKeyboard } from 'react-icons/fa6';

import { RemoteModeDialog } from 'app/features/RemoteMode';
import actions from 'app/features/RemoteMode/apiActions.ts';

const StatusIcons = () => {
    const [gamepadConnected, setGamePadConnected] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState({});
    const [showRemoteDialog, setShowRemoteDialog] = useState(false);

    function toggleRemoteModeDialog(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        setShowRemoteDialog(!showRemoteDialog);
    }

    console.log(headlessSettings);
    useEffect(() => {
        actions.fetchSettings(setHeadlessSettings);

        const gameConnectHandler = () => {
            const gamepads = navigator.getGamepads();
            const hasGamepad = gamepads.some((gamepad) => gamepad !== null);

            setGamePadConnected(hasGamepad);
        };

        const gameDisconnectHandler = () => {
            const gamepads = navigator.getGamepads();
            const hasGamepad = gamepads.some((gamepad) => gamepad !== null);

            setGamePadConnected(hasGamepad);
        };

        window.addEventListener('gamepadconnected', gameConnectHandler);
        window.addEventListener('gamepaddisconnected', gameDisconnectHandler);

        return () => {
            window.removeEventListener('gamepadconnected', gameConnectHandler);
            window.removeEventListener(
                'gamepaddisconnected',
                gameDisconnectHandler,
            );
        };
    }, []);

    return (
        <div className="flex flex-row gap-4 absolute top-4 right-4 max-sm:hidden">
            <button
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                onClick={toggleRemoteModeDialog}
            >
                <MdPhonelinkRing
                    className={cx('w-7 h-7', {
                        'text-gray-400': !headlessSettings.headlessStatus,
                        'text-green-500': headlessSettings.headlessStatus,
                    })}
                />
            </button>
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={'/keyboard-shortcuts'}
            >
                <FaRegKeyboard className="text-green-500 w-7 h-7" />
            </Link>
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={'/gamepad'}
            >
                <LuGamepad2
                    className={cx('w-7 h-7', {
                        'text-gray-400': !gamepadConnected,
                        'text-green-500': gamepadConnected,
                    })}
                />
            </Link>
            <RemoteModeDialog
                showRemote={showRemoteDialog}
                onClose={() => setShowRemoteDialog(false)}
                setHeadlessSettings={setHeadlessSettings}
                remoteIp={headlessSettings.ip}
                remotePort={headlessSettings.port}
                remoteOn={headlessSettings.headlessStatus}
            />
        </div>
    );
};

export default StatusIcons;
