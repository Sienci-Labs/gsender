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
}: BooleanSettingInputProps) {
    return <Toggle checked={value} onChange={onChange} />;
}
