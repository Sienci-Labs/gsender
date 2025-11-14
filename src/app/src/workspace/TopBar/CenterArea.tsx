import MachineInfo from 'app/features/MachineInfo';
import MachineStatus from 'app/features/MachineStatus/MachineStatus';

import NotificationsArea from '../../features/NotificationsArea';

const CenterArea = () => {
    return (
        <div className="absolute top-0 left-0 flex gap-4 items-center w-full h-14 max-xl:h-12 max-sm:pointer-events-none">
            <div className="absolute flex gap-4 items-center top-5 max-xl:top-3 left-1/2 right-1/2 -ml-56 w-max">
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
