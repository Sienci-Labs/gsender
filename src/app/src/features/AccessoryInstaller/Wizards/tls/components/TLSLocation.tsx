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

export function TLSLocation({ onComplete, onUncomplete }: StepProps) {
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

    const setTLSLocation = () => {
        const toMM = (val: string) =>
            units === IMPERIAL_UNITS ? in2mm(Number(val)) : Number(val);
        store.set('workspace.toolChangePosition', {
            x: toMM(position.x),
            y: toMM(position.y),
            z: toMM(position.z),
        });
        setIsComplete(true);
        onComplete();
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Jog until just above the Tool Length Sensor and set the
                position using the <b>"Set Position"</b> button. Use a long
                tool with extra Z-axis space above the sensor so the Z value
                ends up negative.
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
                        onApply={setTLSLocation}
                        isComplete={isComplete}
                        error={error}
                    />
                }
            />
        </div>
    );
}
