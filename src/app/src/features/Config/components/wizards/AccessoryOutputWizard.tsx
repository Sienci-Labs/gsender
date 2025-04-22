import { Button } from 'app/components/Button';
import controller from 'app/lib/controller.ts';

export function AccessoryOutputWizard() {
    function sendCommand(command) {
        controller.command('gcode', command);
    }

    return (
        <div className="flex flex-row gap-2 items-center">
            <Button variant={'primary'} onClick={() => sendCommand('M3')}>
                M3
            </Button>
            <Button variant={'primary'} onClick={() => sendCommand('M4')}>
                M4
            </Button>
            <Button variant={'primary'} onClick={() => sendCommand('M5')}>
                M5
            </Button>
            |
            <Button variant={'primary'} onClick={() => sendCommand('M7')}>
                M7
            </Button>
            <Button variant={'primary'} onClick={() => sendCommand('M8')}>
                M8
            </Button>
            <Button variant={'primary'} onClick={() => sendCommand('M9')}>
                M9
            </Button>
        </div>
    );
}
