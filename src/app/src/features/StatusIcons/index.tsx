import { useEffect, useState } from 'react';
import cx from 'classnames';

import { RemoteModeDialog } from 'app/features/RemoteMode';
import actions, {
    HeadlessSettings,
} from 'app/features/RemoteMode/apiActions.ts';
import RemoteIndicator from 'app/features/RemoteMode/components/RemoteIndicator.tsx';
import Tooltip from 'app/components/Tooltip';

import MachineInfo from 'app/features/MachineInfo';
import NotificationsArea from 'app/features/NotificationsArea';

const StatusIcons = () => {
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
    }, []);

    return (
        <div className="hidden flex-row gap-4 absolute top-4 max-xl:top-2.5 right-4 md:flex">
            <NotificationsArea />

            <MachineInfo />

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
