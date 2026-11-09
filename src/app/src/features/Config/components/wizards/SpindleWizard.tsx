import { useAppTranslation } from 'app/i18n';
import { Button } from 'app/components/Button';
import autoSpinIcon from 'app/features/Config/assets/images/autospin.svg';
import controller from 'app/lib/controller.ts';
import type { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

function startSpindle() {
    controller.command('gcode', 'M3 S1000');
}
function startSpindleCCW() {
    controller.command('gcode', 'M4 S1000');
}
function stopSpindle() {
    controller.command('gcode', 'M5 S0');
}

function AutoSpinIcon() {
    const { t } = useAppTranslation();
    return (
        <img
            src={autoSpinIcon}
            alt={t('config:wizards.autoSpinIcon')}
            className="h-7 w-7 text-blue-600 dark:text-blue-400 fill-blue-500"
        />
    );
}

export function SpindleWizard() {
    const { t } = useAppTranslation();
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const navigate = useNavigate();

    return (
        <div className="flex flex-row gap-2 items-center">
            <Button variant="primary" onClick={startSpindle}>
                {t('config:wizards.spindleForward')}
            </Button>
            <Button variant="primary" onClick={startSpindleCCW}>
                {t('config:wizards.spindleReverse')}
            </Button>
            <Button variant="primary" onClick={stopSpindle}>
                {t('config:wizards.spindleStop')}
            </Button>
            |
            <Button
                onClick={() =>
                    navigate('/tools/accessoryInstall/autospin/autospin-config')
                }
                className={'flex flex-row justify-start'}
                disabled={!connected}
            >
                <AutoSpinIcon />
                {t('config:wizards.setupAutoSpin')}
            </Button>
        </div>
    );
}
