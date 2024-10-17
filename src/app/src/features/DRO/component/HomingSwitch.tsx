import Switch from 'app/components/Switch';
import Button from 'app/components/Button';
import { homeMachine } from 'app/features/DRO/utils/DRO.ts';

interface HomingSwitchProps {
    onChange: () => void;
    homingValue: boolean;
}

export function HomingSwitch({ onChange, homingValue }: HomingSwitchProps) {
    return (
        <>
            <Switch onChange={onChange} checked={homingValue} />
            <Button color="alt" onClick={homeMachine}>
                Home
            </Button>
        </>
    );
}
