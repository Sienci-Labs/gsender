import Switch from 'app/components/Switch';
import Button from 'app/components/Button';
import { homeMachine } from 'app/features/DRO/utils/DRO.ts';
import cn from 'classnames';

interface HomingSwitchProps {
    onChange: () => void;
    homingValue: boolean;
    disabled: boolean;
    singleAxisHoming: boolean;
}

export function HomingSwitch({
    onChange,
    homingValue,
    disabled,
    singleAxisHoming,
}: HomingSwitchProps) {
    return (
        <>
            <Switch
                onChange={onChange}
                checked={homingValue}
                disabled={disabled}
                className={cn({ hidden: !singleAxisHoming })}
            />
            <Button size="sm" variant="primary" onClick={homeMachine} disabled={disabled}>
                Home
            </Button>
        </>
    );
}
