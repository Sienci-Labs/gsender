import Connection from 'app/features/Connection';
import SpindleLaserStatus from 'app/components/SpindleLaserStatus';
import StatusIcons from 'app/features/StatusIcons';
import { RemoteMenuFlyout } from 'app/features/RemoteMode/components/RemoteMenuFlyout.tsx';

import gSenderIcon from './assets/icon-round.png';
import CenterArea from './CenterArea';
import { IconUpdater } from 'app/features/IconUpdater';

export const TopBar = () => {
    return (
        <div className="border p-3 h-14 box-border flex gap-4 max-sm:gap-2 items-center bg-gray-50 dark:bg-dark dark:border-gray-700">
            <RemoteMenuFlyout />
            <IconUpdater />

            <Connection />

            <CenterArea />

            <StatusIcons />

            <SpindleLaserStatus />
        </div>
    );
};
