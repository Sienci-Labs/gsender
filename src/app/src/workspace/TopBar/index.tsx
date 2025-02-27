import Connection from 'app/features/Connection';
import SpindleLaserStatus from 'app/components/SpindleLaserStatus';
import StatusIcons from 'app/features/StatusIcons';
import { RemoteMenuFlyout } from 'app/features/RemoteMode/components/RemoteMenuFlyout.tsx';

import gSenderIcon from './assets/icon-round.png';
import CenterArea from './CenterArea';

export const TopBar = () => {
    return (
        <div className="border p-3 h-16 box-border flex gap-4 max-sm:gap-2 items-center bg-gray-50">
            <RemoteMenuFlyout />
            <div className="w-[50px] h-[50px] max-sm:hidden">
                <img alt="gSender Logo" src={gSenderIcon} />
            </div>

            <Connection />

            <CenterArea />

            <StatusIcons />

            <SpindleLaserStatus />
        </div>
    );
};
