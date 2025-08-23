import { ControlledInput } from 'app/components/ControlledInput';
import { IMPERIAL_UNITS } from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { convertToImperial, convertToMetric } from 'app/lib/units';
export interface NumberSettingInputProps {
    unit?: string;
    value: number;
    index: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
}

export function NumberSettingInput({
    unit = null,
    value = 0,
    min = null,
    max = null,
    onChange,
}: NumberSettingInputProps) {
    const { units } = useWorkspaceState();
    let needsConvert = unit === 'variable' && units === IMPERIAL_UNITS;
    let convertedValue = value;
    if (needsConvert) {
        convertedValue = convertToImperial(value);
    }
    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 rounded-md">
            <ControlledInput
                type="number"
                value={convertedValue}
                className="flex-1 p-2 focus:outline-none"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (needsConvert) {
                        onChange(convertToMetric(e.target.valueAsNumber));
                    } else {
                        onChange(e.target.valueAsNumber);
                    }
                }}
                suffix={unit === 'variable' ? units : unit}
                min={min}
                max={max}
            />
        </div>
    );
}
