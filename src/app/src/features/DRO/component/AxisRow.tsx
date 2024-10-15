import {Axis, handleManualOffset} from 'app/features/DRO/utils/DRO.ts';
import { Button } from 'app/components/Button';
import { zeroWCS, gotoZero } from '../utils/DRO.ts';
import { WCSInput } from 'app/features/DRO/component/WCSInput.tsx';

interface AxisRowProps {
    axis: Axis;
    mpos: number;
    wpos: number;
    disabled: boolean;
}

export function AxisRow({ axis, mpos, wpos, disabled }: AxisRowProps) {
    return (
        <div className="border border-gray-200 rounded w-full flex flex-row items-stretch justify-between flex-1">
            <Button
                onClick={() => {
                    zeroWCS(axis, 0);
                }}
                disabled={disabled}
            >
                <span className="font-bold font-mono text-xl text-slate-800">
                    {axis}
                </span>
            </Button>

            <WCSInput disabled={disabled} value={wpos} axis={axis} movementHandler={handleManualOffset}/>

            <span className="font-mono flex items-center text-gray-600 w-[9ch] text-center">
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
