import Button from 'app/components/Button';
import controller from 'app/lib/controller.ts';

function startLaser() {
    controller.command('gcode', 'G1F1 M3 S1');
}
function stopLaser() {
    controller.command('gcode', 'M5 S0');
}

export function LaserWizard() {
    return (
        <div className="flex flex-row gap-2 items-center">
            <Button variant="primary" onClick={startLaser}>
                Laser On
            </Button>
            <Button variant="primary" onClick={stopLaser}>
                Laser Off
            </Button>
        </div>
    );
}
