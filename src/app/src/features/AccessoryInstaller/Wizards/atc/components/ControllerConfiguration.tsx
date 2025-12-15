import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { StepProps } from 'app/features/AccessoryInstaller/types';

export function ControllerConfiguration({
    onComplete,
    onUncomplete,
}: StepProps) {
    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
    };

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p>
                The following controller settings are required to ensure
                compatibility with the Sienci ATC.
            </p>
            <ul>
                <li>Homing direction</li>
                <li>Tool number persistence</li>
                <li>Input and output pin settings</li>
                <li>Spindle VFD</li>
                <li>Startup gcode</li>
                <li>etc.</li>
            </ul>

            <p>Select “Apply Settings” to apply these changes.</p>
            <StepActionButton
                label="Apply Settings"
                runningLabel="Applying..."
                onApply={applySettings}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
            />
        </div>
    );
}
