import Connection from 'app/features/Connection';
import SpindleLaserStatus from 'app/components/SpindleLaserStatus';
import StatusIcons from 'app/features/StatusIcons';
import { RemoteMenuFlyout } from 'app/features/RemoteMode/components/RemoteMenuFlyout.tsx';

import gSenderIcon from './assets/icon-round.png';
import CenterArea from './CenterArea';
import { UnlockButton } from 'app/features/UnlockButton';

export const TopBar = () => {
    return (
        <div className="border p-3 h-14 box-border flex gap-4 max-sm:gap-2 items-center bg-gray-50">
            <RemoteMenuFlyout />
            <div className="w-[40px] h-[40px] max-sm:hidden">
                <img alt="gSender Logo" src={gSenderIcon} />
            </div>

            <Connection />

            <CenterArea />

            <StatusIcons />
            <UnlockButton />

            <SpindleLaserStatus />
        </div>
    );
};
