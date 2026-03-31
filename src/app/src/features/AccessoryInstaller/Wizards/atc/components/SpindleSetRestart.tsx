import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useState } from 'react';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import {StepProps} from "app/features/AccessoryInstaller/types";

export function SpindleSetRestart({ onComplete, onUncomplete }: StepProps) {
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [hasSetupSpindle, setHasSetupSpindle] = useState<boolean>(false);


    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const canSetupSpindle = isConnected;

    async function configureSpindleEEPROM() {
        controller.command('gcode', [
            '$30=24000',
            '$31=7500',
            '$340=5',
            '$394=11',
            '$539=11',
            '$374=3',
            '$375=50',
            '$681=0',
            '$395=2',
            '$REBOOT',
        ]);
    }



    async function setupSpindleAndReboot() {
        await configureSpindleEEPROM();
        setTimeout(() => {
            setHasSetupSpindle(true);
            onComplete();
        }, 1500);
    }


    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Your spindle settings are applied in this step and the controller will restart automatically.
            </p>
            <ol className="list-decimal">
                <li>
                    Press <b>"Apply And Restart"</b>
                </li>
                <li>Click <b>"Next"</b></li>
            </ol>
            <StepActionButton
                label="Apply and Restart"
                runningLabel="Applying..."
                onApply={setupSpindleAndReboot}
                isComplete={hasSetupSpindle}
                error={error}
                disabled={!canSetupSpindle}
            />
        </div>
    );
}
