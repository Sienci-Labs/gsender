import {Axis} from "app/features/DRO/utils/DRO.ts";
import {Button} from "app/components/Button";
import {zeroWCS,  gotoZero} from "../utils/DRO.ts";

interface AxisRowProps {
    axis: Axis
    mpos: number,
    wpos: number
}

export function AxisRow({axis, mpos, wpos}: AxisRowProps) {
    return (
        <div className="border border-gray-200 rounded w-full flex flex-row items-stretch justify-between flex-1">
            <Button
                onClick={() => {zeroWCS(axis, 0)}}
            >
                <span className="font-bold font-mono text-xl text-slate-800">
                    {axis}
                </span>
            </Button>

            <span className="text-xl flex items-center text-blue-500 font-bold font-mono w-[9ch] text-center">{wpos}</span>

            <span className="font-mono flex items-center text-gray-600 w-[9ch] text-center">{mpos}</span>

            <Button
                onClick={() => gotoZero(axis)}
                color="primary"
            >
                <span className="text-lg font-mono">{axis}0</span>
            </Button>
        </div>
    )
}
