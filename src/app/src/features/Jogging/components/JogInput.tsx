import { Label } from 'app/components/Label';
import { Input } from 'app/components/Input';

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
            <Input
                sizing="xs"
                value={currentValue}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1"
            />
        </div>
    );
};
