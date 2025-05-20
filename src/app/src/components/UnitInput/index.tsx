import cx from 'classnames';

import { Label } from 'app/components/Label';
import { Input } from 'app/components/Input';

export interface UnitInputProps {
    units: string;
    label?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

export function UnitInput({
    units,
    value,
    label,
    disabled,
    onChange,
}: UnitInputProps) {
    return (
        <div
            className={cx(
                'border border-gray-300 rounded flex flex-row items-stretch flex-1 justify-between pl-2',
                {
                    'opacity-50': disabled,
                },
            )}
        >
            {label && <Label className="flex items-center">{label}</Label>}
            <Input
                type="number"
                className="w-[7ch] border-none margin-none p-0 focus:border-none focus:outline-none text-center"
                value={disabled ? '0' : value}
                onChange={onChange}
                suffix={units}
                disabled={disabled}
            />
        </div>
    );
}

export default UnitInput;
