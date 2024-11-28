import Toggle from 'app/components/Switch/Toggle.tsx';

interface BooleanSettingInputProps {
    value: boolean;
    index: number;
    subIndex: number;
}

export function BooleanSettingInput({
    value = false,
}: BooleanSettingInputProps) {
    return <Toggle checked={value} />;
}
