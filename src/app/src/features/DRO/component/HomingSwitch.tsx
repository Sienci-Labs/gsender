import { Switch } from 'app/components/shadcn/Switch';
import Button from 'app/components/Button';
import { homeMachine } from 'app/features/DRO/utils/DRO.ts';
import cn from 'classnames';
import Tooltip from 'app/components/Tooltip';

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
            <Tooltip content="Toggle single axis homing" side="bottom">
                <div className="flex items-center">
                    <Switch
                        onChange={onChange}
                        checked={homingValue}
                        disabled={disabled}
                        className={cn({ hidden: !singleAxisHoming })}
                    />
                </div>
            </Tooltip>

            <Tooltip content="Run homing" side="bottom">
                <Button
                    size="sm"
                    variant="primary"
                    onClick={homeMachine}
                    disabled={disabled}
                >
                    Home
                </Button>
            </Tooltip>
        </>
    );
}
