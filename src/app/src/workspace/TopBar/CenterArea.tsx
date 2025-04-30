import MachineInfo from 'app/features/MachineInfo';
import MachineStatus from 'app/features/MachineStatus/MachineStatus';

import NotificationsArea from '../../features/NotificationsArea';
import { UnlockButton } from 'app/features/UnlockButton';

const CenterArea = () => {
    return (
        <div className="absolute top-0 left-0 flex gap-4 items-center w-full h-14">
            <div className="absolute flex gap-4 items-center top-5 left-1/2 right-1/2 -ml-56 w-max">
                <NotificationsArea />

                <MachineInfo />
            </div>

            <div className="absolute top-0 left-1/2 right-1/2">
                <MachineStatus />
            </div>
        </div>
    );
};

export default CenterArea;
