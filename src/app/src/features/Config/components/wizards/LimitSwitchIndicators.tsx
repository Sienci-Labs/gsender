import { PinIndicator } from 'app/features/MachineInfo/PinRow.tsx';
import type { RootState } from 'app/store/redux';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

// Select each pin rather than the status object, which is replaced on every
// status report
const selectPin = (pin: string) => (state: RootState) =>
    Boolean(get(state.controller.state.status, ['pinState', pin], false));

export function LimitSwitchIndicators() {
    const aAxis = useSelector(selectPin('A'));
    const xAxis = useSelector(selectPin('X'));
    const yAxis = useSelector(selectPin('Y'));
    const zAxis = useSelector(selectPin('Z'));

    return (
        <div className="flex flex-row items-center gap-2 dark:text-content-primary">
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-content-primary">X:</span>
                <PinIndicator on={xAxis} />
            </div>
            |
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-content-primary">Y:</span>
                <PinIndicator on={yAxis} />
            </div>
            |
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-content-primary">Z:</span>
                <PinIndicator on={zAxis} />
            </div>
            |
            <div className="flex flex-row gap-2 items-center">
                <span className="dark:text-content-primary">A:</span>
                <PinIndicator on={aAxis} />
            </div>
        </div>
    );
}
