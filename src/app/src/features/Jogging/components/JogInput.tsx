import { Label } from 'app/components/Label';
import { ControlledInput } from 'app/components/ControlledInput';

interface JogInputProps {
    label: string;
    onChange: (step: number) => void;
    currentValue: number | string;
}

export const JogInput = ({ label, currentValue, onChange }: JogInputProps) => {
    return (
        <div className="flex flex-row justify-between items-center gap-2">
            <Label className="w-[3ch] text-right whitespace-nowrap">
                {label}
            </Label>
            <ControlledInput
                sizing="xs"
                type="number"
                value={currentValue}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1"
            />
        </div>
    );
};
