import { useEffect, useState } from 'react';
import actions from '../RemoteMode/apiActions';
import gamepad from 'app/lib/gamepad';
import cx from 'classnames';
import { Link } from '@tanstack/react-router';
import { MdPhonelinkRing } from 'react-icons/md';
import { LuGamepad2 } from 'react-icons/lu';
import { FaRegKeyboard } from 'react-icons/fa6';

const StatusIcons = () => {
    const [gamepadConnected, setGamePadConnected] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState({});

    useEffect(() => {
        actions.fetchSettings(setHeadlessSettings);
        gamepad.on('gamepad:connected', setGamePadConnected(true));
        gamepad.on('gamepad:disconnected', setGamePadConnected(false));

        return () => {
            gamepad.removeEventListener(
                'gamepad:connected',
                setGamePadConnected(true),
            );
            gamepad.removeEventListener(
                'gamepad:disconnected',
                setGamePadConnected(false),
            );
        };
    }, []);

    return (
        <div className="flex flex-row float: right">
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={'/configuration'}
            >
                <MdPhonelinkRing
                    className={cx({
                        'bg-black': !headlessSettings.headlessStatus,
                        'bg-green-500': headlessSettings.headlessStatus,
                    })}
                />
            </Link>
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={'/configuration'}
            >
                <FaRegKeyboard
                    className={cx({
                        // 'bg-black': !,
                        'bg-green-500': true,
                    })}
                />
            </Link>
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={'/configuration'}
            >
                <LuGamepad2
                    className={cx({
                        'bg-black': !gamepadConnected,
                        'bg-green-500': gamepadConnected,
                    })}
                />
            </Link>
        </div>
    );
};

export default StatusIcons;
