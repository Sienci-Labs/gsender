import MachineStatus from 'app/features/MachineStatus/MachineStatus';
import gSenderIcon from './assets/icon-round.png';
import Connection from "app/features/Connection";

export const TopBar = () => {
    return <div className="border p-3 h-16 box-borde flex gap-4 items-center bg-gray-50">
        <div className="w-[50px] h-[50px]">
            <img alt="gSender Logo" src={gSenderIcon}/>
        </div>
        <Connection />
        <MachineStatus />
    </div>;
};
