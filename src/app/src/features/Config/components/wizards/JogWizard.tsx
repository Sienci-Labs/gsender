import { useAppTranslation } from 'app/i18n';
import Button from 'app/components/Button';
import controller from 'app/lib/controller.ts';

interface JogWizardProps {
    axis: string;
    disabled: boolean;
}

export function JogWizard({
    axis,
    disabled = false,
}: JogWizardProps): JSX.Element {
    const { t } = useAppTranslation();
    const jogPlus = () => {
        controller.command('gcode', `$J=G21G91${axis}10F1000`);
    };
    const jogMinus = () => {
        controller.command('gcode', `$J=G21G91${axis}-10F1000`);
    };
    return (
        <div className="flex flex-row gap-4 items-center">
            <Button variant="primary" disabled={disabled} onClick={jogMinus}>
                {t('config:wizards.jogMinus', { axis })}
            </Button>
            <Button variant="primary" disabled={disabled} onClick={jogPlus}>
                {t('config:wizards.jogPlus', { axis })}
            </Button>
        </div>
    );
}
