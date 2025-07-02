import { Switch } from 'app/components/shadcn/Switch';

interface BooleanSettingInputProps {
    value: boolean;
    index: number;
    subIndex: number;
    onChange: (value: boolean) => void;
}

export function BooleanSettingInput({
    value = false,
    onChange,
    disabled = () => false,
}: BooleanSettingInputProps) {
    const isDisabled = disabled();
    return (
        <div className="flex justify-end">
            <Switch checked={value} onChange={onChange} disabled={isDisabled} />
        </div>
    );
}
