import MachineInfo from 'app/features/MachineInfo';
import MachineStatus from 'app/features/MachineStatus/MachineStatus';

import NotificationsArea from './NotificationsArea';
import { UnlockButton } from 'app/features/UnlockButton';

const CenterArea = () => {
    return (
        <div className="absolute top-0 left-1/2 flex gap-4 items-center">
            <div className="absolute flex gap-4 items-center -left-40 xl:-left-44 top-5">
                <NotificationsArea />

                <MachineInfo />
            </div>

            <div className="relative">
                <MachineStatus />
            </div>
        </div>
    );
};

export default CenterArea;
