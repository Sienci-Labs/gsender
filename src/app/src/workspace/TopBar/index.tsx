import MachineStatus from 'app/features/MachineStatus/MachineStatus';
import Connection from 'app/features/Connection';
import SpindleLaserStatus from 'app/components/SpindleLaserStatus';

import gSenderIcon from './assets/icon-round.png';
import MachineInfo from 'app/features/MachineInfo';
import StatusIcons from 'app/features/StatusIcons';
import NotificationsArea from './NotificationsArea';
import { RemoteMenuFlyout } from 'app/features/RemoteMode/components/RemoteMenuFlyout.tsx';

export const TopBar = () => {
    return (
        <div className="border p-3 h-16 box-border flex gap-4 sm:gap-2 items-center bg-gray-50">
            <RemoteMenuFlyout />
            <div className="w-[50px] h-[50px] max-sm:hidden">
                <img alt="gSender Logo" src={gSenderIcon} />
            </div>

            <Connection />

            <MachineInfo />

            <NotificationsArea />

            <MachineStatus />

            <StatusIcons />

            <SpindleLaserStatus />
        </div>
    );
};
