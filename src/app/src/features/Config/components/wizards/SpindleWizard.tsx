import { Button } from 'app/components/Button';
import controller from 'app/lib/controller.ts';

function startSpindle() {
    controller.command('gcode', 'M3 S1000');
}
function startSpindleCCW() {
    controller.command('gcode', 'M4 S1000');
}
function stopSpindle() {
    controller.command('gcode', 'M5 S0');
}

export function SpindleWizard() {
    return (
        <div className="flex flex-row gap-2 items-center">
            <Button variant="primary" onClick={startSpindle}>
                For
            </Button>
            <Button variant="primary" onClick={startSpindleCCW}>
                Rev
            </Button>
            <Button variant="primary" onClick={stopSpindle}>
                Stop
            </Button>
        </div>
    );
}
