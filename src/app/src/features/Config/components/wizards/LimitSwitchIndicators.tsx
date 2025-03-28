import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import get from 'lodash/get';
import { PinIndicator } from 'app/features/MachineInfo/PinRow.tsx';

export function LimitSwitchIndicators() {
    const status = useSelector(
        (state: RootState) => state.controller.state.status,
    );

    const pinState = get(status, 'pinState', {});
    // Pins we're using
    const aAxis = get(pinState, 'A', false);
    const xAxis = get(pinState, 'X', false);
    const yAxis = get(pinState, 'Y', false);
    const zAxis = get(pinState, 'Z', false);

    return (
        <div className="flex flex-row items-center gap-2 dark:text-white">
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-white">X:</span>
                <PinIndicator on={xAxis} />
            </div>
            |
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-white">Y:</span>
                <PinIndicator on={yAxis} />
            </div>
            |
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-white">Z:</span>
                <PinIndicator on={zAxis} />
            </div>
            |
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-white">A:</span>
                <PinIndicator on={aAxis} />
            </div>
        </div>
    );
}
