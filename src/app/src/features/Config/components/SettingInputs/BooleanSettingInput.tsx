import Toggle from 'app/components/Switch/Toggle.tsx';

interface BooleanSettingInputProps {
    value: boolean;
}

export function BooleanSettingInput({
    value = false,
}: BooleanSettingInputProps) {
    if (value) {
        console.log('FOUND TRUE');
    }
    return <Toggle checked={value} />;
}
