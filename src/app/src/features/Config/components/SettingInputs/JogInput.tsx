import { ControlledInput } from 'app/components/ControlledInput';

export interface JogInputProps {
    unit?: string;
    value?: object;
    index: number;
    onChange: (value: object) => void;
}

export function JogInput({ unit, value, index, onChange }: JogInputProps) {
    // xyStep, aStep, zStep, feedrate = key
    function customJogUpdater(e, key) {
        const updatedValue = Number(e.target.value);
        const o = { ...value, [key]: updatedValue };
        onChange(o);
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">XY</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'xyStep')}
                    suffix="mm"
                    value={value.xyStep}
                />
            </div>
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">Z</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'zStep')}
                    suffix="mm"
                    value={value.zStep}
                />
            </div>
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">A</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'aStep')}
                    suffix="deg"
                    value={value.aStep}
                />
            </div>
            <div className="flex flex-row gap-2 justify-between items-center">
                <span className="min-w-[7ch]">Speed</span>
                <ControlledInput
                    type="number"
                    onChange={(e) => customJogUpdater(e, 'feedrate')}
                    suffix="mm/min"
                    value={value.feedrate}
                />
            </div>
        </div>
    );
}
