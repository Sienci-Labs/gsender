import { Button } from 'app/components/Button';
import controller from 'app/lib/controller.ts';

export function SpindleWizard() {
    function startSpindle() {
        controller.command('gcode', 'M3 S1000');
    }
    function stopSpindle() {
        controller.command('gcode', 'M5 S0');
    }

    return (
        <div className="flex flex-row gap-2 items-center">
            <Button color="primary" onClick={startSpindle}>
                M3
            </Button>
            <Button color="primary" onClick={stopSpindle}>
                M5
            </Button>
        </div>
    );
}
