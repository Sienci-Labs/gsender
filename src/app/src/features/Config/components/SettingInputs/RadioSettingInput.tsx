import {
    RadioGroup,
    RadioGroupItem,
} from 'app/components/shadcn/RadioGroup.tsx';
import { Label } from 'app/components/shadcn/Label.tsx';

export interface RadioSettingInputProps {
    options: string[] | number[];
    value: string | number;
    index: number;
    subIndex: number;
    onChange: (v) => void;
}

export function RadioSettingInput({
    options = [],
    value,
    onChange,
}: RadioSettingInputProps): React.ReactNode {
    value = `${value}`;
    const handler = (e) => {
        onChange(e);
    };
    return (
        <RadioGroup
            defaultValue={`${value}`}
            value={value}
            onValueChange={handler}
        >
            {options.map((o) => (
                <div className="flex flex-row gap-2 items-center">
                    <RadioGroupItem value={`${o}`} />
                    <Label htmlFor={`radio-${o}`}>{o}</Label>
                </div>
            ))}
        </RadioGroup>
    );
}
