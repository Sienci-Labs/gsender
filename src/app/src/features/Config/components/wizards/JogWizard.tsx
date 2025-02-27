import controller from 'app/lib/controller.ts';
import Button from 'app/components/Button';


interface JogWizardProps {
    axis: string;
    disabled: boolean;
}

export function JogWizard({
    axis,
    disabled = false,
}: JogWizardProps): JSX.Element {
    const jogPlus = () => {
        controller.command('gcode', `$J=G21G91${axis}10F1000`);
    };
    const jogMinus = () => {
        controller.command('gcode', `$J=G21G91${axis}-10F1000`);
    };
    return (
        <div className="flex flex-row gap-4 items-center">
            <Button color="primary" disabled={disabled} onClick={jogMinus}>
                Jog {axis}-
            </Button>
            <Button color="primary" disabled={disabled} onClick={jogPlus}>
                Jog {axis}+
            </Button>
        </div>
    );
}
