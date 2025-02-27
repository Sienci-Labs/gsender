import controller from 'app/lib/controller.ts';

interface JogWizardProps {
    axis: string;
    disabled: boolean;
}

export function JogWizard({
    axis,
    disabled = false,
}: JogWizardProps): JSX.Element {
    const jogPlus = () => {
        controller.command(`$J=G21G91${axis}10F1000`);
    };
    const jogMinus = () => {
        controller.command(`$J=G21G91${axis}-10F1000`);
    };
    return (
        <div>
            <button disabled={disabled} onClick={jogPlus}>
                Jog ${axis}-10
            </button>
            <button disabled={disabled} onClick={jogMinus}>
                Jog ${axis}+10
            </button>
        </div>
    );
}
