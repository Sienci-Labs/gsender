import { Switch } from 'app/components/shadcn/Switch';

interface BooleanSettingInputProps {
    value: boolean | number;
    index: number;
    subIndex?: number;
    onChange: (value: boolean | number) => void;
    disabled?: () => boolean;
    isFirmwareSetting?: boolean;
}

export function BooleanSettingInput({
    value = false,
    onChange,
    disabled = () => false,
    isFirmwareSetting = false,
}: BooleanSettingInputProps) {
    const isDisabled = disabled();

    // Convert value to boolean for display
    const displayValue = isFirmwareSetting
        ? Number(value) === 1
        : Boolean(value);

    // Handle change based on setting type
    const handleChange = (checked: boolean) => {
        if (isFirmwareSetting) {
            // For firmware settings, store 0 or 1
            onChange(checked ? 1 : 0);
        } else {
            // For regular settings, store boolean
            onChange(checked);
        }
    };

    return (
        <div className="flex justify-end">
            <Switch
                checked={displayValue}
                onChange={handleChange}
                disabled={isDisabled}
            />
        </div>
    );
}
