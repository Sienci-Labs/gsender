import { useState } from 'react';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { StepProps } from 'app/features/AccessoryInstaller/types';

export function RestartAndRehome({ onComplete, onUncomplete }: StepProps) {
    const [restarted, setRestarted] = useState<boolean>(false);
    const [rehomed, setRehomed] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const handleRestart = () => {
        controller.command('restart');
        setTimeout(() => {
            setRestarted(true);
        }, 2000);
    };

    const handleRehome = () => {
        controller.command('home');
        setTimeout(() => {
            setRehomed(true);
            onComplete();
        }, 2000);
    };

    const canRehome = isConnected && restarted;
    const canRestart = isConnected && !rehomed;

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
                Restart and Rehome
            </label>
            <p>
                The update spindle settings require a controller reset and to
                rehome the machine before continuing. Restart the controller,
                reconnect in the top-right corner, and then rehome using the
                provided buttons
            </p>

            <StepActionButton
                label={'Restart Controller'}
                runningLabel="Restarting..."
                onApply={handleRestart}
                isComplete={restarted}
                error={error}
                disabled={canRestart}
            />

            <p className="font-bold">AND</p>

            <StepActionButton
                label={'Re-home'}
                runningLabel="Homing..."
                onApply={handleRehome}
                isComplete={rehomed}
                error={error}
                disabled={canRehome}
            />
        </div>
    );
}
