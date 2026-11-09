import { useAppTranslation } from 'app/i18n';
import Button from 'app/components/Button';
import controller from 'app/lib/controller.ts';

function startLaser() {
    controller.command('gcode', 'G1F1 M3 S1');
}
function stopLaser() {
    controller.command('gcode', 'M5 S0');
}

export function LaserWizard() {
    const { t } = useAppTranslation();
    return (
        <div className="flex flex-row gap-2 items-center">
            <Button variant="primary" onClick={startLaser}>
                {t('config:wizards.laserOn')}
            </Button>
            <Button variant="primary" onClick={stopLaser}>
                {t('config:wizards.laserOff')}
            </Button>
        </div>
    );
}
