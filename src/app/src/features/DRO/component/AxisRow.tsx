import {Axis} from "app/features/DRO/utils/DRO.ts";
import {Button} from "app/components/Button";

interface AxisRowProps {
    axis: Axis
}

export function AxisRow({axis}: AxisRowProps) {
    return (
        <div className="border border-gray-200 rounded w-full flex flex-row items-stretch justify-between flex-1">
            <Button>
                <span className="font-bold text-3xl text-slate-800">
                    {axis}
                </span>
            </Button>

            <span className="text-xl flex items-center text-blue-500 font-bold font-mono">0.000</span>

            <span className="font-mono flex items-center text-gray-600">0.000</span>

            <Button color="primary">
                <span className="text-lg font-mono">{axis}0</span>
            </Button>
        </div>
    )
}
