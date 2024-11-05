import {
    RadioGroup,
    RadioGroupItem,
} from 'app/components/shadcn/RadioGroup.tsx';
import { Label } from 'app/components/shadcn/Label.tsx';

export interface RadioSettingInputProps {
    options: string[] | number[];
}

export function RadioSettingInput({
    options = [],
}: RadioSettingInputProps): React.ReactNode {
    return (
        <RadioGroup>
            {options.map((o) => (
                <div className="flex flex-row gap-2 items-center">
                    <RadioGroupItem value={`${o}`} />
                    <Label htmlFor={`radio-${o}`}>{o}</Label>
                </div>
            ))}
        </RadioGroup>
    );
}
