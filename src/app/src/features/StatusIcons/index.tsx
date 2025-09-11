import { useEffect, useState } from 'react';
import cx from 'classnames';
import { Link } from 'react-router';
import { LuGamepad2 } from 'react-icons/lu';
import { FaRegKeyboard } from 'react-icons/fa6';

import { RemoteModeDialog } from 'app/features/RemoteMode';
import actions, {
    HeadlessSettings,
} from 'app/features/RemoteMode/apiActions.ts';
import RemoteIndicator from 'app/features/RemoteMode/components/RemoteIndicator.tsx';
import Tooltip from 'app/components/Tooltip';

const StatusIcons = () => {
    const [gamepadConnected, setGamePadConnected] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState<HeadlessSettings>({
        ip: '',
        port: 0,
        headlessStatus: false,
    });
    const [showRemoteDialog, setShowRemoteDialog] = useState(false);

    function toggleRemoteModeDialog(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        setShowRemoteDialog(!showRemoteDialog);
    }

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
        <div className="flex flex-row gap-4 absolute top-4 max-xl:top-2.5 right-4 max-sm:hidden">
            <Tooltip content="Wireless Control">
                <button
                    className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                    onClick={toggleRemoteModeDialog}
                >
                    <RemoteIndicator
                        className={cx('w-6 h-7', {
                            'fill-gray-400': !headlessSettings.headlessStatus,
                            'fill-green-500': headlessSettings.headlessStatus,
                        })}
                    />
                </button>
            </Tooltip>
            <Tooltip content="Keyboard Shortcuts">
                <Link
                    className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                    to={'/tools/keyboard-shortcuts'}
                >
                    <FaRegKeyboard className="text-green-500 w-7 h-7" />
                </Link>
            </Tooltip>
            <Tooltip content="Gamepad Shortcuts">
                <Link
                    className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                    to={'/tools/gamepad'}
                >
                    <LuGamepad2
                        className={cx('w-7 h-7', {
                            'text-gray-400': !gamepadConnected,
                            'text-green-500': gamepadConnected,
                        })}
                    />
                </Link>
            </Tooltip>
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
