import Connection from 'app/features/Connection';
import SpindleLaserStatus from 'app/components/SpindleLaserStatus';
import StatusIcons from 'app/features/StatusIcons';
import { RemoteMenuFlyout } from 'app/features/RemoteMode/components/RemoteMenuFlyout.tsx';
import CenterArea from './CenterArea';
import { IconUpdater } from 'app/features/IconUpdater';
import api from 'app/api';
import { useEffect } from 'react';
import store from 'app/store';

interface Props {
    isRemoteWindow?: boolean;
}

export const TopBar = ({ isRemoteWindow }: Props) => {
    useEffect(() => {
        // sync gSender preferences from main window
        if (isRemoteWindow) {
            store.syncPrefs();
        }
    }, []);
    return (
        <div className="border p-3 h-14 max-xl:h-12 max-xl:p-2 box-border flex gap-4 max-sm:gap-2 items-center bg-gray-50 dark:bg-dark dark:border-gray-700">
            <RemoteMenuFlyout />
            <IconUpdater />

            <Connection />

            <CenterArea />

            <StatusIcons />

            <SpindleLaserStatus />
        </div>
    );
};
