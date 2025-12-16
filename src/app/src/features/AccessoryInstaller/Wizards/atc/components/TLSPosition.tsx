import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';

export function TLSPosition({ onComplete, onUncomplete }: StepProps) {
    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p>
                Please jog until just above the Tool Length Sensor and set the
                position of your tool length sensor using the “Set Position”
                button.
            </p>
            <p>
                If you are setting up the TLS for the first time and do not have
                a tool in the spindle, you can align the TLS using the taper of
                the spindle as well.
            </p>
            <StepActionButton
                label="Set Position"
                runningLabel="Setting..."
                onApply={applySettings}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
            />
        </div>
    );
}
