interface JogWizardProps {
    axis: string;
    disabled: boolean;
}

export function JogWizard({axis, disabled}: JogWizardProps): JSX.Element {
    return (<div>
        <button>Left</button>
        <button>Right</button>
    </div>)
}
