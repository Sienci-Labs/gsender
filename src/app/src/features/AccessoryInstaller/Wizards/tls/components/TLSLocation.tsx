import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { useEffect, useRef, useState } from 'react';
import store from 'app/store';
import controller from 'app/lib/controller.ts';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mapPositionToUnits, in2mm } from 'app/lib/units.ts';
import { IMPERIAL_UNITS } from 'app/constants';
import pubsub from 'pubsub-js';

type Position = { x?: number; y?: number; z?: number };

function mposEquals(a: Position | undefined, b: Position | undefined) {
    if (!a || !b) return a === b;
    return a.x === b.x && a.y === b.y && a.z === b.z;
}

export function TLSLocation({ onComplete, onUncomplete }: StepProps) {
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { units } = useWorkspaceState();
    const mpos = useSelector((state: RootState) => state.controller.mpos);
    const isManuallyEditing = useRef(false);
    const lastSetMposRef = useRef<Position | undefined>(undefined);

    useEffect(() => {
        if (isManuallyEditing.current) return;
        if (!mpos || mpos.x === undefined || mpos.y === undefined || mpos.z === undefined) return;

        if (isComplete && !mposEquals(mpos, lastSetMposRef.current)) {
            setIsComplete(false);
            setSuccess(null);
            onUncomplete();
        }

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
        controller.command(
            'gcode',
            `G21 G10 L2 P9 X${toMM(position.x)} Y${toMM(position.y)}`,
            '$#',
        );
        pubsub.publish('repopulate');
        setSuccess('TLS location set.');
        setIsComplete(true);
        lastSetMposRef.current = mpos;
        onComplete();
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Install the tallest bit you own in your spindle or router.
                Jog until it's positioned just above (10-20mm) the Tool Length Sensor,
                then set the position using the <b>"Set Position"</b> button.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Using your tallest tool gives the most Z-axis clearance above
                the sensor, so its measured position ends up negative — this
                is what lets gSender accurately probe tools of any length
                during a tool change without running out of travel.
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
                    if (isComplete) {
                        setIsComplete(false);
                        setSuccess(null);
                        onUncomplete();
                    }
                }}
                actionButton={
                    <StepActionButton
                        label={'Set Position'}
                        runningLabel="Setting..."
                        onApply={setTLSLocation}
                        isComplete={isComplete}
                        error={error}
                        success={success}
                    />
                }
            />
        </div>
    );
}
