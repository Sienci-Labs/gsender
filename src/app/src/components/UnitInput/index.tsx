import { Label } from 'app/components/Label';

export interface UnitInputProps {
    units: string;
    label?: string;
    value: string | number;
}

export function UnitInput({
    units,
    value,
    label,
}: UnitInputProps): JSX.Element {
    return (
        <div className="border border-gray-300 rounded flex flex-row items-stretch flex-1 justify-between pl-2">
            {label && <Label className="flex items-center">{label}</Label>}
            <input
                type="number"
                className="w-[7ch] border-none margin-none p-0 focus:border-none focus:outline-none text-center"
                defaultValue={value}
            />
            <span className="text-gray-500 bg-gray-200 p-1 min-w-12 rounded-tr rounded-br text-center text-sm">
                {units}
            </span>
        </div>
    );
}

export default UnitInput;
