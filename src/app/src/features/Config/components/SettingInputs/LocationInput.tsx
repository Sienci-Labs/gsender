import Button from 'app/components/Button';
import { FiTarget } from 'react-icons/fi';
import { Input } from 'app/components/Input';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { FaChartLine } from "react-icons/fa";
import controller from "app/lib/controller.ts";

export interface LocationInputProps {
    value: object;
    onChange: (value: object) => void;
}

export function LocationInput({
    value = {
        x: 0,
        y: 0,
        z: 0,
    },
    onChange,
}: LocationInputProps) {
    const mpos = useSelector((state: RootState) => state.controller.mpos);

    function grabLocation() {
        const location = {
            x: Number(mpos.x),
            y: Number(mpos.y),
            z: Number(mpos.z),
        };
        onChange(location);
    }

    function gotoLocation() {
        const code = []
        const location = value
        code.push(
            `G53 G0 Z-1`,
            `G53 G0 X${location.x} Y${location.y}`,
            `G53 G0 Z${location.z}`
        )
        controller.command('gcode', code);
    }

    function updateSpecificAxes(e, axis: string) {
        const loc = Number(e.target.value);

        const location = {
            ...value,
            [axis]: loc,
        };
        onChange(location);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
                <span className="text-lg">X:</span>
                <Input
                    value={value.x}
                    onChange={(e) => updateSpecificAxes(e, 'x')}
                />
            </div>
            <div className="flex flex-row gap-2 items-center">
                <span className="text-lg">Y:</span>
                <Input
                    value={value.y}
                    onChange={(e) => updateSpecificAxes(e, 'y')}
                />
            </div>
            <div className="flex flex-row gap-2 items-center">
                <span className="text-lg">Z:</span>
                <Input
                    value={value.z}
                    onChange={(e) => updateSpecificAxes(e, 'z')}
                />
            </div>
            <div className="flex flex-row justify-between">
                <Button
                    className="flex flex-row gap-2 items-center"
                    onClick={grabLocation}
                >
                    <FiTarget />
                    Grab
                </Button>
                <Button variant="primary" className="flex flex-row gap-2 items-center" onClick={gotoLocation}> <FaChartLine />Go To</Button>
            </div>

        </div>
    );
}
