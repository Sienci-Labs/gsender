import Toggle from 'app/components/Switch/Toggle.tsx';

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
    return <Toggle checked={value} onChange={onChange} disabled={isDisabled} />;
}
