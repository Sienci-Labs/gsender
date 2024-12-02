import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';

export interface SelectSettingInputProps {
    options: string[] | number[];
    index: number;
    subIndex: number;
    value: string | number;
}

export function SelectSettingInput({
    options = [],
    value = '',
}: SelectSettingInputProps): React.ReactNode {
    return (
        <Select>
            <SelectTrigger className="bg-white bg-opacity-100">
                <SelectValue placeholder={`${value}`} />
            </SelectTrigger>
            <SelectContent className="bg-white bg-opacity-100">
                {options.map((o) => (
                    <SelectItem value={`${o}`}>{o}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
