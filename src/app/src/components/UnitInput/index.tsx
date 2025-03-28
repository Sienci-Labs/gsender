import { Label } from 'app/components/Label';
import { Input } from 'app/components/Input';

export interface UnitInputProps {
    units: string;
    label?: string;
    value: string | number;
    onChange: (value: number) => void;
}

export function UnitInput({
    units,
    value,
    label,
    onChange,
}: UnitInputProps): JSX.Element {
    return (
        <div className="border border-gray-300 rounded flex flex-row items-stretch flex-1 justify-between pl-2">
            {label && <Label className="flex items-center">{label}</Label>}
            <Input
                type="number"
                className="w-[7ch] border-none margin-none p-0 focus:border-none focus:outline-none text-center"
                value={value}
                onChange={onChange}
                suffix={units}
            />
        </div>
    );
}

export default UnitInput;
