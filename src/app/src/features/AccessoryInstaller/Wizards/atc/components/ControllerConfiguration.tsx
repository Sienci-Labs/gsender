import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { StepProps } from 'app/features/AccessoryInstaller/types';
import { useState } from 'react';
import controller from 'app/lib/controller.ts';
import store from 'app/store';

export function ControllerConfiguration({
    onComplete,
    onUncomplete,
}: StepProps) {
    const [error, setError] = useState<string>('');
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const applySettings = async () => {
        // Also setup gSender settings :)
        // Enable ATCI tab, enable spindle tab, set TC strategy to ignore
        store.set('workspace.atcEnabled', true);
        store.set('workspace.toolChangeOption', 'Ignore');
        store.set('workspace.toolChange.passthrough', true);
        // Use macro for controller settings
        controller.command('gcode', 'G65 P999');
        setTimeout(() => {
            setIsComplete(true);
            onComplete();
        }, 2000);
    };

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p className="dark:text-white">
                The following controller settings are required to ensure
                compatibility with the Sienci ATC.
            </p>
            <ul
                className="list-disc list-inside"
                style={{ fontSize: '1.1rem' }}
            >
                <li>Homing direction</li>
                <li>Tool number persistence</li>
                <li>Input and output pin settings</li>
                <li>Spindle VFD</li>
                <li>Startup gcode</li>
                <li>etc.</li>
            </ul>

            <p className="dark:text-white">
                Select “Apply Settings” to apply these changes.
            </p>
            <StepActionButton
                label={'Apply'}
                runningLabel="Applying..."
                onApply={applySettings}
                isComplete={isComplete}
                error={error}
            />
        </div>
    );
}
