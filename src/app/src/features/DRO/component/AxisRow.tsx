import {
    Axis,
    handleManualOffset,
    homeAxis,
} from 'app/features/DRO/utils/DRO.ts';
import { Button } from 'app/components/Button';
import { zeroWCS, gotoZero } from '../utils/DRO.ts';
import { WCSInput } from 'app/features/DRO/component/WCSInput.tsx';

interface AxisRowProps {
    axis: Axis;
    mpos: string;
    wpos: string;
    disabled: boolean;
    key: string;
    homingMode: boolean;
}

export function AxisRow({
    axis,
    mpos,
    wpos,
    disabled,
    homingMode,
}: AxisRowProps) {
    return (
        <div className="border border-gray-200 rounded w-full flex flex-row items-stretch justify-between flex-1">
            <Button
                onClick={() => {
                    if (homingMode) {
                        homeAxis(axis);
                    } else {
                        zeroWCS(axis, 0);
                    }
                }}
                disabled={disabled}
                color={homingMode ? 'alt' : 'secondary'}
                className={"px-5"}
            >
                <span className="font-bold font-mono text-xl transition-all transition-duration-300">
                    {axis}
                </span>
            </Button>

            <WCSInput
                disabled={disabled}
                value={wpos}
                axis={axis}
                movementHandler={handleManualOffset}
            />

            <span className="font-mono flex items-center text-sm text-gray-400 w-[9ch] text-center">
                {mpos}
            </span>

            <Button
                disabled={disabled}
                onClick={() => gotoZero(axis)}
                color="alt"
            >
                <span className="text-lg font-mono">{axis}0</span>
            </Button>
        </div>
    );
}
