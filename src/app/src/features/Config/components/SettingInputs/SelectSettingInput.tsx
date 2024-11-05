import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';

export interface SelectSettingInputProps {
    options: string[] | number[];
}

export function SelectSettingInput({
    options = [],
}: SelectSettingInputProps): React.ReactNode {
    return (
        <Select>
            <SelectTrigger>
                <SelectValue placeholder="125000" />
            </SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem value={`${o}`}>{o}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
