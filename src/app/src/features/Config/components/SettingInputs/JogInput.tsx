import { ControlledInput } from 'app/components/ControlledInput';
import { IMPERIAL_UNITS } from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { convertToImperial, convertToMetric } from 'app/lib/units';

export interface JogInputProps {
    unit?: string;
    value?: object;
    index: number;
    onChange: (value: object) => void;
}

export function JogInput({ unit, value, index, onChange }: JogInputProps) {
    const { units } = useWorkspaceState();
    const needsConvert = units === IMPERIAL_UNITS;
    let convertedValue = value;

    if (needsConvert) {
        convertedValue = {
            ...convertedValue,
            xyStep: convertToImperial(Number(value.xyStep)),
            zStep: convertToImperial(Number(value.zStep)),
            feedrate: convertToImperial(Number(value.feedrate)),
        };
    }

    // xyStep, aStep, zStep, feedrate = key
    function customJogUpdater(e, key) {
        let updatedValue = Number(e.target.value);
        if (needsConvert) {
            updatedValue = convertToMetric(updatedValue);
        }
        const o = { ...value, [key]: updatedValue };
        onChange(o);
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">XY:</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'xyStep')}
                    suffix={units}
                    value={convertedValue.xyStep}
                />
            </div>
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">Z:</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'zStep')}
                    suffix={units}
                    value={convertedValue.zStep}
                />
            </div>
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">A:</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'aStep')}
                    suffix="deg"
                    value={convertedValue.aStep}
                />
            </div>
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">Speed:</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'feedrate')}
                    suffix={`${units}/min`}
                    value={convertedValue.feedrate}
                />
            </div>
        </div>
    );
}
