import { PinIndicator } from 'app/features/MachineInfo/PinRow.tsx';
import get from 'lodash/get';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

export function ProbePinStatus() {
    const status = useSelector(
        (state: RootState) => state.controller.state.status,
    );
    const pinState = get(status, 'pinState', {});
    const probeOn = get(pinState, 'P', false);

    return (
        <div className="flex flex-row items-center gap-2">
            <span className="dark:text-white">P:</span>
            <PinIndicator on={probeOn} />
        </div>
    );
}
