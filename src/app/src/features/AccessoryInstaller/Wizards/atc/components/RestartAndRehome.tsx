import { useEffect, useState } from 'react';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { StepProps } from 'app/features/AccessoryInstaller/types';
import {GRBL_ACTIVE_STATE_ALARM} from "app/constants";

export function RestartAndRehome({ onComplete, onUncomplete }: StepProps) {
    const [rehomed, setRehomed] = useState<boolean>(false);
    const [clickedRehome, setClickedRehome] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const hasHomed = useTypedSelector(
        (state: RootState) => state.controller.hasHomed,
    );

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const activeState= useTypedSelector((state: RootState) => state.controller.state.status?.activeState);
    const alarmCode = Number(useTypedSelector((state: RootState) => state.controller.state.status?.alarmCode));

    useEffect(() => {
        if (clickedRehome && hasHomed) {
            setRehomed(true)
            onComplete(); // onComplete when we have clicked and rehoming is done
        }
    }, [hasHomed, clickedRehome]);

    useEffect(() => {
        if (activeState === GRBL_ACTIVE_STATE_ALARM && alarmCode === 9) {
            setError('Homing failed.');
            setTimeout(() => {
                setError(null);
            }, 2500)
        }
    }, [activeState, alarmCode]);

    const handleRehome = () => {
        setClickedRehome(true);
        controller.command('homing');
    };

    const canRehome = isConnected;

    return (
        <div className="flex flex-col gap-5 justify-start">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Rehome
            </label>
            <p className="dark:text-white">
                The updated homing location requires you to rehome the machine
                before continuing. Re-home using the provided buttons
            </p>

            <StepActionButton
                label={'Re-home'}
                runningLabel="Homing..."
                onApply={handleRehome}
                isComplete={rehomed}
                error={error}
                disabled={!canRehome}
            />
        </div>
    );
}
