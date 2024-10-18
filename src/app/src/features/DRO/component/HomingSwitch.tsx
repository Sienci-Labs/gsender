import Switch from 'app/components/Switch';
import Button from 'app/components/Button';
import { homeMachine } from 'app/features/DRO/utils/DRO.ts';

interface HomingSwitchProps {
    onChange: () => void;
    homingValue: boolean;
    disabled: boolean;
}

export function HomingSwitch({
    onChange,
    homingValue,
    disabled,
}: HomingSwitchProps) {
    return (
        <>
            <Switch
                onChange={onChange}
                checked={homingValue}
                disabled={disabled}
            />
            <Button color="alt" onClick={homeMachine} disabled={disabled}>
                Home
            </Button>
        </>
    );
}
