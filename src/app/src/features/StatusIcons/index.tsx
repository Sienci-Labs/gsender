import { useEffect, useState } from 'react';
import cx from 'classnames';
import { Link } from 'react-router';
import { MdPhonelinkRing } from 'react-icons/md';
import { LuGamepad2 } from 'react-icons/lu';
import { FaRegKeyboard } from 'react-icons/fa6';

import gamepad from 'app/lib/gamepad';

import actions from '../RemoteMode/apiActions';
import { RemoteModeDialog } from 'app/features/RemoteMode';

const StatusIcons = () => {
    const [gamepadConnected, setGamePadConnected] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState({});
    const [showRemoteDialog, setShowRemoteDialog] = useState(false);

    function toggleRemoteModeDialog(e) {
        e.preventDefault();
        setShowRemoteDialog(!showRemoteDialog);
    }

    useEffect(() => {
        //actions.fetchSettings(setHeadlessSettings);

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

        // gamepad.on('gamepad:connected', () => {
        //     console.log('hi');
        //     setGamePadConnected(true);
        // });
        // gamepad.on('gamepad:disconnected', setGamePadConnected(false));

        // return () => {
        //     gamepad.removeEventListener(
        //         'gamepad:connected',
        //         setGamePadConnected(true),
        //     );
        //     gamepad.removeEventListener(
        //         'gamepad:disconnected',
        //         setGamePadConnected(false),
        //     );
        // };
    }, []);

    return (
        <div className="flex flex-row gap-4 absolute top-4 right-4">
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
                to={'/configuration'}
            >
                <FaRegKeyboard className="text-green-500 w-7 h-7" />
            </Link>
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={'/configuration'}
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
            />
        </div>
    );
};

export default StatusIcons;
