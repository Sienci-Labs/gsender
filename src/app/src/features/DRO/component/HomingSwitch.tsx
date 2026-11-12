import Button from 'app/components/Button';
import { Switch } from 'app/components/shadcn/Switch';
import Tooltip from 'app/components/Tooltip';
import { homeMachine } from 'app/features/DRO/utils/DRO.ts';
import { useAppTranslation } from 'app/i18n';
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
    const { t } = useAppTranslation();
    return (
        <>
            <Tooltip
                content={t('workspace:dro.homing.toggleSingleAxis')}
                side="bottom"
            >
                <div className="flex items-center">
                    <Switch
                        onChange={onChange}
                        checked={homingValue}
                        disabled={disabled}
                        className={cn({ hidden: !singleAxisHoming })}
                        aria-label={t('workspace:dro.homing.toggleSingleAxis')}
                    />
                </div>
            </Tooltip>

            <Tooltip
                content={t('workspace:dro.homing.runTooltip')}
                side="bottom"
            >
                <Button
                    variant="primary"
                    onClick={homeMachine}
                    disabled={disabled}
                    size="responsive"
                >
                    {t('workspace:dro.homing.home')}
                </Button>
            </Tooltip>
        </>
    );
}
