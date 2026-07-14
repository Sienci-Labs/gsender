import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { useEffect, useRef, useState } from 'react';
import store from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mapPositionToUnits, in2mm } from 'app/lib/units.ts';
import { IMPERIAL_UNITS } from 'app/constants';
import pubsub from 'pubsub-js';

export function ManualToolChangePosition({
    onComplete,
    onUncomplete,
}: StepProps) {
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { units } = useWorkspaceState();
    const mpos = useSelector((state: RootState) => state.controller.mpos);
    const isManuallyEditing = useRef(false);

    useEffect(() => {
        if (isManuallyEditing.current) return;
        if (!mpos || !mpos.x || !mpos.y || !mpos.z) return;
        const { x, y, z } = mpos;
        setPosition({
            x: mapPositionToUnits(x, units),
            y: mapPositionToUnits(y, units),
            z: mapPositionToUnits(z, units),
        });
    }, [mpos, units]);

    const [position, setPosition] = useState({ x: '0', y: '0', z: '0' });

    const setManualPosition = () => {
        const toMM = (val: string) =>
            units === IMPERIAL_UNITS ? in2mm(Number(val)) : Number(val);
        store.set('workspace.toolChange.manualPosition', {
            x: toMM(position.x),
            y: toMM(position.y),
            z: toMM(position.z),
        });
        pubsub.publish('repopulate');
        setIsComplete(true);
        onComplete();
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Jog to the location you'd like the machine to move to for
                manual tool changes, then set the position using the{' '}
                <b>"Set Position"</b> button.
            </p>
            <PositionSetter
                showZ={true}
                xPosition={position.x}
                yPosition={position.y}
                zPosition={position.z}
                units={units}
                onPositionChange={(positions) => {
                    isManuallyEditing.current = true;
                    setPosition(positions);
                }}
                actionButton={
                    <StepActionButton
                        label={'Set Position'}
                        runningLabel="Setting..."
                        onApply={setManualPosition}
                        isComplete={isComplete}
                        error={error}
                    />
                }
            />
        </div>
    );
}
