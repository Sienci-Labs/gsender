import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
interface OffsetManagementWidgetProps {
    value?: number;
    onChange?: (value: number) => void;
    defaultValue?: number;
}

export default function OffsetManagementWidget({
    value = 0,
    onChange,
    defaultValue = 0,
}: OffsetManagementWidgetProps) {
    const [internalValue, setInternalValue] = useState(value);

    const currentValue = onChange ? value : internalValue;
    const isDefault = currentValue === defaultValue;

    const handleOffsetModeChange = (nextValue: string) => {
        const parsedValue = parseInt(nextValue, 10) || 0;
        if (onChange) {
            onChange(parsedValue);
        } else {
            setInternalValue(parsedValue);
        }
    };

    return (
        <div
            className={` transition-colors ${
                isDefault ? 'bg-none' : 'bg-yellow-50'
            }`}
        >
            <div className="w-72">
                <Select
                    value={String(currentValue)}
                    onValueChange={handleOffsetModeChange}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent className="z-[10001] bg-white">
                        <SelectItem value="0">
                            Probe new offset after loading
                        </SelectItem>
                        <SelectItem value="1">
                            Use Tool Table offsets without verification
                        </SelectItem>
                        <SelectItem value="2">
                            Use Tool Table Offsets and Probe to verify
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
