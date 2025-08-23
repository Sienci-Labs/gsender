import Button from 'app/components/Button';
import { FiTarget } from 'react-icons/fi';
import { ControlledInput } from 'app/components/ControlledInput';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { FaChartLine } from 'react-icons/fa';
import controller from 'app/lib/controller.ts';

export interface LocationInputProps {
    value: object;
    onChange: (value: object) => void;
    unit: string;
}

export function LocationInput({
    value = {
        x: 0,
        y: 0,
        z: 0,
    },
    onChange,
    unit,
}: LocationInputProps) {
    const mpos = useSelector((state: RootState) => state.controller.mpos);
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    function grabLocation() {
        const location = {
            x: Number(mpos.x),
            y: Number(mpos.y),
            z: Number(mpos.z),
        };
        onChange(location);
    }

    function gotoLocation() {
        const code = [];
        const location = value;
        code.push(
            `G53 G0 Z-1`,
            `G53 G0 X${location.x} Y${location.y}`,
            `G53 G0 Z${location.z}`,
        );
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
                <span className="text-md">X:</span>
                <ControlledInput
                    value={value.x}
                    type="number"
                    onChange={(e) => updateSpecificAxes(e, 'x')}
                    suffix={unit}
                />
            </div>
            <div className="flex flex-row gap-2 items-center">
                <span className="text-md">Y:</span>
                <ControlledInput
                    value={value.y}
                    type="number"
                    onChange={(e) => updateSpecificAxes(e, 'y')}
                    suffix={unit}
                />
            </div>
            <div className="flex flex-row gap-2 items-center">
                <span className="text-md">Z:</span>
                <ControlledInput
                    value={value.z}
                    type="number"
                    onChange={(e) => updateSpecificAxes(e, 'z')}
                    suffix={unit}
                />
            </div>
            <div className="flex flex-row justify-between">
                <Button
                    className="flex flex-row gap-2 items-center"
                    onClick={grabLocation}
                    disabled={!isConnected}
                >
                    <FiTarget />
                    Grab
                </Button>
                <Button
                    disabled={!isConnected}
                    variant="primary"
                    className="flex flex-row gap-2 items-center"
                    onClick={gotoLocation}
                >
                    {' '}
                    <FaChartLine />
                    Go To
                </Button>
            </div>
        </div>
    );
}
