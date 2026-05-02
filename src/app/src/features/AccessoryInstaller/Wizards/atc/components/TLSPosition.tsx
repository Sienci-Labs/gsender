import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { useEffect, useRef, useState } from 'react';
import controller from 'app/lib/controller.ts';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mapPositionToUnits, in2mm } from 'app/lib/units.ts';
import { IMPERIAL_UNITS } from 'app/constants';

export function TLSPosition({ onComplete, onUncomplete }: StepProps) {
    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

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

    const setTLSPosition = () => {
        const toMM = (val: string) =>
            units === IMPERIAL_UNITS ? in2mm(Number(val)) : Number(val);
        controller.command(
            'gcode',
            `G21 G10 L2 P9 X${toMM(position.x)} Y${toMM(position.y)}`,
            '$#',
        );
        setTimeout(() => {
            setIsComplete(true);
            onComplete();
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Please jog until just above the Tool Length Sensor and set the
                position of your tool length sensor using the <b>“Set Position”</b>
                button.
            </p>
            <PositionSetter
                showZ={false}
                xPosition={position.x}
                yPosition={position.y}
                units={units}
                onPositionChange={(positions) => {
                    isManuallyEditing.current = true;
                    setPosition(positions);
                }}
                actionButton={
                    <StepActionButton
                        label={'Set Position'}
                        runningLabel="Setting..."
                        onApply={setTLSPosition}
                        isComplete={isComplete}
                        error={error}
                    />
                }
            />
        </div>
    );
}
